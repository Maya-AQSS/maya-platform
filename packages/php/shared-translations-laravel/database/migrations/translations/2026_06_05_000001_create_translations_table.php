<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabla polimórfica de traducciones.
 *
 * Una fila por (modelo, id, campo, locale). Permite almacenar el valor de
 * cualquier atributo de cualquier modelo en N idiomas sin tocar el esquema del
 * modelo origen. El `translatable_type` usa el morph alias del modelo (p.ej.
 * `panel_alert`), no el FQCN — registrar el alias con `Relation::enforceMorphMap`.
 *
 * `translatable_id` es VARCHAR para soportar tanto claves bigint (tablas
 * locales) como UUID/slug (catálogos federados) bajo el mismo esquema.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('translations', function (Blueprint $table) {
            $table->id();
            $table->string('translatable_type', 100);
            $table->string('translatable_id', 64);
            $table->string('field', 64)->comment('Atributo traducido del modelo origen (p.ej. text, action_label)');
            $table->string('locale', 12)->comment('Código de locale: es, va, en, …');
            $table->text('value');
            $table->timestampsTz();

            $table->unique(
                ['translatable_type', 'translatable_id', 'field', 'locale'],
                'translations_unique',
            );
            $table->index(['translatable_type', 'translatable_id'], 'translations_morph_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('translations');
    }
};
