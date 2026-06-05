# shared-translations-laravel

Traducciones polimórficas para Laravel: una única tabla `translations` + el
trait `HasTranslations` para almacenar el valor de cualquier campo de cualquier
modelo en N idiomas, sin tocar el esquema del modelo origen.

## Instalación (dev local)

Override en `composer.local.json` de la app (patrón del ecosistema Maya):

```json
{
  "repositories": [
    { "type": "path", "url": "../maya_platform/packages/php/shared-translations-laravel", "options": { "symlink": true } }
  ],
  "require": { "ceedcv-maya/shared-translations-laravel": "*" }
}
```

## Uso

1. Cargar la migración en el `AppServiceProvider::boot()`:

```php
use Maya\Translations\Migrations as TranslationMigrations;

$this->loadMigrationsFrom(TranslationMigrations::translations());
```

2. Registrar el morph alias del modelo (en `AppServiceProvider::boot()`):

```php
use Illuminate\Database\Eloquent\Relations\Relation;

Relation::enforceMorphMap(['panel_alert' => \App\Models\PanelAlert::class]);
```

3. Usar el trait:

```php
use Maya\Translations\Concerns\HasTranslations;

class PanelAlert extends Model
{
    use HasTranslations;
    protected array $translatable = ['text', 'action_label'];
}
```

```php
// Escritura (reemplaza todas las traducciones del campo)
$alert->syncTranslations('text', ['es' => 'Hola', 'va' => 'Hola']);

// Lectura con fallback
$alert->translate('text', 'va', 'es');

// Serialización para API / payload de notificación
$alert->translationsMap(); // { "text": { "es": "…", "va": "…" }, ... }
```

## Esquema

`translations(id, translatable_type, translatable_id, field, locale, value, timestamps)`
con único `(translatable_type, translatable_id, field, locale)`. `translatable_id`
es VARCHAR para soportar claves bigint y UUID/slug indistintamente.
