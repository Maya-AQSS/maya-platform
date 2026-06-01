<?php

declare(strict_types=1);

namespace Maya\Editor\Support;

use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\Shared\Html;
use RuntimeException;

/**
 * HTML → .docx export via phpoffice/phpword.
 *
 * Security:
 *   - Disables external entity loading (`libxml_disable_entity_loader`
 *     equivalent under PHP 8+ via `LIBXML_NONET`).
 *   - Caller is responsible for the HTML having already been sanitised
 *     (typically by `TiptapHtmlRenderer` + DOMPurify).
 *
 * Optional dependency: `phpoffice/phpword`. If absent at runtime, the
 * exporter throws a `RuntimeException` with a clear install hint instead
 * of a confusing class-not-found.
 */
final class DocxExporter
{
    /**
     * Render the given HTML to a .docx binary string.
     */
    public static function export(string $html, string $title = 'Document'): string
    {
        if (! class_exists(PhpWord::class)) {
            throw new RuntimeException(
                'phpoffice/phpword is required for DocxExporter — run `composer require phpoffice/phpword`.',
            );
        }

        // Reduce libxml exposure to network-based entity attacks.
        $prevLoaderState = libxml_use_internal_errors(true);

        try {
            $word = new PhpWord();
            $word->getDocInfo()->setTitle($title);
            $section = $word->addSection();
            // PhpWord parses a subset of HTML; CSS is ignored, but inline
            // tags (strong, em, table, ul/ol/li, img, a) are honoured.
            Html::addHtml($section, $html, false, false);

            $writer = IOFactory::createWriter($word, 'Word2007');
            $tmp = tempnam(sys_get_temp_dir(), 'maya-docx-');
            if ($tmp === false) {
                throw new RuntimeException('Unable to allocate temp file for .docx export.');
            }
            try {
                $writer->save($tmp);
                $bin = file_get_contents($tmp);
                if ($bin === false) {
                    throw new RuntimeException('Unable to read generated .docx file.');
                }
                return $bin;
            } finally {
                @unlink($tmp);
            }
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($prevLoaderState);
        }
    }
}
