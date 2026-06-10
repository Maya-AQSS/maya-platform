<?php

declare(strict_types=1);

namespace Tests;

use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Maya\Translations\Migrations as TranslationMigrations;
use Maya\Translations\Providers\SharedTranslationsServiceProvider;
use Orchestra\Testbench\TestCase as OrchestraTestCase;
use Tests\Fixtures\IntKeyTranslatable;

abstract class TestCase extends OrchestraTestCase
{
    protected function getPackageProviders($app): array
    {
        return [SharedTranslationsServiceProvider::class];
    }

    protected function defineDatabaseMigrations(): void
    {
        $this->loadMigrationsFrom(TranslationMigrations::translations());

        // Tabla del modelo de prueba con clave entera (bigint).
        Schema::create('int_key_translatables', function (Blueprint $table): void {
            $table->id();
            $table->string('name')->nullable();
        });
    }

    protected function defineEnvironment($app): void
    {
        $app['config']->set('cache.default', 'array');

        // SEGURIDAD: fijar sqlite en memoria de forma explícita. Sin esto,
        // Testbench heredaría las env DB_* del entorno (p.ej. dentro de un
        // contenedor de app apuntarían a una BD VIVA) y las migraciones
        // crearían/escribirían tablas reales. El test debe ser autocontenido.
        $app['config']->set('database.default', 'testing');
        $app['config']->set('database.connections.testing', [
            'driver'   => 'sqlite',
            'database' => ':memory:',
            'prefix'   => '',
        ]);

        // Morph alias estable, como en producción (Relation::enforceMorphMap).
        Relation::enforceMorphMap([
            'int_key_translatable' => IntKeyTranslatable::class,
        ]);
    }
}
