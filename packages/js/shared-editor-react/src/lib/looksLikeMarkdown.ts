/**
 * Heuristic: does this plain text contain Markdown syntax worth converting to
 * structured nodes?
 *
 * Used by the editor paste handler (convert pasted Markdown → TipTap nodes
 * instead of storing it as a literal text node) and mirrored by the backend
 * data-repair detection. Kept conservative so ordinary prose is NOT rewritten:
 * a single stray `*` or `#` is ignored; we require a real block marker at the
 * start of a line or an unambiguous inline pair.
 */

const BLOCK_PATTERNS: RegExp[] = [
  /^#{1,6}\s+\S/m, // ATX heading: "## Title"
  /^\s*[-*+]\s+\S/m, // unordered list item: "- item"
  /^\s*\d+\.\s+\S/m, // ordered list item: "1. item"
  /^\s*>\s+\S/m, // blockquote: "> quote"
  /^```/m, // fenced code block
  // GFM table: require a delimiter row (|---|), so intentional pipe text like
  // "| Total | 30 |" (no delimiter) is NOT flagged as markdown.
  /\|\s*:?-{3,}|-{3,}:?\s*\|/,
];

const INLINE_PATTERNS: RegExp[] = [
  /\*\*[^\s*][^*]*\*\*/, // **bold**
  /__[^\s_][^_]*__/, // __bold__
  /~~[^\s~][^~]*~~/, // ~~strike~~
  /`[^`\n]+`/, // `inline code`
  /\[[^\]]+\]\([^)\s]+\)/, // [text](url)
];

export function looksLikeMarkdown(text: string): boolean {
  if (!text || text.length < 2) return false;
  if (BLOCK_PATTERNS.some((re) => re.test(text))) return true;
  // Require an inline marker to actually be present; a lone "*" won't match the
  // paired patterns above, so prose stays untouched.
  return INLINE_PATTERNS.some((re) => re.test(text));
}
