# PLAN — Unificación cross-app de código repetido (frontend + backend)

> Rama de planificación: `plan/unify-cross-app` (maya_platform).
> Fecha: 2026-06-11. Basado en 6 análisis paralelos de agentes (inventario maya_platform,
> duplicación cross-app backend, duplicación cross-app frontend, auditoría de capas dms,
> auditoría de capas dashboard/authz/audit/logs, síntesis de análisis previos).

## 0. Objetivo y restricciones no negociables

1. **Unificar todo el código duplicado** entre las 5 apps (dms, dashboard, authorization, audit, logs), extrayendo a `maya_platform` lo que sea reutilizable por ≥2 apps.
2. **Arquitectura estricta en backend**: `Controller (FormRequest + API Resource) → Service (DTOs, SIN Eloquent/DB) → Repository (único que usa Models) → BD`.
3. **Cero pérdida de funcionalidad.** Cualquier cambio de lógica, condicional o comportamiento observable se registra en el `changes.md` del repo afectado con el formato ya establecido (§7).
4. **Trabajo en ramas paralelas** por repo: `refactor/unify-cross-app` en cada app y en maya_platform (las apps parten de `develop`; maya_platform de `main`).
5. Verificación obligatoria por fase: tests backend (Pest `--no-coverage`, BD de test, **nunca** el Postgres del slot), tests frontend (Vitest), tsc por archivo en dms (gotcha OOM).

## 1. Estado actual (resumen de auditoría)

### Madurez de capas backend

| App | Madurez (1-5) | Gap |
|---|---|---|
| maya_audit | 5 | 0 — app de referencia |
| maya_dashboard | 5 | 0 |
| maya_authorization | 4 | `UserService::paginate()` devuelve paginador de Models (2 archivos) |
| maya_logs | 4 | Eloquent en 3 controllers (`ErrorCodeController:62,76`, `ErrorCodeCommentController:30,40`, `CommentController:34,57`) + `CommentService:119` |
| maya_dms | 3.5 | Persistencia OK vía 24 repos; pero 12 services del subsistema Document/Template devuelven **Models en vez de DTOs** y hacen `loadMissing`/iteración de relaciones en el Service; 3 controllers ensamblan envelope a mano |

### Paquetes maya_platform existentes (homes para extracciones)

- **JS (11)**: shared-auth/dashboard/editor/hooks/i18n/layout/profile/realtime/sidebar/styles/ui-react. Versión 0.15.0; `main` ya abierto a 0.16-dev.
- **PHP (7)**: shared-auth/editor/http/messaging/platform/profile/translations-laravel.
- **Fronteras difusas detectadas** (consolidar, no crear paquete): tablas server-side repartidas entre shared-ui (DataTable) y shared-hooks (useServerTable); notificaciones dispersas en 3 paquetes (realtime/sidebar/i18n).

## 2. Decisión de externalización a maya_platform

**SÍ se externaliza** (usado o usable por ≥2 apps, sin dominio específico):

