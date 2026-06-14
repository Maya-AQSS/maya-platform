# Auditoría de internacionalización — paquetes PHP/Laravel compartidos (maya_platform)

Fecha: 2026-06-14
Alcance: `maya_platform/packages/php/shared-*-laravel` (excluye `vendor/`, `node_modules/`, `tests/`)

## Resumen

| Métrica | Valor |
|---|---|
| Paquetes en alcance | 7 (auth, editor, http, messaging, platform, profile, translations) |
| Archivos `.php` revisados | 119 |
| Archivos con incidencias de cara al usuario | 3 |
| Total de hallazgos de cara al usuario | 5 |
| Severidad global | MEDIA |

### Estado de la infraestructura i18n

- **No existe ningún directorio `lang/`** ni fichero de traducciones (`.php`/`.json`) en ninguno de los 7 paquetes. La única dependencia de i18n es `DateRangeFilter`, que invoca `__('validation.*')` apoyándose en el `validation.php` de la app anfitriona.
- Por tanto **NO hay paridad de locales que medir** (es/en/va): no hay catálogos de traducción en los paquetes. El problema real es la **ausencia de capa i18n** combinada con cadenas mezcladas en dos idiomas (es + en) incrustadas en el código.
- Al ser paquetes COMPARTIDOS, cada cadena hardcodeada se propaga a las 5 apps (dms, dashboard, authz, audit, logs) → prioridad alta de corrección aunque el volumen sea bajo.

### Por qué solo 5 hallazgos y no más

La mayoría de las cadenas en estos paquetes son **excepciones técnicas de desarrollador** (`InvalidArgumentException`, `RuntimeException`) lanzadas por:
- Validaciones de contrato del SDK de mensajería (severidades/canales/scopes inválidos): las consume el código de la app, nunca el usuario final.
- Errores de configuración/arranque (`AUTH_JWT_AUDIENCE is not configured`, JWKS, FDW, dependencias composer).
- Validaciones de seguridad de identificadores SQL en `AccentFold` (con aviso explícito «Nunca pasar input de usuario»).

Estas **NO se internacionalizan** (son logs/errores de servidor 5xx que `JsonExceptionRenderer` oculta en producción). Se listan abajo como «revisados sin incidencias de cara al usuario».

El vector que convierte un `abort(4xx, '...')` en cadena de cara al usuario es `JsonExceptionRenderer::buildBody()` (`shared-http-laravel`), que **deja pasar tal cual los mensajes 4xx al cliente** (línea 141-147). De ahí que los `abort_if` con texto y los `AuthErrorResponse` sí cuenten como hallazgos.

## Hallazgos por archivo

### Paquete: shared-auth-laravel (paquete más problemático)

Concentra los 5 hallazgos. Es el más crítico porque sus middlewares/traits de auth se montan en TODAS las apps y sus mensajes llegan al cliente en respuestas 401/403.

| Archivo | Línea | Cadena hardcodeada | Idioma | Clave sugerida |
|---|---|---|---|---|
| `src/Concerns/ResolvesKeycloakUser.php` | 37 | `'Empleado no encontrado o inactivo en Odoo'` | es | `auth.user_not_found_or_inactive` |
| `src/Middleware/RequiresLocalUserMiddleware.php` | 31 | `'User not provisioned in local database.'` | en | `auth.user_not_provisioned` |
| `src/Http/AuthErrorResponse.php` | 20, 32 | `'Unauthenticated'` (campo `error`, 401) | en | `auth.unauthenticated` |
| `src/Http/AuthErrorResponse.php` | 41, 43 | `'Forbidden'` (default de `forbidden()`, campo `error`, 403) | en | `auth.forbidden` |
| `src/Concerns/ResolvesKeycloakUser.php` | 30 | `'Unauthenticated'` (`abort_if`, 401) | en | `auth.unauthenticated` |

Notas:
- **Severidad MEDIA, prioridad alta:** dos idiomas distintos (es vs en) para errores de auth equivalentes → inconsistencia de cara al usuario en las 5 apps. `'Empleado ... en Odoo'` además filtra detalle de implementación (Odoo) al cliente.
- `AuthErrorResponse::forbidden(string $message)` y `unauthenticated(string $error)` aceptan override por el llamador; basta con que el **default** salga de `__()` (p. ej. `__('auth.forbidden')`) para resolver el grueso sin romper firmas.

