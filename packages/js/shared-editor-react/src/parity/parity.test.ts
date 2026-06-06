/**
 * Parity oracle (JS side).
 *
 * Renders shared TipTap fixtures via the static renderer and computes a
 * SEMANTIC fingerprint (visible text + structural counts + headings/links/
 * images). The committed `fingerprints.json` is the parity contract; the PHP
 * test (`TiptapRendererParityTest`) asserts `TiptapHtmlRenderer` produces the
 * SAME fingerprint. Cosmetic differences (colgroup, data-*, <mark> vs <span>,
 * target/rel, inline-style spacing) are intentionally ignored — only content
 * and structure must agree, since CSR previews and server PDFs can style
 * differently.
 *
 * Regenerate the contract after intentional changes:
 *   UPDATE_FP=1 pnpm vitest run src/parity/parity.test.ts
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderTiptapJsonToHtml } from '../lib/renderTiptapJson';
import { fingerprintHtml } from './fingerprint';

const FIXTURES_DIR = resolve(
  process.cwd(),
  '../../php/shared-editor-laravel/tests/fixtures/tiptap',
);
const fixtures = JSON.parse(
  readFileSync(resolve(FIXTURES_DIR, 'fixtures.json'), 'utf8'),
) as Record<string, unknown>;
const fpPath = resolve(FIXTURES_DIR, 'fingerprints.json');

describe('renderer parity (JS / static-renderer)', () => {
  if (process.env.UPDATE_FP) {
    it('regenerates the fingerprint contract', () => {
      const out: Record<string, unknown> = {};
      for (const [name, doc] of Object.entries(fixtures)) {
        out[name] = fingerprintHtml(renderTiptapJsonToHtml(doc));
      }
      writeFileSync(fpPath, `${JSON.stringify(out, null, 2)}\n`);
      expect(Object.keys(out).length).toBe(Object.keys(fixtures).length);
    });
    return;
  }

  const expected = JSON.parse(readFileSync(fpPath, 'utf8')) as Record<string, unknown>;

  for (const [name, doc] of Object.entries(fixtures)) {
    it(`fixture "${name}" matches the contract`, () => {
      expect(fingerprintHtml(renderTiptapJsonToHtml(doc))).toEqual(expected[name]);
    });
  }
});
