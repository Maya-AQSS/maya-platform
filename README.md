# Maya Platform

Mono-repo de paquetes compartidos del ecosistema **Maya AQSS**. Aquí se desarrollan
todas las librerías transversales que consumen los 5 microservicios
(`maya_authorization`, `maya_audit`, `maya_logs`, `maya_dms`, `maya_dashboard`).

Los paquetes individuales se publican automáticamente como repos read-only
bajo la organización [`Maya-AQSS`](https://github.com/Maya-AQSS) mediante
sub-tree split (ver [`docs/architecture.md`](docs/architecture.md)).

## Paquetes

### PHP / Laravel — `packages/php/`

| Paquete | Composer | Propósito |
|---------|----------|-----------|
| `shared-auth-laravel` | `maya/shared-auth-laravel` | Middleware JWT/JWKS contra Keycloak |
| `shared-http-laravel` | `maya/shared-http-laravel` | Response envelope, health checks, base resources |
| `shared-messaging-laravel` | `maya/shared-messaging-laravel` | Publishers RabbitMQ (audit, logs, alerts) |
| `shared-platform-laravel` | `maya/shared-platform-laravel` | Helpers infra (FDW migrations, primitives) |
| `shared-profile-laravel` | `maya/shared-profile-laravel` | Endpoints `GET /me`, `PUT /me/locale` |

### React / TypeScript — `packages/js/`

| Paquete | npm | Propósito |
|---------|-----|-----------|
| `shared-auth-react` | `@maya/shared-auth-react` | Hooks/contextos Keycloak |
| `shared-dashboard-react` | `@maya/shared-dashboard-react` | Grid editable de widgets |
| `shared-i18n-react` | `@maya/shared-i18n-react` | Setup i18next + recursos comunes |
| `shared-layout-react` | `@maya/shared-layout-react` | AppLayout + Sidebar |
| `shared-profile-react` | `@maya/shared-profile-react` | Contexto de perfil + permisos |
| `shared-sidebar-react` | `@maya/shared-sidebar-react` | Favoritos, notificaciones, bell |
| `shared-ui-react` | `@maya/shared-ui-react` | Sistema de componentes (Button, Card, ...) |

## Quick start (desarrollo)

```bash
# Requisitos: PHP 8.4, Composer 2, Node 20+, pnpm 9+

git clone https://github.com/Maya-AQSS/maya-platform.git
cd maya-platform

# JS workspace
pnpm install
pnpm typecheck

# PHP packages (cada uno aislado)
composer install
composer validate-packages
```

## Cómo consumen los servicios estos paquetes

Cada servicio Maya declara dependencia vía VCS apuntando al **repo split**
(no a este mono-repo). Ejemplo en `maya_authorization/backend/composer.json`:

```json
{
  "require": {
    "maya/shared-auth-laravel": "^0.1"
  },
  "repositories": [
    { "type": "vcs", "url": "https://github.com/Maya-AQSS/shared-auth-laravel" }
  ]
}
```

Y en `maya_authorization/frontend/package.json`:

```json
{
  "dependencies": {
    "@maya/shared-auth-react": "github:Maya-AQSS/shared-auth-react#v0.1.0"
  }
}
```

Para desarrollo local con hot-reload contra tu checkout, los servicios
soportan **overrides condicionales** que apuntan a este checkout de
`maya-platform`. Ver [`docs/publishing.md`](docs/publishing.md).

## Documentación

- [`docs/architecture.md`](docs/architecture.md) — modelo mono-repo + sub-tree split
- [`docs/versioning.md`](docs/versioning.md) — política semver y compatibilidad
- [`docs/publishing.md`](docs/publishing.md) — flujo de release y consumo
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — convenciones, tests, PRs

## Estado

Pre-1.0. La API pública puede cambiar entre versiones menores hasta `1.0.0`.

## Licencia

MIT — ver [`LICENSE`](LICENSE).
