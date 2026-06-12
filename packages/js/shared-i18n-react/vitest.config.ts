import { defineConfig } from 'vitest/config'
import path from 'node:path'

const pnpmStore = path.resolve(__dirname, '../../../node_modules/.pnpm')

export default defineConfig({
  resolve: {
    alias: {
      // peerDeps are not installed locally; point Vite to the pnpm-hoisted
      // copies so vite:import-analysis can resolve them at transform time.
      // The test mocks will still replace these modules at runtime via vi.mock().
      'i18next-browser-languagedetector': path.join(
        pnpmStore,
        'i18next-browser-languagedetector@8.2.1/node_modules/i18next-browser-languagedetector',
      ),
      '@ceedcv-maya/shared-auth-react': path.resolve(
        __dirname,
        '../../js/shared-auth-react/src/index.ts',
      ),
      'keycloak-js': path.join(
        pnpmStore,
        'keycloak-js@26.2.4/node_modules/keycloak-js',
      ),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
