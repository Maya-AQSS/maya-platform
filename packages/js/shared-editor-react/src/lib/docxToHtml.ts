/**
 * Convert a `.docx` File to sanitised, editor-ready HTML.
 *
 * Mammoth runs entirely client-side and is loaded via dynamic `import()` so
 * its ~430KB bundle only ships to apps that exercise the .docx flow. The
 * `mammoth/mammoth.browser.js` entry is required — the package root pulls
 * Node-specific code that breaks under Vite's browser optimisation.
 *
 * Output passes through the same `normalizeTableHtml` + `sanitizeEditorHtml`
 * pipeline the live editor uses, so the result is safe to drop straight into
 * a TipTap doc (see {@link htmlToTiptapDoc}) or split into block chunks
 * (see {@link splitHtmlIntoBlocks}).
 */
import { normalizeTableHtml } from './normalizeTableHtml';
import { sanitizeEditorHtml } from './dompurifyConfig';

export async function docxToHtml(file: File): Promise<string> {
  const mod = (await import('mammoth/mammoth.browser.js')) as unknown as {
    convertToHtml: (input: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
    default?: { convertToHtml: (input: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }> };
  };
  const mammoth = mod.default ?? mod;
  const buffer = await file.arrayBuffer();
  const { value: rawHtml } = await mammoth.convertToHtml({ arrayBuffer: buffer });
  return sanitizeEditorHtml(normalizeTableHtml(rawHtml));
}
