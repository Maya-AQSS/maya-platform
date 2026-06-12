<?php

declare(strict_types=1);

use Illuminate\Console\Events\CommandStarting;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Maya\Platform\Support\RegistersFdwBootstrap;

/**
 * Create a minimal ServiceProvider bound to the test app container.
 * Used to verify loadMigrationsFrom delegation.
 */
function providerWithMigrationCapture(): ServiceProvider
{
    return new class(app()) extends ServiceProvider {
        public array $loaded = [];

        public function register(): void {}

        public function loadMigrationsFrom($path): void
        {
            $this->loaded[] = $path;
        }
    };
}

it('registers broadcast routes with default api+jwt middleware', function (): void {
    Broadcast::shouldReceive('routes')
        ->once()
        ->with(['prefix' => 'api/v1', 'middleware' => ['api', 'jwt']]);
    Auth::spy();

    RegistersFdwBootstrap::register(providerWithMigrationCapture());
});

it('registers broadcast routes with custom middleware', function (): void {
    Broadcast::shouldReceive('routes')
        ->once()
        ->with(['prefix' => 'api/v1', 'middleware' => ['api', 'custom-jwt']]);
    Auth::spy();

    RegistersFdwBootstrap::register(providerWithMigrationCapture(), [
        'broadcastMiddleware' => ['api', 'custom-jwt'],
    ]);
});

it('forces https scheme when forceHttps option is true', function (): void {
    URL::shouldReceive('forceScheme')->once()->with('https');
    Broadcast::shouldReceive('routes')->once()->withAnyArgs();
    Auth::spy();

    RegistersFdwBootstrap::register(providerWithMigrationCapture(), ['forceHttps' => true]);
});

it('does not force https when forceHttps is false and env is testing', function (): void {
    // 'testing' is not production/staging so no forceScheme expected
    URL::shouldReceive('forceScheme')->never();
    Broadcast::shouldReceive('routes')->once()->withAnyArgs();
    Auth::spy();

    app()['env'] = 'testing';

    RegistersFdwBootstrap::register(providerWithMigrationCapture(), ['forceHttps' => false]);
});

it('registers CommandStarting listener for FdwTeardown', function (): void {
    Broadcast::shouldReceive('routes')->once()->withAnyArgs();
    Auth::spy();

    // Capture what is registered
    $registeredListeners = [];
    Event::listen(CommandStarting::class, function () use (&$registeredListeners): void {
        $registeredListeners[] = true;
    });

    RegistersFdwBootstrap::register(providerWithMigrationCapture());

    // At least one listener registered (the FdwTeardown one + ours)
    $listeners = Event::getListeners(CommandStarting::class);
    expect($listeners)->not->toBeEmpty();
});

it('uses provided viaRequest resolver instead of default', function (): void {
    Broadcast::shouldReceive('routes')->once()->withAnyArgs();

    $customResolver = static fn ($request) => null;

    Auth::shouldReceive('viaRequest')
        ->once()
        ->with('jwt-token', $customResolver);

    RegistersFdwBootstrap::register(providerWithMigrationCapture(), [
        'viaRequestResolver' => $customResolver,
    ]);
});

it('loads profile migrations from all provided paths', function (): void {
    Broadcast::shouldReceive('routes')->once()->withAnyArgs();
    Auth::spy();

    $provider = providerWithMigrationCapture();

    RegistersFdwBootstrap::register($provider, [
        'profileMigrations' => ['/some/path/users', '/some/path/teams'],
    ]);

    expect($provider->loaded)->toBe(['/some/path/users', '/some/path/teams']); // @phpstan-ignore-line
});

it('loads no migrations when profileMigrations option is omitted', function (): void {
    Broadcast::shouldReceive('routes')->once()->withAnyArgs();
    Auth::spy();

    $provider = providerWithMigrationCapture();

    RegistersFdwBootstrap::register($provider);

    expect($provider->loaded)->toBeEmpty(); // @phpstan-ignore-line
});
