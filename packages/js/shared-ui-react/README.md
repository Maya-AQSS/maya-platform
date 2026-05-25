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


## TypeScript / build notes
This package ships TypeScript source (`src/index.ts` as entry). Consumers using Vite or Webpack with `ts-loader` work out of the box. Next.js consumers must add this package to `transpilePackages` in `next.config.js`.

## License

MIT — see [LICENSE](LICENSE).

## Reporting issues

The canonical source lives in [Maya-AQSS/maya_platform](https://github.com/Maya-AQSS/maya_platform). File issues there; this read-only split repo is only the published artifact.