| Candidato | Destino | Evidencia |
|---|---|---|
| `FdwTeardown` | shared-platform-laravel | byte-idéntico en 5/5 |
| `GenerateSeedersFromDatabase` (`db:generate-seeders`) | shared-platform-laravel (comando registrado por ServiceProvider) | byte-idéntico 407 líneas en 5/5 |
| Bootstrap `AppServiceProvider::boot()` (FdwTeardown listener + `Broadcast::routes` + `Auth::viaRequest('jwt-token')` + `ProfileMigrations::*` + `forceScheme`) | shared-platform-laravel: helper `registerFdwBootstrap()` parametrizable (alias middleware, lista migraciones, hook testing) | casi idéntico 5/5 |
| Resolución de usuario JWT (`jwt_user` → `User::find`) | shared-auth-laravel: trait `ResolvesJwtUser` + `JwtSubject::fromRequest()` | 19 archivos, 5 apps |
| `JwtProfileDto` base | shared-auth-laravel (dms extiende con claims académicos) | logs + dms |
| Render JSON de excepciones (`withExceptions`) | shared-http-laravel: `registerJsonExceptionRenderer()` con el mapa completo de authz | hoy inconsistente: authz 8 tipos, logs 1, resto vacío |
| Middleware/CORS/trustProxies de `bootstrap/app.php` | shared-http-laravel: `registerCommonMiddleware($middleware, $aliases)` | patrón 5/5 |
| `SearchAccentFold` (dms) + `LikeEscaper` (logs) | shared-http-laravel: `Maya\Search\AccentFold` unificado (`fold`, `sqlFoldedLowerColumn`, `escapeLike`) | mismo problema, soluciones parciales distintas; authz/audit/dashboard hoy filtran sin folding |
| Comando consumidor AMQP base | shared-messaging-laravel: `ConsumeQueueCommand` abstracto con la política de error/ACK de logs (la más robusta) | audit/logs/dashboard, robustez divergente |
| Contrato de ingesta | shared-messaging-laravel: interfaz `IngestionService` + plantilla parse→persist→resilient-log (solo scaffold; el dominio queda en cada app) | audit/dashboard/logs, solape ~30% |
| `Application` FDW read-only model | shared-profile-laravel: base `ReadOnlyFdwApplication` | audit+logs idéntico núcleo |
| `ApplicationService::pluckForFilter()` (cache-wrap) | shared-platform-laravel | audit+logs casi idéntico |
| `peerService.ts` (`peerOrigin`/`resolveServiceUrl`) | shared-auth-react | byte-idéntico 5/5 |
| `oidcAdapter.ts` | shared-auth-react: factory `createOidcAdapter()` | idéntico 5/5 |
| `api/http.ts` | shared-auth-react: `createServiceApiClient(slug)` | 5/5, solo difiere el slug |
| `mapApiError`/`formatActionError` | shared-auth-react: `mapApiErrorToI18nKey(err, prefix)` (canónica: la i18n de dashboard; dms migra de strings ES hardcodeados) | dashboard/dms/logs/audit divergentes |
| `buildQueryString` (omite vacíos, arrays con coma) | shared-auth-react | logs/audit/dms, 3 implementaciones |
| `api/auth.ts` + `MeProfile` estándar + `features/user-profile/*` | shared-profile-react (`StandardMeProfile`, provider tipado) | idéntico 4/4 |
| `resolveUserDisplay(profile, tokenUser)` → `{userName, userInitials}` | shared-profile-react (extender `profileDisplayInitials`) | reimplementado inline 5/5 |
| `PermissionGate`/`PermissionGuard` | shared-profile-react: `<PermissionGate permission mode="block"|"hide">` | audit/logs byte-idéntico + variante authz |
| `fetchApplications(scope)` | shared-profile-react: `createApplicationsApi()` genérico | audit+logs |
| `i18n/index.ts` + `i18next.d.ts` | shared-i18n-react: `createAppI18n()` + declaración compartida | idéntico 4/4 |
| `realtimeBootstrap.ts` | shared-realtime-react: `bootstrapRealtime(serviceSlug)` | 5/5 |
| `AuthLoadingScreen` | shared-ui-react | JSX byte-idéntico 5/5 |
| Fallback estándar de ErrorBoundary (`AppErrorFallback` i18n) | shared-ui-react | authz clase propia / dashboard i18n / audit+logs inline |
| App shell completo (`App.tsx`: OIDC bootstrap → gate login → AppLayout+Bell+Favorites+LocaleSync+Realtime) | shared-layout-react: `<MayaAppShell brand loginPermission dashboardUrl>{routes}</MayaAppShell>` | 5 App.tsx de 140-225 líneas casi clónicas |
| Stack de providers de `main.tsx` | shared-layout-react: `<MayaProviders>` (QueryClient+Auth+Router+Notification+Realtime+ErrorBoundary) | patrón 5/5 |
| `SearchInput` con defaults i18n `common.filters.*` | shared-ui-react | logs + patrón ad-hoc en audit/authz |

