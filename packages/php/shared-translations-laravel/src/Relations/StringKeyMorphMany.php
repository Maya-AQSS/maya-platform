<?php

declare(strict_types=1);

namespace Maya\Translations\Relations;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;

/**
 * MorphMany que compara la FK polimórfica como string.
 *
 * `translations.translatable_id` es VARCHAR (soporta claves bigint y UUID/slug
 * bajo el mismo esquema), pero un modelo padre con clave entera hace que
 * Eloquent use `whereIntegerInRaw` (eager) e incruste la clave como entero
 * crudo, y bindee la PK como `PDO::PARAM_INT` (lazy / `addConstraints` /
 * `updateOrCreate`). En Postgres `varchar = integer` no tiene operador →
 * "operator does not exist: character varying = integer". (MySQL lo castea
 * implícito, por eso es un fallo latente solo visible en Postgres.)
 *
 * Forzamos comparación bindeada como string en ambos caminos para que la BD
 * compare `varchar = varchar`. Modelos de clave string/UUID no se ven
 * afectados (el cast a string es idempotente).
 *
 * @template TRelatedModel of \Illuminate\Database\Eloquent\Model
 * @template TDeclaringModel of \Illuminate\Database\Eloquent\Model
 *
 * @extends MorphMany<TRelatedModel, TDeclaringModel>
 */
final class StringKeyMorphMany extends MorphMany
{
    /** Evita `whereIntegerInRaw`: el valor se bindea en vez de incrustarse crudo. */
    protected function whereInMethod(Model $model, $key)
    {
        return 'whereIn';
    }

    /** Lazy / addConstraints / updateOrCreate: `translatable_id = '18'` (PARAM_STR). */
    public function getParentKey()
    {
        return (string) parent::getParentKey();
    }

    /**
     * Eager: `translatable_id in ('18', …)` con valores string.
     *
     * @param  array<int, Model>  $models
     */
    protected function getKeys(array $models, $key = null)
    {
        return array_map(
            static fn ($value): string => (string) $value,
            parent::getKeys($models, $key),
        );
    }
}
