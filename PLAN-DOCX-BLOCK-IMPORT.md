# Plan — Importar Word como bloques de plantilla

> **Working dir**: `/home/ggarrido/development/CEEDCV-tiptap/`
> **Branch**: `refactor/tiptap`
> **Origen**: petición de usuario sobre WizardStep2Blocks — permitir subir un `.docx`, ver su contenido, seleccionar rangos y crear N bloques de plantilla a partir de cada selección.

## 1. Resumen ejecutivo

Construir un componente **`DocxBlockSplitter`** que:
1. Acepta un `.docx`, lo convierte a HTML con `mammoth` (ya integrado).
2. Lo parte en elementos top-level (`<p>`, `<h*>`, `<table>`, `<ul>`, `<figure>`).
3. Permite al usuario asignar cada elemento a un "bloque destino" (`Bloque 1`, `Bloque 2`, …).
4. Llama `createBlock(template.id, …)` N veces con el HTML concatenado de cada grupo convertido a TipTap JSON.

Diseño en **3 capas desacopladas**: utilidades genéricas en el paquete shared, modal específico de DMS, y wiring en `WizardStep2Blocks`. Estimación MVP: **medio día**. Production-ready completo: **14-16h**.

## 2. UX flow

```
┌──────────────────────────────────────────────────────────────────┐
│ Wizard Step 2 — Bloques                                          │
│                                                                  │
│  [ + Añadir bloque ]   [ ↥ Importar Word ]   ← botón nuevo       │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼  (click → file picker .docx)
┌──────────────────────────────────────────────────────────────────┐
│ DocxBlockSplitter (modal portal a body, z-index 9998)            │
│                                                                  │
│  ┌─ Cabecera ───────────────────────────────────────────────┐    │
│  │ Importar bloques desde Word — programación-2026.docx     │    │
│  │ [Auto-split por H1] [Auto-split por H2] [Limpiar]  [✕]   │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─ Lista de elementos (col 60%) ───┐ ┌─ Bloques (col 40%) ──┐  │
│  │ ☐ H1: "Introducción"             │ │ Bloque 1             │  │
│  │ ☐ P: "Lorem ipsum dolor sit…"    │ │  Nombre: [_____]     │  │
│  │ ☐ P: "Vivamus condimentum…"      │ │  3 elementos         │  │
│  │ ☐ TABLE (3×4) "Tabla 1"          │ │  [preview]           │  │
│  │ ☐ H2: "Resultados de aprendizaje"│ │                      │  │
│  │ ☐ UL (5 items) "Lista de…"       │ │ Bloque 2             │  │
│  │ ☐ P: "Conclusiones…"             │ │  Nombre: [_____]     │  │
│  │                                  │ │  2 elementos         │  │
│  │ [Asignar a → Bloque ▾]           │ │                      │  │
│  │ [+ Crear nuevo bloque]           │ │ [+ Bloque vacío]     │  │
│  └──────────────────────────────────┘ └──────────────────────┘  │
│                                                                  │
│  [Cancelar]                              [Crear 2 bloques →]    │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼  (click "Crear 2 bloques")
                  POST /api/v1/templates/{id}/blocks   × 2
                  (secuencial, con progreso "1/2 creados…")
```

### Interacciones

- **Multi-selección de elementos**: click (selecciona uno), Ctrl+click (toggle), Shift+click (rango), Ctrl+A (todos).
- **"Asignar a → Bloque ▾"**: dropdown con bloques existentes + "Nuevo bloque". Si "Nuevo bloque", se crea entrada con auto-numeración (`Bloque N`).
- **"Auto-split por H1/H2"**: pre-asigna bloques usando los headings como separadores. Útil para Word con estructura jerárquica clara.
- **Reasignación**: click en un elemento ya asignado → muestra a qué bloque pertenece + opción "Desasignar".
- **Nombre del bloque**: editable inline en el panel derecho. Si vacío al crear, usa "Bloque N".
- **Preview por bloque**: render con `EditorContentHtml` del HTML concatenado del bloque (mismo renderer que se usará al guardar).

## 3. Arquitectura — 3 capas