**NO se externaliza** (decisiones vinculantes previas o dominio de una sola app):

- Dominio Template/Document/bloques/versionado/PDF de dms — decisión vinculante de `ANALYSIS-UNIFY-TEMPLATE-DOCUMENT.md`: 0 paquetes nuevos, unificación local.
- `startNewRevisionCycle` (D-12): veredicto previo NO unificable (solape real 33%, ROI marginal).
- `useSharedFavorites` (shared) vs `useFavoritesIds` (dms): modelos distintos, NO unificar (SPIKE concluido).
- `permissions.ts` por app: el **contenido** es dominio propio; solo se comparte el guard (`PermissionGate`).
- No crear `shared-repository-laravel` genérico: las 5 apps ya tienen capa repo madura; un base abstracto añade acoplamiento sin eliminar duplicación real significativa.

## 3. Fases de ejecución y flota de agentes

> Convención: cada fase indica los agentes a lanzar **en paralelo** y el gate de salida.
> Agentes mutadores en repos distintos pueden correr simultáneamente; dentro del mismo repo, secuencial o con worktrees.

### Fase 0 — Preparación (1 agente + manual)
- Crear ramas `refactor/unify-cross-app` en los 7 repos (5 apps + maya_platform; dms-frontend es repo git aparte — verificar).
- Capturar baselines de tests por app (Pest y Vitest) para distinguir fallos preexistentes.
- **Gate**: baselines guardados en `reports/baseline-*.txt` por repo.

### Fase 1 — Extracciones a maya_platform (6 agentes paralelos, todos sobre maya_platform)
| Agente | Tipo | Alcance |
|---|---|---|
| A1 | tdd-guide | shared-platform-laravel: FdwTeardown + GenerateSeedersFromDatabase + pluckForFilter cacheado + registerFdwBootstrap |
| A2 | tdd-guide | shared-auth-laravel: ResolvesJwtUser + JwtSubject + JwtProfileDto base |
| A3 | tdd-guide | shared-http-laravel: registerJsonExceptionRenderer + registerCommonMiddleware + AccentFold |
| A4 | tdd-guide | shared-messaging-laravel: ConsumeQueueCommand + IngestionService scaffold; shared-profile-laravel: ReadOnlyFdwApplication |
| A5 | tdd-guide | JS lote 1: shared-auth-react (peerService, createOidcAdapter, createServiceApiClient, mapApiErrorToI18nKey, buildQueryString) + shared-realtime-react (bootstrapRealtime) |
| A6 | tdd-guide | JS lote 2: shared-profile-react (StandardMeProfile, provider, PermissionGate, resolveUserDisplay, createApplicationsApi) + shared-i18n-react (createAppI18n, i18next.d.ts) + shared-ui-react (AuthLoadingScreen, AppErrorFallback, SearchInput i18n) |
- Tests primero (RED→GREEN) en cada paquete. Cada export nuevo con test.
- **Gate**: suites de maya_platform verdes → `code-reviewer` + `security-reviewer` sobre el diff → release **0.16.0** (recordar: bump manual de package.json JS + tag; PHP vía monorepo-builder; paquete nuevo NO hay — evita el gotcha de SPLIT_TOKEN).

### Fase 2 — Adopción en las 5 apps (5 agentes paralelos, uno por app)
Cada agente, en la rama `refactor/unify-cross-app` de su app:
1. Bump specifiers a `^0.16` / `^0.16.0` (caret 0.x no cruza minors — obligatorio).
2. Borrar los duplicados locales y cablear los imports del paquete.
3. Backend: adoptar registerFdwBootstrap / exception renderer / middleware helper / AccentFold (authz/audit/dashboard ganan folding en búsqueda → **anotar en changes.md**: cambio funcional de búsqueda).
4. Frontend: adoptar los helpers compartidos; dms además migra `formatActionError` de strings ES a keys i18n (**changes.md**: mensajes de error cambian).
- **Gate por app**: Pest + Vitest verdes contra baseline; `build-error-resolver` si rompe; `code-reviewer` por app.

