<?php

declare(strict_types=1);

namespace Maya\Translations\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * Fila de traducción polimórfica.
 *
 * @property string $translatable_type
 * @property string $translatable_id
 * @property string $field
 * @property string $locale
 * @property string $value
 */
final class Translation extends Model
{
    protected $table = 'translations';

    protected $fillable = [
        'translatable_type',
        'translatable_id',
        'field',
        'locale',
        'value',
    ];

    /**
     * @return MorphTo<Model, $this>
     */
    public function translatable(): MorphTo
    {
        return $this->morphTo();
    }
}
