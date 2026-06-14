# Auditoría de internacionalización — paquetes JS/TS compartidos (maya_platform)

> Alcance: `/home/ggarrido/development/CEEDCV-tiptap/maya_platform/packages/js`
> Stack: React 19 + react-i18next. Utilidades i18n en `shared-i18n-react`.
> Fecha: 2026-06-14

## Resumen

| Métrica | Valor |
|---|---|
| Paquetes en alcance | 11 (`shared-*-react` + `shared-styles`) |
| Archivos `.tsx`/`.ts` revisados (excluye tests, `*.d.ts`, `vitest.config.ts`) | 162 |
| Archivos con incidencias | 7 |
| Total de hallazgos (strings hardcodeados de cara al usuario) | 28 |
| Severidad global | **alta** (paquetes compartidos: se propagan a las 5 apps) |
| Paquete más problemático | **`shared-ui-react`** (DatePicker, DataTable, MultiSelect, FieldLabel) |

### Paridad de locales

Perfecta. `shared-i18n-react/src/locales/{es,en,va}/{common,notifications}.json`:

- `common.json`: 263 claves en es / 263 en / 263 va — 0 ausentes.
- `notifications.json`: 36 claves en es / 36 en / 36 va — 0 ausentes.

No hay claves huérfanas ni faltantes entre los tres idiomas. El problema NO es paridad, sino **strings que nunca llegaron a externalizarse a claves**.

### Nota de método e interpretación

Muchos componentes (`Pagination`, `FiltersButton`, `ColumnVisibilityMenu`, `AppErrorFallback`, `NotificationsBell`, `MayaAppShell`, `ConfirmDialog`, `SourceInputDialog`) reciben sus textos por **props con valor por defecto**. Esos defaults en español/inglés NO se marcan como hallazgo bloqueante porque el consumidor puede (y debe) inyectar `t(...)`. Se listan aparte como *defaults no neutrales* (riesgo medio: si una app olvida pasar el label, aparece texto fijo en un idioma).

Los hallazgos de severidad alta son strings **no externalizables vía prop**: literales incrustados directamente en el JSX o en constantes de módulo. Esos SIEMPRE salen en un idioma fijo en las 5 apps.

El editor (`MayaEditor`, `EditorToolbar`, `FindReplaceBar`) usa un patrón correcto: `DEFAULT_LABELS` en inglés como fallback y `buildToolbarLabels(t)` para inyectar i18n; el namespace `editor.*` está completo en es/en/va. Por eso esos componentes no generan hallazgo salvo los 3 literales sueltos listados.

---

## Hallazgos por archivo

### Paquete `shared-ui-react` (severidad alta — el más problemático)

#### `shared-ui-react/src/DatePicker.tsx`

| Línea | String hardcodeado | Clave sugerida |
|---|---|---|
| 24 | `DAYS_OF_WEEK = ['L','M','X','J','V','S','D']` (iniciales día semana ES) | `common:datePicker.weekdaysShort` |
| 26-29 | `MONTH_NAMES = ['Enero','Febrero',…,'Diciembre']` | `common:datePicker.months` |
| 31-34 | `SHORT_MONTH_NAMES = ['ene','feb',…,'dic']` | `common:datePicker.monthsShort` |
| 85 | `placeholder = 'Seleccionar fecha'` | `common:datePicker.placeholder` |
| 228 | `aria-label="Limpiar fecha"` | `common:datePicker.clear` |
| 261 | `aria-label="Calendario"` | `common:datePicker.calendar` |
| 272 | `<p>Fecha seleccionada</p>` | `common:datePicker.selectedDate` |
| 285 | `aria-label="Mes anterior"` | `common:datePicker.prevMonth` |
| 298 | `aria-label="Mes siguiente"` | `common:datePicker.nextMonth` |
| 274 / 341 | plantilla `${day} de ${MONTH_NAMES[...]} ${year}` (preposición "de" fija ES) | `common:datePicker.dayLabel` (con interpolación) |

Componente íntegramente en español, sin ningún punto de inyección i18n. El más grave del alcance.

#### `shared-ui-react/src/DataTable.tsx`

