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
/// <reference path="../mammoth-browser.d.ts" />
import { normalizeTableHtml } from './normalizeTableHtml';
import { sanitizeEditorHtml } from './dompurifyConfig';

export interface DocxConversionMessage {
  type: string;
  message: string;
}

export interface DocxConversionResult {
  /** Sanitised, editor-ready HTML. */
  html: string;
  /** Warnings/errors emitted by mammoth (unrecognised styles, dropped tags…). */
  messages: DocxConversionMessage[];
}

type MammothConvert = (input: {
  arrayBuffer: ArrayBuffer;
}) => Promise<{ value: string; messages?: DocxConversionMessage[] }>;

/**
 * Convert .docx to HTML with full diagnostic messages.
 * Use this when you need to show users warnings about unsupported Word features
 * (e.g., "Warning: dropped unsupported style 'MyStyle'").
 * The messages array contains any warnings/errors from the mammoth parser.
 */
export async function docxToHtmlResult(file: File): Promise<DocxConversionResult> {
  const mod = (await import('mammoth/mammoth.browser.js')) as unknown as {
    convertToHtml: MammothConvert;
    default?: { convertToHtml: MammothConvert };
  };
  const mammoth = mod.default ?? mod;
  const buffer = await file.arrayBuffer();
  const { value: rawHtml, messages = [] } = await mammoth.convertToHtml({ arrayBuffer: buffer });
  return { html: sanitizeEditorHtml(normalizeTableHtml(rawHtml)), messages };
}

/**
 * Convenience wrapper that returns only the sanitised HTML.
 * Use this when you don't need diagnostic messages and just want clean HTML
 * ready to insert into the editor.
 */
export async function docxToHtml(file: File): Promise<string> {
  const { html } = await docxToHtmlResult(file);
  return html;
}
