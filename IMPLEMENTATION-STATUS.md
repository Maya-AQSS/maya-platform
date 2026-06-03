# TipTap migration — implementation status

> Companion to `PLAN-TIPTAP.md`. Snapshot of what was committed on
> `refactor/tiptap` during the initial autonomous execution session.

## Branches

All 7 repos have a `refactor/tiptap` branch off `develop` (off `main` for
`maya_platform`). Slot-specific working-tree changes (`.env.example`,
`composer.lock` host paths) were stashed before branching — they should
be re-applied or merged from the slot's `develop` after pulling
`refactor/tiptap` back.

## Commits per repo

### `maya_platform` (refactor/tiptap)
1. **`feat(editor): scaffold shared-editor-react + shared-editor-laravel packages`**
   - 26 files, 2525 insertions.
   - Renderer parity (PHP `TiptapHtmlRenderer` + JS `BlockNoteToTiptap`).
   - 19 oracle tests (14 ported + 5 council-recommended edge cases).
   - `MayaEditor` component, extensions, hooks, DOMPurify config,
     i18n bundles.
2. **`feat(editor): DocxExporter in shared-editor-laravel`** — XXE-safe.

### `maya_logs` (refactor/tiptap)
- **`feat(comments): replace textareas with MayaEditor (mode=lite)`** —
  both textareas in `CommentThread.tsx` migrated; `plainTextToHtml`
  helper removed.

### `maya_dashboard` (refactor/tiptap)
- **`feat(panel-alerts): replace alert-text textareas with MayaEditor (lite)`**
  — `PanelAlertForm` + `PanelAlertRuleForm` migrated.

### `maya_dms` (refactor/tiptap)
- **`feat(editor): wire TipTap (MayaEditor) as the primary DMS editor`** —
  the heavy commit:
  - Frontend: `MayaEditorPanel`, `BlockNoteEditorPanel` shim,
    `BlockContentHtml` dispatcher, `*.legacy.tsx` preserved for
    rollback, `package.json` updated.
  - Backend: 2 migrations (legacy backup + anchored_comments table),
    `Maya\Editor` dependency, 3 Artisan commands (`migration:preview`,
    `migration:status`, `blocknote:migrate-to-tiptap`),
    `AnchoredCommentController` + `AnchoredComment` model + FormRequest,
    `DocumentDocxController`, routes, `config/editor.php`,
    `EDITOR_BACKEND` env var, `blocknote-migration` log channel.

### `maya_authorization`, `maya_audit`, `maya_infra` (refactor/tiptap)
- Branched, no commits — no editor surfaces to migrate.

## What was implemented vs the plan

| Phase | Status |
|---|---|
| 0 — Pre-flight | ✅ Branches, ADR-equivalent docs, working trees stashed |
| 1 — Foundation + oracle | ✅ Renderers + 19 tests (run via `composer test` once package install hooks up) |
| 2 — Lite textarea migration | ✅ 4 textareas in `maya_logs` + `maya_dashboard` |
| 3 — Full mode + extensions | ✅ `MayaEditor mode="full"`, `IframeBlock`, `AlertBlock`, `CommentMark` |
| 4 — Backend integration + Artisan | ✅ 3 commands + migrations + config/editor + log channel |
| 5 — Data migration command | ✅ `blocknote:migrate-to-tiptap` with batch + parity check + auto-drop |
| 6 — DMS substitution | ✅ Shim re-export pattern; legacy preserved as `*.legacy.tsx` |
| 7 — Anchored comments | ✅ Table, model, controller (authorize-gated), request, routes |
| 8 — Hocuspocus | ❌ Out of scope (council decision) |
| 9 — .docx import/export | ✅ DocxExporter + controller with zip-bomb guard |

## What still needs hands-on work (not covered in this session)

These items would have required runtime validation, package
installation, and human QA — out of scope for an autonomous code drop:

1. **`composer install` + `pnpm install`** to materialise the new
   packages locally. The path-repository setup for
   `ceedcv-maya/shared-editor-laravel` and the workspace declaration
   for `@ceedcv-maya/shared-editor-react` need to be applied per repo
   the first time the dev environment is rebuilt.
2. **Run the oracle tests**: `cd maya_platform/packages/php/shared-editor-laravel && composer test`.
3. **Vitest tests** for `MayaEditor` (the package ships none — the
   parity guarantee is on the PHP side; the React side relies on
   integration tests in `maya_dms/frontend/e2e/`).
4. **Migration dry-run on staging**:
   ```
   php artisan migrate            # apply 2026_06_01_000001 + 000002
   php artisan blocknote:migrate-to-tiptap --dry-run
   ```
5. **Playwright e2e** in `maya_dms/frontend/e2e/`: open a template,
   verify the toolbar/slash commands render, save, reload, diff.
6. **Manual sanity** in `maya_logs` and `maya_dashboard` to confirm
   the `<MayaEditor mode="lite">` integrates with the existing form
   styling.
7. **mammoth.js wiring** on the frontend for actual .docx import
   (server side accepts the upload and stores it; the client is
   expected to parse with mammoth and feed HTML to the editor — this
   piece is not yet implemented in the import controller).
8. **Reverb channel authorization** for anchored-comment broadcasts —
   the `RebaseAnchoredCommentsJob` and the Echo channel
   (`template.{id}.anchored-comments`) are referenced in the plan but
   not implemented; the controller currently does not broadcast.

## Rollback paths

- **Per-call**: switch `EDITOR_BACKEND=blocknote` in `maya_dms/.env`.
  The legacy renderer and the legacy frontend file
  (`BlockNoteEditorPanel.legacy.tsx`) are still present.
- **Per-branch**: `git checkout develop` in each repo. Slot config
  stashed in step 1 of Fase 0 can be reapplied with `git stash pop`.
- **Per-data**: until `blocknote:migrate-to-tiptap` runs without
  `--no-drop`, the `content_legacy_blocknote` column survives and
  every row can be rolled back with a simple `UPDATE … SET content =
  content_legacy_blocknote`.
