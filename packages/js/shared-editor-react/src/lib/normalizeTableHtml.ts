/**
 * Pre-processes pasted/imported HTML so that complex table structures
 * survive TipTap's table parser.
 *
 * TipTap's schema is:
 *   table → tableRow → (tableHeader | tableCell)
 *
 * It does NOT model `<caption>`, `<colgroup>`/`<col>`, or `<tfoot>` as
 * distinct nodes. Without preprocessing, those elements silently
 * disappear during `editor.commands.setContent`.
 *
 * Transformations applied:
 *   - `<caption>` is lifted out of the table and rendered as a
 *     `<p><strong><em>…</em></strong></p>` placed immediately before the
 *     table (visually equivalent to a caption, schema-compatible).
 *   - `<tfoot>` rows are appended to `<tbody>` (TipTap doesn't care
 *     about the section wrapper — only about the `<tr>` children).
 *   - `<colgroup>` / `<col>` are stripped (TipTap manages column sizing
 *     dynamically via `Table.configure({ resizable: true })`).
 *   - `<th scope="row">` is preserved as `<th>` (TipTap renders any
 *     `<th>` as a `tableHeader` regardless of scope).
 *
 * Anything outside `<table>` is left untouched.
 */
export function normalizeTableHtml(html: string): string {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return html;
  }
  const parsed = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const root = parsed.body.firstElementChild;
  if (!root) return html;

  const tables = Array.from(root.querySelectorAll('table'));
  for (const table of tables) {
    // 1. Caption → paragraph injected right before the table.
    const caption = table.querySelector(':scope > caption');
    if (caption) {
      const text = caption.textContent?.trim() ?? '';
      if (text) {
        const captionPara = parsed.createElement('p');
        const strong = parsed.createElement('strong');
        const em = parsed.createElement('em');
        em.textContent = text;
        strong.appendChild(em);
        captionPara.appendChild(strong);
        table.parentNode?.insertBefore(captionPara, table);
      }
      caption.remove();
    }

    // 2. <tfoot> rows → appended to <tbody>.
    const tfoots = Array.from(table.querySelectorAll(':scope > tfoot'));
    for (const tfoot of tfoots) {
      let tbody = table.querySelector(':scope > tbody');
      if (!tbody) {
        tbody = parsed.createElement('tbody');
        table.appendChild(tbody);
      }
      while (tfoot.firstElementChild) {
        tbody.appendChild(tfoot.firstElementChild);
      }
      tfoot.remove();
    }

    // 3. <colgroup>/<col> stripped — handled by Table.configure({ resizable }).
    table.querySelectorAll(':scope > colgroup').forEach((cg) => cg.remove());
  }

  return root.innerHTML;
}