```
┌─ shared-editor-react/src/ (paquete, dominio-agnóstico) ─────────┐
│  lib/splitHtmlIntoBlocks.ts                                     │
│  lib/htmlToTiptapDoc.ts                                         │
└─────────────────────────────────────────────────────────────────┘
                          ↑
┌─ maya_dms/frontend/src/features/templates/components/ ──────────┐
│  DocxBlockSplitter.tsx        ← modal + state machine           │
│  DocxBlockSplitter.styles.css                                   │
└─────────────────────────────────────────────────────────────────┘
                          ↑
┌─ WizardStep2Blocks.tsx ─────────────────────────────────────────┐
│  + Botón "Importar Word"                                        │
│  + Handler onImport(blocks) → for each → createBlock(…)         │
└─────────────────────────────────────────────────────────────────┘
```

### Capa 1 — Utilidades en `shared-editor-react`

**`lib/splitHtmlIntoBlocks.ts`** — dominio-agnóstico, sin React.

```ts
export type BlockChunkType =
  | 'heading' | 'paragraph' | 'list' | 'table'
  | 'figure' | 'blockquote' | 'codeBlock' | 'horizontalRule' | 'other';

export interface BlockChunk {
  /** Stable index in document order. */
  index: number;
  /** Semantic type for filtering + icon. */
  type: BlockChunkType;
  /** Heading level when type === 'heading' (1-6). */
  level?: number;
  /** HTML serialisation of the element (preserved for round-trip). */
  html: string;
  /** Plain-text snippet, max 200 chars, for the list label. */
  text: string;
  /** True for empty `<p>`/`<br>`-only paragraphs (callers may skip). */
  isEmpty: boolean;
}

export function splitHtmlIntoBlocks(html: string): BlockChunk[];
```

Implementación: `DOMParser`, walk `body.children`, mapear cada elemento top-level a un `BlockChunk`. Detectar tipos por `tagName`:

- `H1-H6` → `heading` con `level`
- `P` → `paragraph` (o `isEmpty=true` si solo whitespace o `<br>`)
- `UL` / `OL` → `list`
- `TABLE` → `table`
- `FIGURE` → `figure`
- `BLOCKQUOTE` → `blockquote`
- `PRE` → `codeBlock`
- `HR` → `horizontalRule`
- resto → `other`

Tests Vitest (`splitHtmlIntoBlocks.test.ts`):
- 5 párrafos seguidos → 5 chunks
- H1 + P + TABLE + UL → 4 chunks con tipos correctos
- Empty `<p>`/`<br>` → `isEmpty=true`
- Anidados (`<div><p>…</p></div>`) → fallback `other`

**`lib/htmlToTiptapDoc.ts`** — sin DOM al cargar, usa headless editor solo cuando se invoca.

```ts
import type { TiptapDoc } from '../types';

/**
 * Convert sanitised HTML to a ProseMirror/TipTap JSON doc using a
 * headless editor configured with the same extensions as MayaEditor
 * (so the round-trip matches what gets persisted).
 *
 * `extensions` is required — the caller passes the same list it built
 * for MayaEditor so the schema is identical. We don't import the
 * extension list here to keep the helper tree-shake-friendly.
 */
export function htmlToTiptapDoc(html: string, extensions: unknown[]): TiptapDoc;
```

Implementación: `new Editor({ content: html, extensions })`, devolver `editor.getJSON() as TiptapDoc`, `editor.destroy()`.

Tests Vitest (con `jsdom`):
- `<p>hello</p>` → `{ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hello' }] }] }`
- Tabla compleja con `caption` → matches normalised output
- HTML vacío → `{ type: 'doc', content: [] }`

### Capa 2 — `DocxBlockSplitter.tsx` (maya_dms)

```ts
interface DocxBlockSplitterProps {
  open: boolean;
  onCancel: () => void;
  /** Called with the final block list when the user clicks "Crear". */
  onConfirm: (blocks: Array<{ name: string; html: string }>) => Promise<void>;
  isDark?: boolean;
}
```

Estado interno:

```ts
interface ImportState {
  filename: string | null;
  chunks: BlockChunk[];                       // de splitHtmlIntoBlocks
  selected: Set<number>;                       // índices seleccionados ahora mismo
  assignments: Map<number, string>;            // chunkIndex → blockId
  blocks: Array<{ id: string; name: string }>; // bloques destino en orden
  status: 'idle' | 'parsing' | 'ready' | 'creating' | 'done' | 'error';
  progress?: { current: number; total: number };
  error?: string;
}
```