| Línea | String hardcodeado | Clave sugerida |
|---|---|---|
| 303 / 359 | `aria-label="Voltear tarjeta"` (no overridable) | `common:dataTable.flipCard` |
| 304 / 360 | `title="Voltear"` (no overridable) | `common:dataTable.flip` |
| 678 | `aria-label="Vista"` (grupo toggle de vista) | `common:dataTable.viewGroup` |
| 683 | `title="Vista tabla"` | `common:dataTable.viewTable` |
| 702 | `title="Vista tarjetas"` | `common:dataTable.viewCards` |
| 723 | `title="Vista tarjetas con dorso"` | `common:dataTable.viewFlip` |

Las etiquetas de las vistas y del botón "voltear" están incrustadas en el JSX, no expuestas como props (a diferencia de `emptyMessage`/`filtersLabel`/`pageSizeLabel`, que sí lo están).

#### `shared-ui-react/src/MultiSelect.tsx`

| Línea | String hardcodeado | Clave sugerida |
|---|---|---|
| 84 | `` `${value.length} seleccionados` `` (resumen de selección, **no overridable**) | `common:multiSelect.selectedCount` (interpolación `{{count}}`) |
| 35 | `placeholder = 'Seleccionar…'` (default no neutral) | `common:multiSelect.placeholder` |

El contador "N seleccionados" se construye en el render y no admite prop → siempre sale en español.

#### `shared-ui-react/src/FieldLabel.tsx`

| Línea | String hardcodeado | Clave sugerida |
|---|---|---|
| 13 | `<span title="Obligatorio">*</span>` (no overridable) | `common:form.required` |

Tooltip del asterisco de campo obligatorio fijo en español; se repite en todos los formularios de las 5 apps.

### Paquete `shared-editor-react` (severidad media)

#### `shared-editor-react/src/components/ColorPicker.tsx`

| Línea | String hardcodeado | Clave sugerida |
|---|---|---|
| 15-26 | `PALETTE` con `label: 'Default'`, `'Black'`, `'Grey'`, `'Red'`, `'Orange'`, `'Yellow'`, `'Green'`, `'Cyan'`, `'Blue'`, `'Purple'`, `'Pink'`, `'Brown'` | `common:editor.colors.*` |

Los nombres de color se usan como `title`/`aria-label` de cada swatch (líneas 83-84) y NO son inyectables (constante de módulo). En inglés, mientras el resto del editor sí está traducido.

#### `shared-editor-react/src/components/EditorToolbar.tsx`

| Línea | String hardcodeado | Clave sugerida |
|---|---|---|
| 203 / 229 | `aria-label="Editor toolbar"` (inglés fijo, no usa `labels`) | `common:editor.toolbarAriaLabel` |

El resto del toolbar sí consume `labels` inyectables; solo este `aria-label` quedó fuera.

#### `shared-editor-react/src/components/FindReplaceBar.tsx`

| Línea | String hardcodeado | Clave sugerida |
|---|---|---|
| 158 | `aria-label="Find and replace"` (inglés fijo, el resto usa `labels.*`) | `common:editor.findReplaceAriaLabel` |

### Paquete `shared-sidebar-react` (severidad media)

#### `shared-sidebar-react/src/NotificationsBell.tsx`

| Línea | String hardcodeado | Clave sugerida |
|---|---|---|
| 92 | `return 'ahora'` (tiempo relativo, **no overridable**) | `notifications:relativeTime.now` |
| 93 | `` `${...} min` `` (sufijo minutos fijo) | `notifications:relativeTime.minutes` |
| 94 | `` `${...} h` `` (sufijo horas fijo) | `notifications:relativeTime.hours` |

`formatRelative()` (líneas 89-96) genera texto de cara al usuario en español incrustado. Las props `label`/`emptyLabel`/`markAllLabel` sí son inyectables (defaults en español, ver más abajo).

---

## Defaults no neutrales (severidad media — overridable vía prop)

No bloqueantes (el consumidor debería pasar `t(...)`), pero el valor por defecto está fijado en español/inglés. Si una app omite el prop, aparece texto en un idioma.

