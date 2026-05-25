# @ceedcv-maya/shared-i18n-react

i18next + Keycloak locale sync for React: useLocale, useKeycloakLocaleSync, createI18n factory, language overrides API.

Part of the [ceedcv-maya/maya_platform](https://github.com/Maya-AQSS/maya_platform) mono-repo. Distributed independently for reuse outside the Maya ecosystem.

## Installation

```bash
npm install @ceedcv-maya/shared-i18n-react @ceedcv-maya/shared-auth-react i18next react-i18next i18next-browser-languagedetector
```

```tsx
import { createI18n, useLocale, useKeycloakLocaleSync } from '@ceedcv-maya/shared-i18n-react'

const i18n = createI18n({ resources, fallbackLng: 'en' })

function LocaleSync() {
  useKeycloakLocaleSync()
  return null
}
```


## Peer dependencies

This package expects the following sibling packages to be installed by the consumer:

- `@ceedcv-maya/shared-auth-react`

## TypeScript / build notes
This package ships TypeScript source (`src/index.ts` as entry). Consumers using Vite or Webpack with `ts-loader` work out of the box. Next.js consumers must add this package to `transpilePackages` in `next.config.js`.

## License

MIT — see [LICENSE](LICENSE).

## Reporting issues

The canonical source lives in [Maya-AQSS/maya_platform](https://github.com/Maya-AQSS/maya_platform). File issues there; this read-only split repo is only the published artifact.