## Archivos revisados sin incidencias de cara al usuario

Se listan TODOS los archivos en alcance. Los que aparecen abajo o bien no contienen cadenas, o solo contienen cadenas técnicas/de desarrollador (excepciones de config, logs, contratos de SDK, identificadores SQL) que **no deben internacionalizarse**.

#### shared-auth-laravel
- `src/Concerns/ResolvesJwtUser.php`
- `src/Contracts/JwksServiceInterface.php`
- `src/Dtos/JwtProfileDto.php`
- `src/JwksService.php` — excepciones técnicas JWKS (dev-facing)
- `src/Middleware/JwtMiddleware.php` — `'Malformed JWT'`, `'JWT missing kid header'`, `'AUTH_JWT_AUDIENCE is not configured'`: errores técnicos/config (5xx, ocultos en prod)
- `src/Middleware/RequirePermissionMiddleware.php` — usa `AuthErrorResponse` (cubierto arriba)
- `src/Middleware/RequireRoleMiddleware.php` — usa `AuthErrorResponse` (cubierto arriba)
- `src/Models/BaseJwtUser.php`
- `src/Providers/SharedAuthServiceProvider.php` — excepción de config
- `src/Support/JwtSubject.php`

#### shared-editor-laravel
- `src/Converters/MarkdownToTiptap.php`
- `src/Providers/SharedEditorServiceProvider.php`
- `src/Renderers/TiptapHtmlRenderer.php`
- `src/Support/DocxExporter.php` — `RuntimeException` técnicas; default `$title = 'Document'` es parámetro del llamador, no UI

#### shared-http-laravel
- `src/Concerns/RespondsWithEnvelope.php` — `okMessage`/`errorMessage` reciben `$message` del llamador (no hay literal propio)
- `src/Controllers/AbstractHealthCheckController.php` — `'ok'`/`'error'` (status técnicos)
- `src/Data/FilterDto.php`
- `src/Exceptions/JsonExceptionRenderer.php` — `'Server Error'` proviene de `SymfonyResponse::$statusTexts`; es el sanitizador 5xx, parte de la utilidad
- `src/Filters/DateRangeFilter.php` — **YA internacionalizado** (`__('validation.after_or_equal'/'validation.date')`)
- `src/Health/DatabaseHealthCheck.php`, `FdwHealthCheck.php`, `HealthCheck.php`, `RedisHealthCheck.php`, `TcpHealthCheck.php` — mensajes de health checks (técnicos, no UI de usuario)
- `src/Http/Requests/PaginatedFilterRequest.php`
- `src/Pagination/PaginatedDto.php`
- `src/Search/AccentFold.php` — `InvalidArgumentException` de identificador SQL inseguro (dev-facing, nunca input de usuario)
- `src/Support/CommonMiddleware.php`

#### shared-messaging-laravel
- `config/messaging.php`
- `database/migrations/2026_05_07_000000_create_messaging_jobs_table.php`
- `src/Console/ConsumeQueueCommand.php`
- `src/Consumers/SafeAmqpConsumer.php`
- `src/Contracts/AuditableEvent.php`, `IngestionService.php`, `MessagePublisher.php`
- `src/Events/BroadcastNotificationCreated.php`
- `src/Exceptions/UnrecoverableIngestionException.php`
- `src/Jobs/RetryAmqpPublishJob.php`
- `src/Listeners/RecordAuditableEvent.php`
- `src/Logging/RabbitMQLogChannel.php`, `RabbitMQLogHandler.php`
- `src/Observers/AbstractAuditableModelObserver.php`
- `src/Observers/Concerns/NormalizesAuditTemporalPayload.php`
- `src/Providers/MessagingServiceProvider.php` — `RuntimeException` de config
- `src/Publishers/AlertPublisher.php`, `AuditPublisher.php`, `LogPublisher.php`, `NotificationPublisher.php`, `RabbitMQPublisher.php`, `ResilientLogPublisher.php` — `InvalidArgumentException` de contrato del SDK (dev-facing: «Invalid alert severity», «recipientId is required», etc.)
- `src/Services/AbstractIngestionService.php`
- `src/Support/AmqpConnectionFactory.php` — excepción de config
- `src/Support/AmqpConsumer.php`, `AuditRedactor.php`, `MessagingConfig.php`

