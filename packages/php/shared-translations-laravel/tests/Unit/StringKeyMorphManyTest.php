<?php

declare(strict_types=1);

use Illuminate\Database\Eloquent\Relations\Relation;
use Maya\Translations\Relations\StringKeyMorphMany;
use Tests\Fixtures\IntKeyTranslatable;

/**
 * Regresión del fix morph FK varchar vs clave entera en Postgres.
 *
 * El bug (operator does not exist: character varying = integer) es Postgres-
 * específico; estos tests corren sobre sqlite (Testbench), así que en vez de
 * provocar el error SQL verificamos la FORMA del SQL generado: el id del padre
 * debe ir BINDEADO (`in (?)`) en lugar de incrustado crudo por whereIntegerInRaw
 * (`in (1)`). Esa diferencia es independiente del motor de BD.
 */
it('uses StringKeyMorphMany for the translations relation', function () {
    $model = IntKeyTranslatable::create(['name' => 'x']);

    expect($model->translations())->toBeInstanceOf(StringKeyMorphMany::class);
});

it('binds the morph id as a string on eager load (no whereIntegerInRaw)', function () {
    $model = IntKeyTranslatable::create(['name' => 'x']);

    $relation = Relation::noConstraints(fn () => $model->translations());
    $relation->addEagerConstraints([$model]);

    $sql = $relation->getQuery()->toSql();

    expect($sql)->toContain('in (?)')
        ->and($sql)->not->toContain('in ('.$model->getKey().')');
});

it('returns the parent key as a string for lazy/updateOrCreate constraints', function () {
    $model = IntKeyTranslatable::create(['name' => 'x']);

    expect($model->translations()->getParentKey())
        ->toBeString()
        ->toBe((string) $model->getKey());
});

it('round-trips translations through sync, eager and lazy reads', function () {
    $model = IntKeyTranslatable::create(['name' => 'x']);

    $model->syncTranslations('name', ['es' => 'Hola', 'va' => 'Hola (va)']);

    expect($model->fresh(['translations'])->translations)->toHaveCount(2);
    expect($model->fresh()->translate('name', 'va', 'es'))->toBe('Hola (va)');
    expect($model->fresh()->translate('name', 'en', 'es'))->toBe('Hola'); // fallback

    // Segunda pasada: updateOrCreate sobre filas existentes + borrado de stale.
    $model->syncTranslations('name', ['es' => 'Hola v2']);
    expect($model->fresh(['translations'])->translations)->toHaveCount(1);
    expect($model->fresh()->translate('name', 'es', 'es'))->toBe('Hola v2');
});
