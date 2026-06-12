import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      // keycloak-js is a peerDep of shared-auth-react; when vite follows the
      // workspace symlink for @ceedcv-maya/shared-auth-react it can lose the
      // resolution context. Point explicitly to the pnpm-hoisted copy.
      'keycloak-js': path.resolve(
        __dirname,
        '../../../node_modules/.pnpm/node_modules/keycloak-js',
      ),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
