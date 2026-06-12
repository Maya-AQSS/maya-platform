import { defineConfig } from 'vitest/config'
import path from 'node:path'

// Version-agnostic pnpm hoisted root (node_modules/.pnpm/node_modules):
// sobrevive a bumps del lockfile, a diferencia de rutas .pnpm/<pkg>@<version>.
const pnpmHoisted = path.resolve(__dirname, '../../../node_modules/.pnpm/node_modules')

export default defineConfig({
  resolve: {
    alias: {
      // peerDeps are not installed locally; point Vite to the pnpm-hoisted
      // copies so vite:import-analysis can resolve them at transform time.
      // The test mocks will still replace these modules at runtime via vi.mock().
      'i18next-browser-languagedetector': path.join(pnpmHoisted, 'i18next-browser-languagedetector'),
      '@ceedcv-maya/shared-auth-react': path.resolve(
        __dirname,
        '../../js/shared-auth-react/src/index.ts',
      ),
      'keycloak-js': path.join(pnpmHoisted, 'keycloak-js'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
