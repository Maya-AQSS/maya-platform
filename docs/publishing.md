# Publicación y consumo

## Flujo de release (resumen)

1. PR a `main` con los cambios.
2. CI verde (ci-php, ci-js).
3. Squash & merge.
4. Trigger manual del workflow `Release` en Actions con la nueva versión.
5. Workflow:
   - bump de `version` en todos los paquetes
   - actualiza CHANGELOG
   - crea tag `vX.Y.Z`
   - push
6. El tag dispara `split.yml` → los 13 repos read-only reciben commits + tag.
7. Consumidores actualizan su `composer require` / `package.json` al nuevo tag.

## Setup inicial requerido (una vez)

### Secrets organizacionales en GitHub

| Secret | Permisos | Uso |
|--------|----------|-----|
| `SPLIT_TOKEN` | Fine-grained PAT con `contents:write` en `Maya-AQSS/shared-*` | Push a los repos split |
| `PACKAGIST_TOKEN` (futuro) | Token Packagist | Publicación auto en Packagist |
| `NPM_TOKEN` (futuro) | Token npm | Publicación auto en npm |

### Repos read-only

Los 13 repos `Maya-AQSS/shared-*` se crean **una vez** vacíos. El split los
llena automáticamente.

```bash
for pkg in shared-auth-laravel shared-http-laravel shared-messaging-laravel \
           shared-platform-laravel shared-profile-laravel; do
  gh repo create "Maya-AQSS/$pkg" --public \
    --description "Read-only mirror of packages/php/$pkg from maya_platform. Do NOT PR here."
done

for pkg in shared-auth-react shared-dashboard-react shared-i18n-react \
           shared-layout-react shared-profile-react shared-sidebar-react \
           shared-ui-react; do
  gh repo create "Maya-AQSS/$pkg" --public \
    --description "Read-only mirror of packages/js/$pkg from maya_platform. Do NOT PR here."
done
```

Cada repo read-only debe tener:

- Issues **deshabilitados** (los bugs se reportan en `maya_platform`).
- Branch protection en `main` que solo permita pushes del bot del split.
- README auto-generado por el split que apunte al mono-repo.

## Cómo consumen los servicios

### Laravel (Composer)

Cada `composer.json` de servicio:

```jsonc
{
  "require": {
    "maya/shared-auth-laravel": "^0.1",
    "maya/shared-http-laravel": "^0.1"
  },
  "repositories": [
    { "type": "vcs", "url": "https://github.com/Maya-AQSS/shared-auth-laravel" },
    { "type": "vcs", "url": "https://github.com/Maya-AQSS/shared-http-laravel" }
  ]
}
```

Cuando publiquemos a Packagist, se elimina la sección `repositories` y se
sigue funcionando igual.

### React (npm/pnpm)

```jsonc
{
  "dependencies": {
    "@maya/shared-auth-react": "github:Maya-AQSS/shared-auth-react#v0.1.0"
  }
}
```

Pinear a tag concreto. Cuando publiquemos a npm registry, se reemplaza por
`"@maya/shared-auth-react": "^0.1.0"`.

## Desarrollo local con overrides

Para iterar sin ciclo commit → tag → reinstall, cada servicio soporta
overrides que apuntan al checkout local de `maya_platform`.

### Composer — `composer-merge-plugin`

Cada servicio Laravel tiene:

- `composer.json` con `"wikimedia/composer-merge-plugin"` en require-dev y
  declaración `"include": ["composer.local.json"]` en `extra.merge-plugin`.
- `composer.local.dist.json` versionado, plantilla:

  ```json
  {
    "repositories": {
      "maya-auth": {
        "type": "path",
        "url": "../../maya_platform/packages/php/shared-auth-laravel"
      }
    }
  }
  ```

- `composer.local.json` **gitignored**. El desarrollador lo copia desde el
  `.dist`: `cp composer.local.dist.json composer.local.json && composer update`.

Cuando existe, sus `repositories` sobreescriben los VCS del `composer.json`
base — Composer prefiere `path` sobre `vcs` automáticamente.

### npm — link condicional

Para JS proponemos un Makefile target en cada servicio:

```makefile
# maya_<service>/frontend/Makefile
link-platform:
\tpnpm link --global ../../../maya_platform/packages/js/shared-auth-react
\tpnpm link --global @maya/shared-auth-react
\t# ... repetir para cada paquete

unlink-platform:
\tpnpm unlink --global @maya/shared-auth-react
\tpnpm install
```

Una alternativa más limpia: convertir cada `<servicio>/frontend` en un
miembro de un workspace pnpm raíz que incluye `maya_platform/packages/js/*`.
Lo abordaremos cuando estabilicemos el flujo.

## Futuro: publicar en Packagist y npm

Cuando alcancemos `1.0.0`:

1. Registrar `maya/*` en Packagist (un único maintainer, vincular al
   mono-repo). Packagist detecta tags automáticamente.
2. Publicar `@maya/*` en npm con `publishConfig.access: public`. Workflow
   `release.yml` añade un step `pnpm publish -r --no-git-checks`.
3. Eliminar la sección `repositories` de los `composer.json` consumidores.
4. Cambiar `"github:Maya-AQSS/..."` por `"^1.0.0"` en `package.json`
   consumidores.
