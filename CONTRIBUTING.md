# Contribuir a Maya Platform

## Reglas básicas

- **Conventional Commits**: `feat(shared-auth-laravel): ...`, `fix(shared-ui-react): ...`,
  `chore: ...`. El scope es el nombre del paquete (sin prefijo `shared-`).
- **PRs pequeños**: un PR cambia un paquete o un cambio cross-package coherente.
  Nada de "limpieza general".
- **Tests obligatorios** para PHP (Pest). Para React, mínimo `typecheck` pasa.
- **Sin breaking changes en menor** mientras estemos en 0.x: tampoco. Cualquier
  break requiere bump de minor (0.x.0 → 0.x+1.0) y nota en CHANGELOG.

## Añadir un paquete

1. Crea el directorio bajo `packages/php/<nombre>` o `packages/js/<nombre>`.
2. Manifest (`composer.json` o `package.json`) con:
   - `name: maya/<nombre>` o `@maya/<nombre>`
   - `version: 0.1.0`
   - `license: MIT`
   - `repository.url` apuntando a `https://github.com/Maya-AQSS/<nombre>`
3. **Crea el repo split vacío** en GitHub: `gh repo create Maya-AQSS/<nombre> --public --description "..."`.
4. Añade el paquete al workflow `split.yml` si necesitas overrides (normalmente
   no — el matrix lo descubre automáticamente).
5. PR con descripción clara del propósito.

## Tests

```bash
# PHP — desde la raíz
composer validate-packages
cd packages/php/<nombre> && composer install && composer test

# JS — desde la raíz
pnpm -r --filter='./packages/js/*' typecheck
pnpm -r --filter='./packages/js/*' test
```

## Modelo de ramas

- **`main` = solo releases.** Protegida. **Cada merge a `main` publica automáticamente.**
- **`feature/*` / `fix/*`**: ramas cortas desde `main`. PR → merge (preferible **squash**:
  1 PR = 1 versión).
- **No hay `develop`.** El desarrollo iterativo no necesita publicar: en las apps
  pon `MAYA_PKG_MODE=local` (ver `.maya-local.env`) y el override sirve la fuente de
  este repo EN VIVO desde el working tree, en la rama que tengas checkouteada (HMR
  en frontend; symlink de path repos en backend). Publicas solo cuando mergeas a `main`.

## Release (automático on merge a `main`)

El workflow `Release` se dispara **al hacer push/merge a `main`** (paths `packages/**`):

1. Calcula la versión siguiente desde los **Conventional Commits** acumulados desde el
   último tag: `feat:` → minor, resto → patch. Un `BREAKING CHANGE`/`!:` en 0.x cuenta
   como minor (no salta a 1.0.0).
2. Alinea versiones JS cruzadas + actualiza CHANGELOG por paquete (monorepo-builder).
3. Crea el tag `vX.Y.Z`.
4. Dispara `publish-npm` (npm con provenance) y `split` (propaga tag a los repos
   read-only → Packagist).

> Anti-bucle: los commits/tags que el workflow pushea usan `GITHUB_TOKEN`, y GitHub
> no entrega esos eventos para disparar nuevas runs. No hay recursión.

**Release manual** (hotfix / versión forzada): Actions → Release → Run workflow,
introduce la versión semver explícita. Si la dejas vacía, calcula igual que en push.

### Propagar a las 5 apps consumidoras

Tras publicar, los consumidores siguen pinneados con caret `^0.x` (que **no cruza
minor** en 0.x). Para subirlos a la versión nueva:

```bash
bash maya_infra/scripts/sync-shared-packages.sh           # a la última publicada
bash maya_infra/scripts/sync-shared-packages.sh 0.19.0    # a una concreta
bash maya_infra/scripts/sync-shared-packages.sh 0.19.0 --commit --push
```

Bumpea los specifiers (npm `package.json` + composer `composer.json`) y regenera los
lockfiles de las 5 apps. Luego `./up.sh` (o `reset-all.sh` en `MAYA_PKG_MODE=published`)
las reinstala desde el lock actualizado.

## Estilo de código

- **PHP**: PSR-12 + Laravel idioms. Servicios delgados, validación en FormRequest.
- **TS/React**: `strict: true`. Hooks customizados en lugar de useState+useEffect.
  Ver `.claude/rules/stack/react.md` del workspace para el detalle.

## Lo que NO va en este repo

- Lógica específica de un servicio. Si un componente solo lo usa `maya_dms`, vive
  en `maya_dms`, no aquí.
- Configuración de despliegue/Docker. Eso es `maya_infra`.
- Dependencias en runtime entre paquetes JS sin marcar como `peerDependency`.

## Cuándo extraer código aquí

Tres reglas:

1. **Aparece en ≥2 servicios.** No extraer en anticipación.
2. **API estable.** Si lleva cambiando 3 semanas seguidas, espera.
3. **Tests independientes posibles.** Si no puedes testear sin levantar un
   servicio real, probablemente no es candidato.