Métodos:
- `handlePickFile(file)` → mammoth → normalize → sanitize → splitHtmlIntoBlocks
- `toggleSelection(index, mode: 'single' | 'toggle' | 'range')`
- `assignSelection(blockId | 'new')` → mueve los seleccionados al bloque destino
- `unassignSelection()`
- `renameBlock(blockId, name)`
- `removeBlock(blockId)` → desasigna sus chunks
- `autoSplitByHeading(level)` → crea N bloques agrupando chunks consecutivos entre headings
- `handleConfirm()` → ordena chunks por `index` dentro de cada bloque, concatena `html`, llama `onConfirm`

UI: 2 columnas en flexbox. Lista izquierda con elementos como tarjetas seleccionables (con icono por tipo + texto truncado). Panel derecho con bloques (drag handle para reorden opcional). Footer con `[Cancelar]` y `[Crear N bloques]`.

Portal a `<body>` (igual que `SourceInputDialog`). z-index 9998. Hereda tema dark del `MayaEditor` wrapper si está disponible.

### Capa 3 — Wiring en `WizardStep2Blocks.tsx`

```tsx
const [docxSplitterOpen, setDocxSplitterOpen] = useState(false);

const handleImportDocx = async (blocks: Array<{ name: string; html: string }>) => {
  for (let i = 0; i < blocks.length; i++) {
    const { name, html } = blocks[i];
    const doc = htmlToTiptapDoc(html, mayaEditorExtensions);  // capa 1
    await createBlock({
      title: name,
      default_content: doc.content,                            // array, matches backend
      description: null,
      block_state: 'editable',
      mandatory: false,
    });
  }
  setDocxSplitterOpen(false);
};
```

UI: añadir botón `Importar Word` al lado del existente `+ Añadir bloque`. Click → `setDocxSplitterOpen(true)`.

## 4. Decisiones de diseño tomadas

| Decisión | Opción elegida | Justificación |
|---|---|---|
| **Granularidad** | Elementos top-level (no selección de texto) | Alineado con mental model de "bloques"; deterministic; sin range edge cases |
| **Numeración** | Auto "Bloque N" editable inline | Reduce fricción; usuario puede personalizar sin obligación |
| **Tablas/listas/figures** | Unidad atómica (no split) | Preserva integridad estructural; alineado con schema TipTap |
| **Posición** | Append al final de la plantilla | `createBlock` ya hace append; cero ambigüedad |
| **Reorden de bloques destino** | NO durante asignación; YES después en sidebar | Sidebar de bloques ya tiene drag; no duplicar |
| **Elementos vacíos** | Auto-skip `<p>` con sólo whitespace/`<br>` | Mammoth genera estos por separadores Word; ruido visual |
| **Mecánica de selección** | click (single), Ctrl+click (toggle), Shift+click (range) | Convención de SO |
| **Async creation** | Secuencial con progreso visible | Backend no soporta batch; secuencial es simple y debuggable |
| **Fallo parcial** | Mostrar "3/5 creados, 2 fallaron" + botón Retry | No rollback (caro y riesgoso); usuario elimina manualmente |
| **Conversión a TipTap JSON** | Cliente, on-confirm, sin Web Worker | Trivial para docs de tamaño normal; medir antes de optimizar |

## 5. Riesgos y mitigaciones

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| **Word con 200+ párrafos** rinde lento | Media | Virtualización con `react-window` en la lista (post-MVP). En MVP: paginación de 100 |
| **Mammoth pierde track changes / comments** | Alta | Documentar como limitación. Warning si detecta tags no soportados (`<del>`, `<ins>`) |
| **Imágenes base64 enormes** | Media | MVP: aceptarlas. Iteración: detectar `data:image/*;base64` y ofrecer subirlas vía `uploadFile` antes de persistir |
| **Headings consecutivos sin contenido** | Baja | Permitido — el usuario puede crear bloque "solo título" si quiere |
| **Caracteres especiales / encoding** | Baja | mammoth devuelve UTF-8 limpio; DOMPurify ya lo maneja |
| **Conflicto con autosave del wizard** | Baja | Modal bloquea el editor; al cerrar, se re-evalúa el `formContent` actual |
| **Permisos** | Baja | El botón solo aparece si `canCreateBlocks` (ya existe permission check) |
| **Doc malformado lanza en mammoth** | Media | try/catch en `handlePickFile`; mostrar error amigable en el modal |
| **Block API devuelve 422** | Baja | Mostrar el error específico (`The default_content field …`) en el modal |
| **Bloqueo del thread durante conversión** | Baja | mammoth.convertToHtml ya retorna Promise; para >100 chunks usar `requestIdleCallback` (post-MVP) |

