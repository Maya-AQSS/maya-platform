# @ceedcv-maya/shared-ui-react

Headless+styled UI primitives for React: DataTable, Pagination, DatePicker, Badge, Spinner, Avatar, FilterField, useConfirm, useFocusTrap.

Part of the [ceedcv-maya/maya_platform](https://github.com/Maya-AQSS/maya_platform) mono-repo. Distributed independently for reuse outside the Maya ecosystem.

## Installation

```bash
npm install @ceedcv-maya/shared-ui-react
```

```tsx
import { DataTable, Pagination, DatePicker, Badge, Spinner } from '@ceedcv-maya/shared-ui-react'

export function UsersList() {
  return (
    <DataTable
      columns={[{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }]}
      rows={users}
      pagination={<Pagination total={total} page={page} onChange={setPage} />}
    />
  )
}
```


## Styling — required setup

This package uses Tailwind v4 utility classes and design tokens (`bg-odoo-purple`, `bg-ui-card`, `text-text-primary`, …) defined in [`@ceedcv-maya/shared-styles`](https://www.npmjs.com/package/@ceedcv-maya/shared-styles). Without it the components will render unstyled.

```bash
npm install @ceedcv-maya/shared-styles
```

```css
/* src/index.css */
@import "tailwindcss";
@import "@ceedcv-maya/shared-styles";

/* Tailwind v4 must scan the package source so it generates the
   utility classes used inside this library. */
@source "../node_modules/@ceedcv-maya/shared-ui-react/src/**/*.{ts,tsx}";
```

If you also consume other `@ceedcv-maya/shared-*-react` packages, add an `@source` line for each of them.

## TypeScript / build notes
This package ships TypeScript source (`src/index.ts` as entry). Consumers using Vite or Webpack with `ts-loader` work out of the box. Next.js consumers must add this package to `transpilePackages` in `next.config.js`.

## License

MIT — see [LICENSE](LICENSE).

## Reporting issues

The canonical source lives in [Maya-AQSS/maya_platform](https://github.com/Maya-AQSS/maya_platform). File issues there; this read-only split repo is only the published artifact.