### Fase 3 — App shell frontend (esfuerzo L, 2 agentes secuenciados + 5 paralelos)
1. 1 agente `ui-engineer` diseña e implementa `<MayaAppShell>` + `<MayaProviders>` en shared-layout-react (con dashboard como caso más complejo: ReturnToHandler/ToastProvider/FavoritesProvider como slots).
2. Tras release 0.16.x: 5 agentes paralelos (uno por app) migran `App.tsx`/`main.tsx` al shell. authz pierde sus strings ES hardcodeados a favor de i18n (**changes.md**).
- **Gate**: e2e-runner sobre flujo login→layout→navegación en las 5 apps (smoke).

### Fase 4 — Cumplimiento estricto de capas backend (4 agentes paralelos)
| Agente | App | Trabajo |
|---|---|---|
| B1 | maya_dms | (1) Añadir a `DocumentRepository`/`TemplateRepository`/`TemplateReviewerRepository` los métodos `loadHeadVersion/loadOwner/loadOrderedBlocks/loadTemplate/loadTemplateVersion/delete(Template)/blockPayloadSnapshot` y mover allí los 15+ `loadMissing`/iteraciones de los 7 services violadores. (2) DMS-B03: services Document/Template devuelven DTO (`DocumentDto`/`TemplateDto` ya existen) — la conversión sale de los controllers. (3) `DocumentWithBlocksResource` + `ProcessController::index` al trait `RespondsWithEnvelope` + DTO para `reviewers` pool. Excepción documentada: `findModelOrFail` para `authorize()` (las Policies exigen Model) se mantiene y se anota como excepción aceptada en changes.md. |
| B2 | maya_logs | 3 controllers fuera de Eloquent (route-model binding o método de service) + `CommentService:119` → `ArchivedLogRepository`. Extraer `AbstractCommentController` para los 3 *CommentController. |
| B3 | maya_authorization | `UserService::paginate()` → `PaginatedDto<UserDto>`; `UserResource` consume DTO. Wrapper `withResilientLog()` en ApplicationService. |
| B4 | maya_audit + dashboard | Solo verificación (ya cumplen) + derivar `auditFilters.ts` de un único array de claves + `buildQueryString` compartido (frontend audit). |
- **Gate**: Pest verde por app; `code-reviewer` estricto sobre capas; cero cambios de contrato JSON (los Resources producen el mismo wire format — si algún campo cambia, **changes.md**).

### Fase 5 — Duplicación interna restante + deuda dms (3 agentes)
- D1 (dms backend): `normalizeChangelog`/`assertSnapshotNotEmpty` en EntityVersionLifecycleService; `ReviewWorkflowTrait` para TemplateReviewService↔DocumentReviewService (único par con solape alto real); centralizar updates de headVersion en TemplateRepository.
- D2 (dms frontend): pendientes vigentes del plan previo — F2.2 (Spinner/ConfirmDialog/Tabs shared con verificación visual), D12/D13/D14/D15, P-01/P-02, S-01/S-02, DMS-F02→DMS-F01 (hasMeaningfulContent → extracción WizardStep2Blocks). **Fase F5 Q-G (DocumentValidateView + troceo DocumentWizard) queda fuera: descartada explícitamente por el usuario; Fase 7 PATCH UpdateTemplateDto queda fuera (rama propia).**
- D3 (logs frontend): `FieldLabel`/`Select` shared en LogsFilters/ApplicationSelect.
- **Gate**: Vitest + tests Pest verdes; verificación visual de F2.2 con e2e-runner/browser.