## 6. Implementation plan — fases

### Fase 1 — Utilidades en shared-editor-react (2h)

**Archivos nuevos**:
- `maya_platform/packages/js/shared-editor-react/src/lib/splitHtmlIntoBlocks.ts`
- `maya_platform/packages/js/shared-editor-react/src/lib/splitHtmlIntoBlocks.test.ts`
- `maya_platform/packages/js/shared-editor-react/src/lib/htmlToTiptapDoc.ts`
- `maya_platform/packages/js/shared-editor-react/src/lib/htmlToTiptapDoc.test.ts`

**Archivo modificado**:
- `maya_platform/packages/js/shared-editor-react/src/index.ts` — export ambos helpers + tipo `BlockChunk`

**Tests** (Vitest + jsdom): 8-10 cases entre ambos. Gate: 100% pasando.

**Commit**: `feat(editor): splitHtmlIntoBlocks + htmlToTiptapDoc utilities`

### Fase 2 — DocxBlockSplitter MVP (5-7h)

**Archivos nuevos**:
- `maya_dms/frontend/src/features/templates/components/DocxBlockSplitter.tsx`
- `maya_dms/frontend/src/features/templates/components/DocxBlockSplitter.module.css`

**Scope MVP**:
- ✅ File picker `.docx` + mammoth + parse
- ✅ Listado de chunks con icono por tipo + texto truncado
- ✅ Multi-selección (click, Ctrl, Shift)
- ✅ Asignación a bloque (nuevo o existente)
- ✅ Renombrar bloque inline
- ✅ Eliminar bloque
- ✅ Preview por bloque (`EditorContentHtml`)
- ✅ "Crear" con progreso secuencial
- ✅ Tema dark
- ✅ Portal a body + z-index 9998

**Out of MVP** (post-MVP):
- ❌ Auto-split por heading
- ❌ Drag reorder de bloques destino
- ❌ Virtualización
- ❌ Web Worker para conversión
- ❌ Retry parcial
- ❌ Detección de tags no soportados de Word

**Tests**: integración E2E manual.

**Commit**: `feat(templates): DocxBlockSplitter modal for batch block import`

### Fase 3 — Dropdown extensible + integración en WizardStep2Blocks (1.5h)

**Archivos nuevos**:
- `maya_dms/frontend/src/features/templates/blockSources.ts` — registro `BLOCK_SOURCES` (ver Anexo C)

**Archivo modificado**:
- `maya_dms/frontend/src/features/templates/components/WizardStep2Blocks.tsx`
  - Sustituir botón `+ Añadir bloque` por `DropdownMenu` que itera `BLOCK_SOURCES`
  - Import `DocxBlockSplitter` + `htmlToTiptapDoc` + `BLOCK_SOURCES`
  - State `docxSplitterOpen`
  - Construir `blockSourceCtx` con `{ templateId, createBlock, openDocxSplitter, setActiveDialog, hasPermission }`
  - Handler `handleImportDocx(blocks)` que recorre y llama `createBlock` con `htmlToTiptapDoc(html)`
  - Render `<DocxBlockSplitter open={docxSplitterOpen} … onConfirm={handleImportDocx} />`

**Commit**: `feat(wizard): extensible BLOCK_SOURCES dropdown for "Add block" + docx import`

### Fase 4 — UX polish (3-4h) — opcional, iterativo

| Tarea | Tiempo | Valor |
|---|---|---|
| Auto-split por H1 / H2 | 1h | Alto — uso muy común |
| Atajos teclado (Ctrl+A, Esc, Enter) | 30min | Medio |
| Detección de tags no soportados + warning | 30min | Medio |
| Retry parcial en caso de fallo | 1h | Medio — útil si red flaky |
| Reorden drag de bloques destino | 1h | Bajo — sidebar ya lo permite |
| Animación entre selecciones | 30min | Cosmético |

