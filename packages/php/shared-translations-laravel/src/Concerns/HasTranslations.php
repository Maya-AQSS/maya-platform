<?php

declare(strict_types=1);

namespace Maya\Translations\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Maya\Translations\Models\Translation;
use Maya\Translations\Relations\StringKeyMorphMany;

/**
 * Da a un modelo Eloquent traducciones polimórficas por campo y locale.
 *
 * Uso:
 *   class PanelAlert extends Model {
 *       use HasTranslations;
 *       protected array $translatable = ['text', 'action_label'];
 *   }
 *
 * Lectura:   $alert->translate('text', 'va', 'es')   // con fallback
 *            $alert->translationsMap()                // { field: { locale: value } }
 * Escritura: $alert->syncTranslations('text', ['es' => '…', 'va' => '…'])
 *
 * Registrar el morph alias del modelo (Relation::enforceMorphMap) para que
 * `translatable_type` guarde un alias estable (p.ej. `panel_alert`) y no el FQCN.
 */
trait HasTranslations
{
    public static function bootHasTranslations(): void
    {
        // Limpieza: al borrar (hard-delete) el modelo, se eliminan sus traducciones.
        static::deleted(function ($model): void {
            if (method_exists($model, 'isForceDeleting') && ! $model->isForceDeleting()) {
                return; // soft-delete: conservar traducciones
            }
            $model->translations()->delete();
        });
    }

    /**
     * @return MorphMany<Translation, $this>
     */
    public function translations(): MorphMany
    {
        return $this->morphMany(Translation::class, 'translatable');
    }

    /**
     * `translations.translatable_id` es VARCHAR pero los modelos con clave
     * entera harían que Eloquent compare `varchar = integer` (sin operador en
     * Postgres). Inyectamos StringKeyMorphMany para que la comparación se
     * bindee como string. Acotado a la relación con Translation: cualquier otra
     * morphMany del modelo sigue usando la relación estándar.
     *
     * @param  Builder<*>  $query
     * @param  non-empty-string  $type
     * @param  non-empty-string  $id
     * @param  string  $localKey
     */
    protected function newMorphMany(Builder $query, Model $parent, $type, $id, $localKey): MorphMany
    {
        if ($query->getModel() instanceof Translation) {
            return new StringKeyMorphMany($query, $parent, $type, $id, $localKey);
        }

        return parent::newMorphMany($query, $parent, $type, $id, $localKey);
    }

    /**
     * Campos traducibles del modelo. Sobreescribir vía `protected array $translatable`.
     *
     * @return list<string>
     */
    public function translatableFields(): array
    {
        /** @phpstan-ignore-next-line property may be defined on the using model */
        return property_exists($this, 'translatable') ? array_values($this->translatable) : [];
    }

    /**
     * Resuelve un campo para un locale, con fallback opcional. null si no hay nada.
     */
    public function translate(string $field, string $locale, ?string $fallbackLocale = null): ?string
    {
        $forField = $this->translations->where('field', $field);

        $hit = $forField->firstWhere('locale', $locale);
        if ($hit !== null) {
            return $hit->value;
        }

        if ($fallbackLocale !== null && $fallbackLocale !== $locale) {
            $fb = $forField->firstWhere('locale', $fallbackLocale);
            if ($fb !== null) {
                return $fb->value;
            }
        }

        return null;
    }

    /**
     * Todas las traducciones como mapa anidado { field: { locale: value } }.
     *
     * @return array<string, array<string, string>>
     */
    public function translationsMap(): array
    {
        $map = [];
        foreach ($this->translations as $t) {
            $map[$t->field][$t->locale] = $t->value;
        }

        return $map;
    }

    /**
     * Reemplaza TODAS las traducciones de un campo desde un mapa { locale: value }.
     * Los locales ausentes o con valor vacío se eliminan.
     *
     * @param  array<string, string|null>  $valuesByLocale
     */
    public function syncTranslations(string $field, array $valuesByLocale): void
    {
        $keep = [];

        foreach ($valuesByLocale as $locale => $value) {
            $clean = is_string($value) ? trim($value) : null;
            if ($clean === null || $clean === '') {
                continue;
            }

            $this->translations()->updateOrCreate(
                ['field' => $field, 'locale' => (string) $locale],
                ['value' => $clean],
            );
            $keep[] = (string) $locale;
        }

        $stale = $this->translations()->where('field', $field);
        if ($keep !== []) {
            $stale->whereNotIn('locale', $keep);
        }
        $stale->delete();
    }
}
