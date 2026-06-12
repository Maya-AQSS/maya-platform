import { defineConfig } from 'vitest/config'
import path from 'node:path'

// Version-agnostic pnpm hoisted root (node_modules/.pnpm/node_modules):
// survives lockfile bumps, unlike paths containing @<version> segments.
const pnpmHoisted = path.resolve(__dirname, '../../../node_modules/.pnpm/node_modules')

// Resolve local workspace packages by source so Vitest can transform them
const localPkg = (name: string) =>
  path.resolve(__dirname, `../../js/${name}/src/index.ts`)

export default defineConfig({
  resolve: {
    alias: {
      // peerDeps / devDeps not installed locally — point Vitest at pnpm-hoisted copies
      'keycloak-js': path.join(pnpmHoisted, 'keycloak-js'),
      '@tanstack/react-query': path.join(pnpmHoisted, '@tanstack/react-query'),
      '@testing-library/react': path.join(pnpmHoisted, '@testing-library/react'),
      'react': path.join(pnpmHoisted, 'react'),
      'react-dom': path.join(pnpmHoisted, 'react-dom'),
      'react-router-dom': path.join(pnpmHoisted, 'react-router-dom'),
      // workspace packages resolved by source for type-safe, zero-build imports
      '@ceedcv-maya/shared-auth-react': localPkg('shared-auth-react'),
      '@ceedcv-maya/shared-ui-react': localPkg('shared-ui-react'),
      '@ceedcv-maya/shared-profile-react': localPkg('shared-profile-react'),
      '@ceedcv-maya/shared-sidebar-react': localPkg('shared-sidebar-react'),
      '@ceedcv-maya/shared-realtime-react': localPkg('shared-realtime-react'),
      '@ceedcv-maya/shared-i18n-react': localPkg('shared-i18n-react'),
      '@ceedcv-maya/shared-layout-react': path.resolve(__dirname, 'src/index.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