### Fase 5 — Tests + documentación (2h)

- E2E Playwright: subir `.docx` fixture, asignar, verificar bloques creados en backend
- README en el paquete con ejemplo de uso de `splitHtmlIntoBlocks` y `htmlToTiptapDoc`
- Sección en docs internas con limitaciones de mammoth conocidas

**Commit**: `test(editor): E2E for docx-to-blocks flow + docs`

## 7. Estimación total

| Fase | Trabajo | Tiempo |
|---|---|---|
| 1 | Utilidades shared + tests | 2h |
| 2 | DocxBlockSplitter MVP | 5-7h |
| 3 | Dropdown extensible + wiring wizard | 1.5h |
| **MVP total** | **Funcional, end-to-end** | **~10-11h** |
| 4 | UX polish completo | 3-4h |
| 5 | Tests E2E + docs | 2h |
| **Production-ready total** | **Polished + tested** | **~15-17h** |

## 8. Criterios de aceptación

**MVP**:
- [ ] Botón `+ Añadir bloque ▾` muestra dropdown con `Bloque simple` y `Importar desde Word`
- [ ] "Bloque simple" mantiene el comportamiento actual (crea bloque vacío editable)
- [ ] "Importar desde Word" abre modal con file picker `.docx`
- [ ] Parsing falla con mensaje claro si el archivo está corrupto
- [ ] Lista muestra los chunks con icono + texto truncado por tipo
- [ ] Multi-selección funciona (click, Ctrl, Shift)
- [ ] Asignar selección a nuevo bloque crea entrada en panel derecho
- [ ] Renombrar bloque inline persiste el cambio en estado local
- [ ] Preview muestra HTML renderizado del bloque destino
- [ ] Botón "Crear N bloques" deshabilitado si hay bloques con 0 chunks
- [ ] "Crear" llama `createBlock` N veces (estado `editable`) con barra de progreso `1/N`
- [ ] Modal cierra automáticamente al terminar
- [ ] Bloques importados aparecen al final del sidebar
- [ ] Primer bloque importado queda seleccionado tras cerrar el modal
- [ ] Cancel descarta toda la operación sin crear nada
- [ ] Tema dark se aplica correctamente
- [ ] Añadir un nuevo `BlockSource` en `BLOCK_SOURCES` lo hace aparecer en el dropdown sin tocar el wizard

**Production-ready** (adicional):
- [ ] Auto-split por H1 / H2 funciona
- [ ] Retry parcial recupera bloques fallidos
- [ ] E2E test cubre el flujo completo
- [ ] Warning para tags no soportados (track changes)
- [ ] Atajos teclado documentados

## 9. Recursos existentes que reutilizamos

| Recurso | Ubicación |
|---|---|
| `mammoth/mammoth.browser` | `maya_dms/frontend/node_modules` (ya instalado) |
| `normalizeTableHtml` | `shared-editor-react/src/lib/` |
| `sanitizeEditorHtml` | `shared-editor-react/src/lib/dompurifyConfig.ts` |
| `EditorContentHtml` (read-only render) | `shared-editor-react/src/components/` |
| `createBlock` API | `maya_dms/.../api/blocks` |
| Pattern modal portal + dark theme | `SourceInputDialog`, `CommentHoverPopover` |
| `useCompletedBlocks` (localStorage pattern) | `maya_dms/features/documents/hooks` |

## 10. Decisiones tomadas

1. **Entry point — `+ Añadir bloque` se convierte en dropdown** ✅
   - Click en `+ Añadir bloque ▾` despliega un menú con opciones:
     - **"Bloque simple"** → comportamiento actual (crea bloque vacío editable)
     - **"Importar desde Word"** → abre `DocxBlockSplitter`
     - *(futuro: galería de plantillas, generador AI, etc. sin tocar el wizard)*
   - **Decisión arquitectónica**: se introduce un registro extensible de "fuentes de bloque" (`BLOCK_SOURCES`) para que añadir un tipo nuevo sea declarativo — añadir entrada al array, listo (ver Anexo C).

2. **Estado inicial de bloques importados** — `editable` ✅
   - `block_state: 'editable'`, `mandatory: false`.

