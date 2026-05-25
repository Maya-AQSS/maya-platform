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

## Release

Los releases se hacen desde la UI de GitHub Actions (`Release` workflow). Pasos:

1. Asegúrate de que `main` está verde.
2. Actions → Release → Run workflow → introduce versión semver (`0.2.0`).
3. El workflow:
   - sincroniza versiones cruzadas
   - actualiza CHANGELOG por paquete
   - crea tag `v0.2.0`
   - dispara el workflow `split` que propaga el tag a los 13 repos read-only

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
