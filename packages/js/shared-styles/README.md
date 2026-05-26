[email protected]/shared-styles

CSS-only package bundling the design tokens, color palette, animations and base reset used by every `@ceedcv-maya/shared-*-react` component. Pulling it in is the simplest way to make the styled components (`Button`, `DataTable`, `Sidebar`, …) render correctly in a third-party app.

Built for **Tailwind CSS v4**. The file exports:
- `@theme` block with the Odoo/Maya color palette (`--color-odoo-purple`, `--color-ui-card`, `--color-text-primary`, …).
- Custom utilities (`bg-gradient-primary`, dark-mode helpers, etc.).
- Animations + base reset shared across the ecosystem.

## Installation

```bash
npm install @ceedcv-maya/shared-styles
```

## Usage with a `@ceedcv-maya` component package

```css
/* src/index.css (or wherever you bootstrap CSS) */
@import "tailwindcss";

/* Pulls in tokens + custom utilities + animations */
@import "@ceedcv-maya/shared-styles";

/* Tailwind v4 needs to scan each shared package whose classes you use,
   so it can emit the utility classes into your bundle.
   Adjust the list to the packages you actually consume. */
@source "../node_modules/@ceedcv-maya/shared-ui-react/src/**/*.{ts,tsx}";
@source "../node_modules/@ceedcv-maya/shared-layout-react/src/**/*.{ts,tsx}";
@source "../node_modules/@ceedcv-maya/shared-sidebar-react/src/**/*.{ts,tsx}";
@source "../node_modules/@ceedcv-maya/shared-profile-react/src/**/*.{ts,tsx}";
@source "../node_modules/@ceedcv-maya/shared-dashboard-react/src/**/*.{ts,tsx}";
@source "../node_modules/@ceedcv-maya/shared-auth-react/src/**/*.{ts,tsx}";
@source "../node_modules/@ceedcv-maya/shared-i18n-react/src/**/*.{ts,tsx}";
```

Then import that file once at app entry:

```tsx
// src/main.tsx
import "./index.css"
```

## What if I do not use Tailwind v4?

The tokens block uses the `@theme` directive from Tailwind v4. If your project does not use Tailwind, you can still get the CSS custom properties by importing the file directly — they will be available as plain `var(--color-…)` values — but the utility classes won't be generated; you'll need to write your own styles.

## License

MIT — see [LICENSE](LICENSE).

## Reporting issues

The canonical source lives in [Maya-AQSS/maya_platform](https://github.com/Maya-AQSS/maya_platform). File issues there.