3. **Auto-split por defecto** — NO ✅
   - Al cargar el doc, ningún chunk está pre-asignado. El usuario decide manualmente cómo agrupar.
   - Los botones "Auto-split por H1/H2" siguen siendo accesibles como atajo voluntario.

4. **Bloques vacíos** — NO permitidos durante la importación ✅
   - "Crear N bloques" queda deshabilitado si algún bloque destino tiene 0 chunks asignados.
   - Si el usuario quiere bloques vacíos, los crea después con la opción **"Bloque simple"** del dropdown.

5. **UX del importador — formato preview, post-confirmar vuelve al wizard** ✅
   - Modal con `max-height: 90vh` y scroll interno (mismo patrón que el preview actual).
   - Al pulsar "Crear N bloques":
     - Estado `creating` con barra de progreso `1/N`
     - Llamadas secuenciales a `createBlock`
     - Al terminar, modal se cierra automáticamente
     - El sidebar del wizard refresca y los nuevos bloques aparecen al final
     - El primer bloque importado se selecciona automáticamente para feedback visual.

## 11. Próximos pasos sugeridos

1. **Fase 1** (2h): utilidades en shared-editor-react con tests
2. **Demo interno** del helper `splitHtmlIntoBlocks` contra un doc real
3. **Fase 2** (medio día): MVP del modal `DocxBlockSplitter` + registro extensible `BLOCK_SOURCES`
4. **Fase 3** (1h): wiring en wizard — sustituir `+ Añadir bloque` por dropdown
5. **Demo end-to-end** al usuario
6. Iterar según feedback antes de meter polish (fase 4)

## Anexo A — Estructura de archivos resultante

```
maya_platform/packages/js/shared-editor-react/src/
  lib/
    splitHtmlIntoBlocks.ts          ← nuevo (fase 1)
    splitHtmlIntoBlocks.test.ts     ← nuevo (fase 1)
    htmlToTiptapDoc.ts              ← nuevo (fase 1)
    htmlToTiptapDoc.test.ts         ← nuevo (fase 1)
  index.ts                          ← modificado (export nuevos helpers)

maya_dms/frontend/src/features/templates/components/
  DocxBlockSplitter.tsx             ← nuevo (fase 2)
  DocxBlockSplitter.module.css      ← nuevo (fase 2)
  WizardStep2Blocks.tsx             ← modificado (fase 3)

maya_dms/frontend/e2e/
  docx-import.spec.ts               ← nuevo (fase 5)
```

## Anexo B — APIs nuevas exportadas

```ts
// shared-editor-react
export { splitHtmlIntoBlocks } from './lib/splitHtmlIntoBlocks';
export type { BlockChunk, BlockChunkType } from './lib/splitHtmlIntoBlocks';
export { htmlToTiptapDoc } from './lib/htmlToTiptapDoc';
```

```ts
// maya_dms (component prop surface)
interface DocxBlockSplitterProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: (blocks: Array<{ name: string; html: string }>) => Promise<void>;
  isDark?: boolean;
}
```

No hay cambios en API backend — se reutiliza el endpoint existente `POST /api/v1/templates/{id}/blocks`.

## Anexo C — Registro extensible `BLOCK_SOURCES`

Para que el dropdown `+ Añadir bloque ▾` sea extensible sin tocar el wizard cuando aparezcan nuevos tipos de bloque:

```tsx
// maya_dms/frontend/src/features/templates/blockSources.ts

import type { TemplateBlock } from '../../types/blocks';
import type { CreateBlockInput } from './api/blocks';

export interface BlockSourceContext {
  templateId: string;
  createBlock: (input: CreateBlockInput) => Promise<TemplateBlock>;
  openDocxSplitter: () => void;
  /** Future modals/dialogs hook into this dispatcher. */
  setActiveDialog: (id: string | null) => void;
  hasPermission: (perm: string) => boolean;
}

export interface BlockSource {
  /** Stable id used as dropdown menu key. */
  id: string;
  /** Label rendered in the dropdown item. */
  label: string;
  /** Optional helper text shown below the label. */
  description?: string;
  /** Optional glyph rendered to the left of the label. */
  icon?: React.ReactNode;
  /** Predicate that hides the entry when it returns false. */
  isAvailable?: (ctx: BlockSourceContext) => boolean;
  /** Click handler. */
  onSelect: (ctx: BlockSourceContext) => void | Promise<void>;
}

export const BLOCK_SOURCES: BlockSource[] = [
  {
    id: 'simple',
    label: 'Bloque simple',
    description: 'Crear un bloque vacío editable',
    icon: '+',
    onSelect: async ({ createBlock }) => {
      await createBlock({
        title: 'Bloque sin nombre',
        block_state: 'editable',
        mandatory: false,
        default_content: null,
        description: null,
      });
    },
  },
  {
    id: 'docx',
    label: 'Importar desde Word',
    description: 'Subir un .docx y dividir su contenido en bloques',
    icon: '↥',
    onSelect: ({ openDocxSplitter }) => openDocxSplitter(),
  },
  // Future entries (template gallery, AI-generated blocks, …) drop in here
  // without touching the wizard.
];
```