### Fase 6 — Verificación final y cierre (4 agentes paralelos + consolidación)
- `code-reviewer` + `security-reviewer` por diff completo de cada repo (paralelo por repo).
- `pr-test-analyzer` sobre los diffs grandes (dms backend, shared packages).
- e2e smoke en las 5 apps.
- Consolidar los `changes.md` y actualizar `reviews/consolidated/` (cerrar DMS-B01..B05, LOG-01/02 si aplican).
- Commits convencionales por repo (sin push hasta OK del usuario); PRs con resumen por repo.

## 4. Orden y dependencias

```
F0 → F1 (maya_platform) → release 0.16.0 → F2 (5 apps en paralelo)
                                          ↘ F3.1 (shell) → release 0.16.x → F3.2 (5 apps)
F4 (independiente de F1-F3, puede arrancar en paralelo tras F0; mismo repo que F2 ⇒ secuenciar dentro de cada app: F2 → F4)
F5 tras F4 (dms) · F6 al final
```

Paralelismo real: máx. 6 agentes mutadores simultáneos (1 por repo). Reviewers/analizadores sin límite (read-only).

## 5. Riesgos y gotchas operativos (de memoria del proyecto)

- **Tests backend NUNCA contra el Postgres del slot** (RefreshDatabase borra BDs vivas). dms ya fuerza `maya_dms_test`; verificar equivalente en las otras 4 antes de F2.
- Pest con `--no-coverage` (pcov OOM); en dms correr Unit y Feature por separado (límite 128M).
- `tsc -b` completo en dms-frontend OOMea (contenedor 2GB) — verificar por archivo.
- Publicación JS requiere bump manual de package.json + tag (release.yml solo bumpea PHP).
- Caret `^0.x` no cruza minors — el bump de specifier en las 5 apps es parte del trabajo, no opcional.
- `reset-all.sh` / reset de maya_platform borra cambios sin commitear — commitear pronto y a menudo en la rama.
- dms frontend puede ser repo git separado del backend — confirmar en F0 dónde crear cada rama.
- Cambios en paquetes shared se prueban en vivo solo en dashboard-frontend (bind-mount); en el resto, `docker cp` + restart.

## 6. Criterios de aceptación

1. Cero archivos byte-duplicados entre apps de las listas de §2 (verificable con un agente de barrido final que repita el análisis cross-app y devuelva 0 hallazgos S).
2. Las 5 apps en madurez de capas 5/5 según re-auditoría (mismo prompt de auditoría que generó este plan).
3. Suites verdes contra baseline (sin regresiones nuevas).
4. Todo cambio funcional/condicional anotado en `changes.md` del repo correspondiente.
5. maya_platform 0.16.x publicado y consumido por las 5 apps con specifier correcto.

## 7. Protocolo changes.md (formato existente, reutilizar)

```markdown
## [FASE X.Y] <título corto>
- **Fecha**: YYYY-MM-DD
- **Severidad**: CRITICAL | HIGH | MEDIUM | LOW
- **Qué cambió**: comportamiento antes → después
- **Por qué**: razón de la unificación
- **Endpoint(s)/pantalla(s) afectados**
- **Impacto en cliente**: observable sí/no
- **Decidido por**: agente/usuario
```

Cambios funcionales YA previstos que requerirán entrada (mínimo):
1. Búsqueda con accent-folding en authz/audit/dashboard (antes: sensible a acentos).
2. Render JSON de excepciones uniforme en audit/dashboard/dms (antes: render por defecto de Laravel).
3. Mensajes de error de dms de strings ES hardcodeados → keys i18n.
4. Strings ES hardcodeados de authz (App.tsx, AppErrorBoundary) → i18n.
5. Política ACK/NACK del consumidor de audit pasa de naïve a la robusta de logs (reintentos/descartes cambian).
6. `ProcessController::index` cambia el meta de paginación a envelope estándar (verificar consumidores frontend).
