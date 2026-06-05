<?php

declare(strict_types=1);

namespace Maya\Translations;

/**
 * API componible de migraciones del paquete shared-translations.
 *
 * Cada app que quiera la tabla polimórfica de traducciones la carga en su
 * `AppServiceProvider::boot()`:
 *
 *   use Maya\Translations\Migrations as TranslationMigrations;
 *
 *   public function boot(): void
 *   {
 *       $this->loadMigrationsFrom(TranslationMigrations::translations());
 *   }
 */
final class Migrations
{
    /**
     * Tabla `translations` (polimórfica: translatable_type/id, field, locale, value).
     */
    public static function translations(): string
    {
        return dirname(__DIR__).'/database/migrations/translations';
    }
}
