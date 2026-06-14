<?php

declare(strict_types=1);

use Illuminate\Database\Eloquent\Model;
use Maya\Platform\Data\ApplicationRefDto;

function fakeAppModel(array $attrs): Model
{
    $model = new class extends Model {};
    $model->setRawAttributes($attrs);

    return $model;
}

it('builds from a model with a slug', function () {
    $dto = ApplicationRefDto::fromModel(fakeAppModel([
        'id' => 5,
        'name' => 'Audit',
        'slug' => 'maya-audit',
    ]));

    expect($dto->id)->toBe(5);
    expect($dto->name)->toBe('Audit');
    expect($dto->slug)->toBe('maya-audit');
});

it('builds from a model without a slug (slug is null)', function () {
    $dto = ApplicationRefDto::fromModel(fakeAppModel([
        'id' => 7,
        'name' => 'Logs',
    ]));

    expect($dto->id)->toBe(7);
    expect($dto->name)->toBe('Logs');
    expect($dto->slug)->toBeNull();
});

it('casts id and name to their declared types', function () {
    $dto = ApplicationRefDto::fromModel(fakeAppModel([
        'id' => '9',
        'name' => 123,
        'slug' => 456,
    ]));

    expect($dto->id)->toBe(9);
    expect($dto->name)->toBe('123');
    expect($dto->slug)->toBe('456');
});
