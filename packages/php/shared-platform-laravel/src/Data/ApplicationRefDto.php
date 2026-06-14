<?php

declare(strict_types=1);

namespace Maya\Platform\Data;

use Illuminate\Database\Eloquent\Model;

/**
 * Minimal application reference DTO shared across services that expose
 * `GET /applications` for dropdowns (maya_audit, maya_logs). `slug` is
 * nullable because some sources only provide `{id, name}`; consumers that
 * always have a slug populate it.
 */
final readonly class ApplicationRefDto
{
    public function __construct(
        public int $id,
        public string $name,
        public ?string $slug = null,
    ) {}

    public static function fromModel(Model $model): self
    {
        $slug = $model->getAttribute('slug');

        return new self(
            id: (int) $model->getAttribute('id'),
            name: (string) $model->getAttribute('name'),
            slug: $slug !== null ? (string) $slug : null,
        );
    }
}