| Archivo | Línea(s) | Prop / default |
|---|---|---|
| `shared-ui-react/src/DataTable.tsx` | 417,431,432,446 | `emptyMessage='Sin datos'`, `filtersLabel='Filtros'`, `clearFiltersLabel='Limpiar'`, `pageSizeLabel='Por página'` |
| `shared-ui-react/src/Pagination.tsx` | 52-62 | `ariaLabel='Paginación'`, `prevLabel='Anterior'`, `nextLabel='Siguiente'`, `pageSizeLabel='Elementos por página'` |
| `shared-ui-react/src/FiltersButton.tsx` | 69,73 | `label='Filtros'`, `clearLabel='Limpiar'` |
| `shared-ui-react/src/ColumnVisibilityMenu.tsx` | 64,65 | `label='Columnas'`, `menuLabel='Visibilidad de columnas'` |
| `shared-ui-react/src/AppErrorFallback.tsx` | 24,26 | `heading='Ha ocurrido un error inesperado'`, `reloadLabel='Recargar página'` |
| `shared-ui-react/src/FavoriteStarGlyph.tsx` | 27 | `'aria-label'='Favorite'` |
| `shared-sidebar-react/src/NotificationsBell.tsx` | 99-101 | `label='Notificaciones'`, `emptyLabel='Sin notificaciones'`, `markAllLabel='Marcar todo como leído'` |
| `shared-layout-react/src/MayaAppShell.tsx` | 52,174-178 | `favoritesLabel='Favoritas'`, `loadingInitializingMessage='Iniciando sesión…'`, `loadingRedirectingMessage='Redirigiendo al inicio de sesión…'`, `loadingProfileMessage='Cargando perfil…'`, `loadingNoPermissionMessage='Sin acceso. Redirigiendo…'` |

---

## Archivos revisados sin incidencias

### shared-auth-react (20)
apiClient.ts, apiTypes.ts, AuthContext.tsx, authService.ts, createOidcAdapter.ts, createServiceApiClient.ts, data/createDataHook.ts, data/createMutationHook.ts, data/createPaginatedDataHook.ts, data/index.ts, index.ts, mapApiError.ts (devuelve claves i18n, no texto), peerService.ts, queryString.ts, sessionOverrides.ts, types.ts, useAuth.ts, useOidcSession.ts, userProfileCache.ts, vitest.config.ts

### shared-dashboard-react (8)
DashboardEditToggleButton.tsx, DashboardEditToolbar.tsx, DashboardSkeleton.tsx, index.ts, types.ts, useDashboardLayoutLocal.ts, WidgetFrame.tsx (usa `t` con fallback), WidgetGrid.tsx

### shared-editor-react (32 de 35 — 3 con incidencias)
CommentHoverPopover.tsx (`closeLabel` prop), EditorContentHtml.tsx, EditorContentJson.tsx, EditorIcons.tsx, EditorToolbarButton.tsx, EditorToolbarGroups.tsx, MayaEditor.tsx, SourceInputDialog.tsx (prop-driven), AlertBlock.ts, CommentMark.ts, IframeBlock.ts, Indent.ts, useEditorContent.ts, index.ts, buildToolbarLabels.ts, CommentAnchor.ts, docxToHtml.ts, dompurifyConfig.ts, editorExtensions.ts, htmlToMarkdown.ts, htmlToTiptapDoc.ts, isEditorReady.ts, looksLikeMarkdown.ts, markdownToHtml.ts, normalizeTableHtml.ts, renderTiptapJson.ts, splitHtmlIntoBlocks.ts, tableMenuActions.ts, tiptapContentSemantics.ts, parity/fingerprint.ts, types.ts, vitest.config.ts

### shared-hooks-react (8)
createDomainTableHook.ts, index.ts, useAutoSave.ts, useBackNavigation.ts, useFilterState.ts, useFlushOnPageLeave.ts, useServerTable.ts, vitest.config.ts

### shared-i18n-react (11) — utilidades del propio sistema i18n (fuera de auditoría por definición)
commonResources.ts, config.ts, createAppI18n.ts, createI18n.ts, deepMerge.ts, index.ts, notificationResources.ts, resolveNotificationText.ts, useKeycloakLocaleSync.ts, useLocale.ts, vitest.config.ts

### shared-layout-react (12 de 13)
AppLayout.tsx, appShell.types.ts, index.ts, MayaAppShell.tsx (defaults no neutrales, ver tabla), MayaLogoIcon.tsx (`aria-label="Maya"` = marca, no es hallazgo), MayaProviders.tsx, navIcons.tsx, SidebarCollapsedContext.tsx, Sidebar.tsx (i18n correcto), SidebarUserBlock.tsx (i18n correcto), types.ts, useDarkMode.ts, vitest.config.ts

