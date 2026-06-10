<?php

declare(strict_types=1);

namespace Tests\Fixtures;

use Illuminate\Database\Eloquent\Model;
use Maya\Translations\Concerns\HasTranslations;

/**
 * Modelo de prueba con clave primaria ENTERA (bigint) — el escenario que
 * disparaba `varchar = integer` en Postgres al cargar traducciones.
 */
class IntKeyTranslatable extends Model
{
    use HasTranslations;

    protected $table = 'int_key_translatables';

    protected $guarded = [];

    public $timestamps = false;

    /** @var list<string> */
    protected array $translatable = ['name'];
}
