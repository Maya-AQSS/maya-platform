/**
 * Build a fully-populated {@link ToolbarLabels} from a translation function.
 *
 * The editor itself is i18n-agnostic (it just takes a `toolbarLabels` prop), so
 * each consumer wires its own i18n. This helper keeps that wiring to one line:
 * pass the app's `t` (bound to the namespace that holds the shared `editor`
 * canon — usually `common`) and it maps every label key to `t('editor.<key>')`.
 *
 *   const { t } = useTranslation('common');
 *   <MayaEditor toolbarLabels={buildToolbarLabels(t)} … />
 *
 * Any key missing from the active locale falls back to the English default
 * (i18next returns the key unchanged for a miss, which we detect and replace),
 * so a partially-translated locale never shows raw `editor.*` keys.
 */
import { DEFAULT_LABELS } from '../components/EditorToolbar';
import type { ToolbarLabels } from '../components/EditorToolbar';

/** Minimal shape of an i18next `t` — only the (key) → string call is used. */
export type TranslateFn = (key: string) => string;

export function buildToolbarLabels(
  t: TranslateFn,
  prefix = 'editor',
): ToolbarLabels {
  const out: ToolbarLabels = { ...DEFAULT_LABELS };

  (Object.keys(DEFAULT_LABELS) as (keyof ToolbarLabels)[]).forEach((key) => {
    const fullKey = `${prefix}.${key}`;
    const value = t(fullKey);
    // i18next returns the key itself on a miss → keep the English default.
    if (value && value !== fullKey) {
      out[key] = value;
    }
  });

  return out;
}