### shared-profile-react (17)
academicContextTypes.ts, AccessGuard.tsx, canAccessByViewPermission.ts, components/UserAcademicContext.tsx (i18n correcto), createAcademicContextApi.ts, createApplicationsApi.ts, createProfileApi.ts, createStandardProfileApi.tsx, index.ts, PermissionGate.tsx, profileDisplayInitials.ts, resolveUserDisplay.ts, StandardMeProfile.ts, types.ts, useLogoutWithoutLoginPermission.ts, UserProfileContext.tsx, vitest.config.ts

### shared-realtime-react (5)
bootstrapRealtime.ts, createEcho.ts, index.ts, useRealtimeNotifications.ts, vitest.config.ts

### shared-sidebar-react (9 de 10)
appIcons.tsx, favoritesBus.ts, index.ts, NotificationProvider.tsx, resolveNotificationHref.ts, SidebarFavorites.tsx (i18n con fallback), useNotifications.ts, useSharedFavorites.ts, vitest.config.ts

### shared-ui-react (42 de 46)
Alert.tsx, AppErrorFallback.tsx (defaults no neutrales), ApplicationTile.tsx, AuthLoadingScreen.tsx (prop-driven), Avatar.tsx, BackButton.tsx (i18n correcto), badges.ts, Badge.tsx, Button.tsx, Card.tsx, Checkbox.tsx, ColumnVisibilityMenu.tsx (defaults no neutrales), ConfirmDialog.tsx (i18n correcto), date.ts, Drawer.tsx (i18n correcto), EmptyState.tsx (prop-driven), ErrorBoundary.tsx (i18n correcto), FavoriteStarGlyph.tsx (default no neutral), fieldClasses.ts, FilterField.tsx (prop-driven), FiltersButton.tsx (defaults no neutrales), index.ts, PageTitle.tsx, paginationLib.ts, Pagination.tsx (defaults no neutrales), PlaceholderPage.tsx, SearchInput.tsx (prop-driven, sin defaults fijos), Select.tsx, Skeleton.tsx, SortHeader.tsx, Spinner.tsx (i18n correcto), StatCard.tsx, Table.tsx, Tabs.tsx, TextArea.tsx, TextInput.tsx, Toast.tsx (i18n correcto), useConfirm.ts, useDebounce.ts, useFocusTrap.ts, useTablePreferences.ts, vitest.config.ts

### shared-styles (0)
Sin archivos `.ts`/`.tsx` en alcance.

---

## Recomendaciones

1. **Prioridad 1 — `DatePicker.tsx`**: es el peor caso (componente entero en español sin punto de inyección). Refactor: aceptar un objeto `texts`/`labels` opcional como hacen `MayaAppShell` y `UserAcademicContext`, con defaults vía `useTranslation('common')` y `defaultValue`. Añadir namespace `datePicker.*` (meses, meses cortos, días de semana, placeholders, aria-labels) a `common.json` en es/en/va.

2. **Prioridad 1 — literales no overridables**: `DataTable` (vistas/voltear), `MultiSelect` ("N seleccionados"), `FieldLabel` ("Obligatorio"), `NotificationsBell.formatRelative` ("ahora"/"min"/"h"). Externalizar a `common`/`notifications` con interpolación (`{{count}}`) donde aplique. Estos salen siempre en un idioma fijo en las 5 apps.

3. **Prioridad 2 — `ColorPicker` palette**: mover los 12 nombres de color a `common:editor.colors.*` (el resto del editor ya está traducido; rompe coherencia).

4. **Prioridad 2 — aria-labels sueltos del editor**: `EditorToolbar` ("Editor toolbar") y `FindReplaceBar` ("Find and replace") deben pasar por `labels`/`t`.

5. **Prioridad 3 — defaults no neutrales**: revisar que TODAS las apps consumidoras pasen explícitamente `t(...)` a los props con default en español/inglés (`DataTable`, `Pagination`, `FiltersButton`, `ColumnVisibilityMenu`, `AppErrorFallback`, `MayaAppShell`, `NotificationsBell`). Alternativa más robusta: hacer que esos componentes resuelvan el default vía `useTranslation('common')` con `defaultValue`, como ya hacen `Drawer`, `Spinner`, `ConfirmDialog`, `BackButton` y `Toast` (patrón de referencia a replicar).

6. **Mantener** la paridad es/en/va al añadir las nuevas claves: actualmente es perfecta (263/263/263 en `common`, 36/36/36 en `notifications`). Cada clave nueva debe aterrizar en los tres archivos simultáneamente.