#### shared-platform-laravel
- `src/Console/Commands/GenerateSeedersFromDatabase.php` — `RuntimeException` en español («No se pudo crear ...», «Snapshot seeder deshabilitado en producción»): salida de comando artisan (dev/CLI-facing, no UI de usuario final)
- `src/Data/ApplicationRefDto.php`
- `src/Database/PostgresFdwMigration.php`
- `src/Providers/SharedPlatformServiceProvider.php`
- `src/Repositories/AbstractFdwRepository.php`
- `src/Support/CachesFilterOptions.php`, `FdwTeardown.php`, `RegistersFdwBootstrap.php`

#### shared-profile-laravel
- `src/Controllers/AcademicContextController.php`, `LanguageController.php`, `MeController.php` — sin literales de cara al usuario
- `src/Database/ViewPermissionGateQuery.php`
- `src/Dtos/*` (Academic/CourseModule/Language/Study/Team/UserProfile/AcademicItem/AcademicContext)
- `src/Enums/Locale.php`
- `src/Http/Requests/UpdateLocaleRequest.php` — sin `messages()` custom; usa validación estándar (delega a `validation.php` de la app)
- `src/Http/Resources/AcademicContextResource.php`, `MeResource.php`
- `src/Migrations.php`
- `src/Models/ReadOnlyFdwApplication.php`
- `src/Providers/SharedProfileServiceProvider.php`
- `src/Repositories/**` (Contracts, Readers, Resolvers, Writers)
- `src/Routing/AcademicContextRoutes.php`, `MeRoutes.php`
- `src/Services/AcademicContextService.php`, `UserProfileService.php`, `Contracts/*`
- Todas las migraciones `database/migrations/**` (academic-assignments, academic-catalogs, languages, teams, user-permissions, users) — DDL, sin UI

#### shared-translations-laravel
- `database/migrations/translations/2026_06_05_000001_create_translations_table.php`
- `src/Concerns/HasTranslations.php` — utilidad i18n del propio paquete (IGNORADA por alcance)
- `src/Migrations.php`
- `src/Models/Translation.php`
- `src/Providers/SharedTranslationsServiceProvider.php`
- `src/Relations/StringKeyMorphMany.php`

## Recomendaciones

1. **Introducir un namespace de traducción propio del paquete auth.** Publicar un `lang/` (es/en/va) con un `auth.php` y registrarlo en `SharedAuthServiceProvider` vía `$this->loadTranslationsFrom(__DIR__.'/../lang', 'maya-auth')`. Referenciar las claves como `__('maya-auth::auth.forbidden')`.

2. **Reemplazar los 5 literales** por claves traducibles, priorizando los dos de idiomas divergentes:
   - `ResolvesKeycloakUser.php:37` → `__('maya-auth::auth.user_not_found_or_inactive')` (y dejar de filtrar «Odoo» al cliente).
   - `RequiresLocalUserMiddleware.php:31` → `__('maya-auth::auth.user_not_provisioned')`.
   - `AuthErrorResponse` defaults `'Unauthenticated'`/`'Forbidden'` → `__()` en los valores por defecto (las firmas con override se conservan).
   - `ResolvesKeycloakUser.php:30` `'Unauthenticated'` → misma clave que arriba.

3. **Unificar el idioma.** Hoy conviven es (`'Empleado...'`) y en (`'User not provisioned'`) para errores de auth equivalentes. Con catálogo i18n el idioma lo decide el `Accept-Language`/locale del usuario, no el literal.

4. **No internacionalizar** las excepciones técnicas/de configuración ni la salida CLI de `GenerateSeedersFromDatabase` ni las validaciones de contrato del SDK de mensajería: son dev-facing y `JsonExceptionRenderer` ya las sanea en producción (5xx → texto genérico). Internacionalizarlas añadiría ruido sin valor para el usuario final.

5. **Validación de locale:** `UpdateLocaleRequest` no define `messages()`. Si se quiere un mensaje de error legible para `Rule::in(Locale::values())`, añadir `messages()` con `__('validation.in')` (delegando a la app) en lugar de un literal.