El wizard renderiza el dropdown iterando `BLOCK_SOURCES`:

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="primary" size="sm">+ Añadir bloque ▾</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="start">
    {BLOCK_SOURCES
      .filter(src => !src.isAvailable || src.isAvailable(blockSourceCtx))
      .map(src => (
        <DropdownMenuItem
          key={src.id}
          onSelect={() => void src.onSelect(blockSourceCtx)}
          className="flex items-start gap-2 py-2"
        >
          {src.icon && <span aria-hidden className="mt-0.5">{src.icon}</span>}
          <div>
            <div className="font-medium leading-tight">{src.label}</div>
            {src.description && (
              <div className="text-xs text-text-muted mt-0.5">{src.description}</div>
            )}
          </div>
        </DropdownMenuItem>
      ))}
  </DropdownMenuContent>
</DropdownMenu>
```

Beneficios:
- Añadir un tipo de bloque futuro = añadir una entrada al array
- Permisos por entrada son declarativos (`isAvailable`)
- El wizard no acumula `if (sourceX) … else if (sourceY)` con el tiempo
- Tests unitarios por entrada en aislamiento

## Anexo D — Flujo final del importador (post-decisiones)

```
1. Usuario en wizard step 2
   │
   ▼ click [+ Añadir bloque ▾]
2. Dropdown abre:
   • Bloque simple        ← crea uno vacío y cierra el dropdown
   • Importar desde Word  ← abre modal DocxBlockSplitter
   │
   ▼ click "Importar desde Word"
3. DocxBlockSplitter modal — estado `idle`, file picker visible
   │
   ▼ usuario elige .docx
4. Estado `parsing` (~200ms — mammoth + splitHtmlIntoBlocks)
   │
   ▼ parsing OK
5. Estado `ready` — lista de chunks visible, panel derecho vacío
   │
   ▼ usuario selecciona chunks 1, 2, 3 → "Asignar a → Nuevo bloque"
   ▼ panel derecho muestra "Bloque 1" con 3 chunks
   ▼ usuario selecciona chunks 4, 5 → "Asignar a → Nuevo bloque"
   ▼ panel derecho muestra "Bloque 2" con 2 chunks
   ▼ usuario renombra "Bloque 1" → "Introducción"
   ▼ (botón "Crear N" deshabilitado mientras algún bloque tenga 0 chunks)
   │
   ▼ click "Crear 2 bloques"
6. Estado `creating` — barra de progreso "1/2 creados…" → "2/2 creados"
   │
   ▼ todos OK
7. Modal cierra automáticamente (sin toast — la presencia de los bloques
   en el sidebar es feedback suficiente)
   │
   ▼ Wizard refresca sidebar
8. Bloques importados visibles al final
   El primer importado ("Introducción") queda seleccionado en el sidebar
   y abierto en el panel principal — feedback de éxito implícito.
```

### Manejo de errores en el step 6

- Si el primer `createBlock` falla → modal vuelve a estado `ready` con error visible: "No se pudo crear 'Introducción'. Inténtalo de nuevo." (no se llaman los siguientes).
- Si falla a mitad (p.ej. 3 de 5) → modal queda en estado `partial-error` mostrando "3/5 bloques creados, 2 fallaron". Opciones:
  - "Reintentar fallidos" → re-postea solo los pendientes
  - "Cerrar" → cierra modal; los 3 creados quedan, el usuario re-importa el resto manualmente.
