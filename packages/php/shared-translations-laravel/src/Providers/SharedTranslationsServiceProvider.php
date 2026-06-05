<?php

declare(strict_types=1);

namespace Maya\Translations\Providers;

use Illuminate\Support\ServiceProvider;

/**
 * El paquete no auto-carga migraciones: cada app opta por la tabla
 * `translations` vía `Maya\Translations\Migrations::translations()` en su
 * propio `AppServiceProvider::boot()`. Así una app que no la necesite no la
 * crea. El modelo {@see \Maya\Translations\Models\Translation} y el trait
 * {@see \Maya\Translations\Concerns\HasTranslations} están disponibles por
 * autoload PSR-4 sin más registro.
 */
final class SharedTranslationsServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Sin bindings por defecto. Punto de extensión para futuros contratos.
    }
}
