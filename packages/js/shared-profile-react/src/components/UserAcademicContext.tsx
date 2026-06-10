import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Badge, EmptyState, Spinner } from '@ceedcv-maya/shared-ui-react'
import type {
  AcademicContext,
  AcademicItem,
  AcademicModule,
  AcademicStudy,
  AcademicTeam,
} from '../academicContextTypes'

const STORAGE_KEY = 'maya:academic-context:open'

/** Las dos vistas de primer nivel del componente. */
type TopBlockKey = 'academic' | 'teams'

type OpenState = Record<TopBlockKey, boolean>

const DEFAULT_OPEN: OpenState = {
  academic: false,
  teams: false,
}

export interface UserAcademicContextTexts {
  loading: string
  loadErrorPrefix: string
  sectionAriaLabel: string
  blockLabels: {
    /** Vista 1 (árbol académico). */
    academic: string
    /** Vista 2 (equipos + departamentos). */
    teams: string
    /** Niveles del árbol / sub-grupos — también usados en el resumen de conteos. */
    studyTypes: string
    studies: string
    modules: string
    departments: string
    workTeams: string
    /** Nodo sintético para huérfanos (estudio sin tipo, módulo sin estudio). */
    unclassified: string
  }
  unavailableBadge: string
  blockUnavailable: string
  emptyState: string
  headers: {
    code: string
    name: string
    id: string
  }
}

/** `texts` puede llegar parcial (consumidores legacy); se fusiona sobre los defaults. */
type DeepPartialTexts = {
  [K in keyof UserAcademicContextTexts]?: UserAcademicContextTexts[K] extends object
    ? Partial<UserAcademicContextTexts[K]>
    : UserAcademicContextTexts[K]
}

function getDefaultTexts(
  t: (key: string, options?: Record<string, unknown>) => string,
): UserAcademicContextTexts {
  return {
    loading: t('profile.academicContext.loading', { defaultValue: 'Loading academic context…' }),
    loadErrorPrefix: t('profile.academicContext.loadErrorPrefix', { defaultValue: 'Could not load academic context:' }),
    sectionAriaLabel: t('profile.academicContext.sectionAriaLabel', { defaultValue: 'Academic context' }),
    blockLabels: {
      academic: t('profile.academicContext.blocks.academic', { defaultValue: 'Academic context' }),
      teams: t('profile.academicContext.blocks.teams', { defaultValue: 'Teams / Departments' }),
      studyTypes: t('profile.academicContext.blocks.studyTypes', { defaultValue: 'Study types' }),
      studies: t('profile.academicContext.blocks.studies', { defaultValue: 'Studies' }),
      modules: t('profile.academicContext.blocks.modules', { defaultValue: 'Modules' }),
      departments: t('profile.academicContext.blocks.departments', { defaultValue: 'Departments' }),
      workTeams: t('profile.academicContext.blocks.workTeams', { defaultValue: 'Teams' }),
      unclassified: t('profile.academicContext.blocks.unclassified', { defaultValue: 'Unclassified' }),
    },
    unavailableBadge: t('profile.academicContext.unavailableBadge', { defaultValue: 'Unavailable' }),
    blockUnavailable: t('profile.academicContext.blockUnavailable', {
      defaultValue: 'Academic data is temporarily unavailable for this block.',
    }),
    emptyState: t('profile.academicContext.emptyState', { defaultValue: 'No assignments' }),
    headers: {
      code: t('profile.academicContext.headers.code', { defaultValue: 'Code' }),
      name: t('profile.academicContext.headers.name', { defaultValue: 'Name' }),
      id: t('profile.academicContext.headers.id', { defaultValue: 'ID' }),
    },
  }
}

function mergeTexts(base: UserAcademicContextTexts, override?: DeepPartialTexts): UserAcademicContextTexts {
  if (!override) return base
  return {
    ...base,
    ...override,
    blockLabels: { ...base.blockLabels, ...(override.blockLabels ?? {}) },
    headers: { ...base.headers, ...(override.headers ?? {}) },
  }
}

export interface UserAcademicContextProps {
  /** Datos cargados del endpoint. `undefined` mientras carga. */
  data: AcademicContext | undefined
  /** True mientras se resuelve la primera llamada. */
  isLoading: boolean
  /** Si la llamada falló (no la FDW individual: el endpoint entero). */
  error?: Error | null
  /** Vistas de primer nivel que deben renderizarse abiertas por defecto la primera vez. */
  defaultOpenBlocks?: TopBlockKey[]
  /** Clave alternativa para localStorage si conviven varios consumidores en la misma página. */
  storageKey?: string
  /** Textos traducidos (parciales permitidos; se fusionan sobre los defaults de i18n). */
  texts?: DeepPartialTexts
  /**
   * Si los identificadores internos (UUID/md5) deben mostrarse. Solo admins.
   * Por defecto `false` — un usuario normal viendo su perfil no ve ids.
   */
  showIds?: boolean
}

/**
 * Vista read-only del contexto académico del usuario en DOS bloques colapsables:
 *
 *  1. **Contexto académico** — árbol jerárquico `tipo de estudio → estudio → módulo`.
 *  2. **Equipos / Departamentos** — dos sub-grupos separados por `is_department`.
 *
 * Los `id` internos solo se muestran si `showIds` (admins). El componente es
 * agnóstico del data-fetching: la app pasa `data`/`isLoading`/`error` resueltos
 * por su propio hook.
 */
export function UserAcademicContext({
  data,
  isLoading,
  error,
  defaultOpenBlocks,
  storageKey = STORAGE_KEY,
  texts,
  showIds = false,
}: UserAcademicContextProps) {
  const { t } = useTranslation('common')
  const resolvedTexts = useMemo(() => mergeTexts(getDefaultTexts(t), texts), [texts, t])
  const [openState, setOpenState] = useState<OpenState>(() => loadOpenState(storageKey, defaultOpenBlocks))

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(openState))
    } catch {
      /* localStorage puede estar deshabilitado — no es crítico */
    }
  }, [openState, storageKey])

  if (isLoading && !data) {
    return (
      <div className="my-6 py-4">
        <Spinner tone="muted" label={resolvedTexts.loading} />
      </div>
    )
  }

  if (error) {
    return (
      <Alert tone="danger" className="my-6">
        {resolvedTexts.loadErrorPrefix} {error.message}
      </Alert>
    )
  }

  if (!data) return null

  const toggle = (key: TopBlockKey) =>
    setOpenState((prev) => ({ ...prev, [key]: !prev[key] }))

  // El bloque académico agrega 3 sub-estados FDW; basta uno caído para advertir.
  const academicUnavailable =
    data._status.study_types === 'unavailable' ||
    data._status.studies === 'unavailable' ||
    data._status.modules === 'unavailable'

  const academicCount = data.study_types.length + data.studies.length + data.modules.length
  const teamsCount = data.teams.length

  return (
    <section className="my-6 flex flex-col gap-3" aria-label={resolvedTexts.sectionAriaLabel}>
      <Disclosure
        title={resolvedTexts.blockLabels.academic}
        open={openState.academic}
        onToggle={() => toggle('academic')}
        badge={
          academicUnavailable ? (
            <Badge label={resolvedTexts.unavailableBadge} variant="warning" size="sm" />
          ) : (
            <span className="text-text-muted dark:text-text-dark-muted text-xs">
              {resolvedTexts.blockLabels.studyTypes}: {data.study_types.length} ·{' '}
              {resolvedTexts.blockLabels.studies}: {data.studies.length} ·{' '}
              {resolvedTexts.blockLabels.modules}: {data.modules.length}
            </span>
          )
        }
      >
        {academicUnavailable ? (
          <Alert tone="warning">{resolvedTexts.blockUnavailable}</Alert>
        ) : academicCount === 0 ? (
          <EmptyState title={resolvedTexts.emptyState} />
        ) : (
          <AcademicTree
            studyTypes={data.study_types}
            studies={data.studies}
            modules={data.modules}
            showIds={showIds}
            texts={resolvedTexts}
          />
        )}
      </Disclosure>

      <Disclosure
        title={resolvedTexts.blockLabels.teams}
        open={openState.teams}
        onToggle={() => toggle('teams')}
        badge={
          data._status.teams === 'unavailable' ? (
            <Badge label={resolvedTexts.unavailableBadge} variant="warning" size="sm" />
          ) : (
            <Badge label={String(teamsCount)} variant="default" size="sm" />
          )
        }
      >
        {data._status.teams === 'unavailable' ? (
          <Alert tone="warning">{resolvedTexts.blockUnavailable}</Alert>
        ) : teamsCount === 0 ? (
          <EmptyState title={resolvedTexts.emptyState} />
        ) : (
          <TeamGroups teams={data.teams} showIds={showIds} texts={resolvedTexts} />
        )}
      </Disclosure>
    </section>
  )
}

// ── Disclosure de primer nivel (tarjeta colapsable) ─────────────────────────

interface DisclosureProps {
  title: string
  open: boolean
  onToggle: () => void
  badge: ReactNode
  children: ReactNode
}

function Disclosure({ title, open, onToggle, badge, children }: DisclosureProps) {
  return (
    <div className="bg-ui-card dark:bg-ui-dark-card border border-ui-border dark:border-ui-dark-border rounded-lg shadow-card overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-ui-hover dark:hover:bg-ui-dark-hover transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-text-primary dark:text-text-dark-primary font-semibold">{title}</span>
          {badge}
        </div>
        <span
          aria-hidden="true"
          className={`text-text-muted dark:text-text-dark-muted text-xs transition-transform ${open ? 'rotate-90' : ''}`}
        >
          ▶
        </span>
      </button>

      {open && (
        <div className="border-t border-ui-border dark:border-ui-dark-border px-3 py-3">{children}</div>
      )}
    </div>
  )
}

// ── Vista 1: árbol académico (tipo de estudio → estudio → módulo) ────────────

const codeCellClass = 'font-mono text-odoo-purple dark:text-odoo-dark-purple text-xs shrink-0'
const idCellClass = 'font-mono text-text-muted dark:text-text-dark-muted text-[11px] shrink-0'

function NodeLabel({ code, name, id, showIds }: { code?: string; name: string; id: string; showIds: boolean }) {
  return (
    <span className="flex items-baseline gap-2 min-w-0">
      {code ? <code className={codeCellClass}>{code}</code> : null}
      <span className="truncate text-text-primary dark:text-text-dark-primary">{name || '—'}</span>
      {showIds ? <code className={idCellClass}>{id}</code> : null}
    </span>
  )
}

interface TreeNodeProps {
  level: number
  name: string
  code?: string
  id: string
  showIds: boolean
  /** Conteo de hijos (badge). Si `undefined`, es una hoja (sin disclosure). */
  childCount?: number
  expanded?: boolean
  onToggle?: () => void
  children?: ReactNode
}

function TreeNode({ level, name, code, id, showIds, childCount, expanded, onToggle, children }: TreeNodeProps) {
  const padLeft = 8 + level * 18
  const isLeaf = childCount === undefined || onToggle === undefined

  const labelRow = (
    <NodeLabel code={code} name={name} id={id} showIds={showIds} />
  )

  return (
    <li role="treeitem" aria-expanded={isLeaf ? undefined : expanded}>
      {isLeaf ? (
        <div
          className="flex items-center gap-2 py-1.5 pr-2 rounded-md"
          style={{ paddingLeft: padLeft }}
        >
          <span aria-hidden="true" className="text-text-muted/40 dark:text-text-dark-muted/40 select-none">
            •
          </span>
          {labelRow}
        </div>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="w-full flex items-center gap-2 py-1.5 pr-2 rounded-md text-left hover:bg-ui-hover dark:hover:bg-ui-dark-hover transition-colors"
          style={{ paddingLeft: padLeft }}
        >
          <span
            aria-hidden="true"
            className={`text-text-muted dark:text-text-dark-muted text-xs transition-transform w-3 shrink-0 ${expanded ? 'rotate-90' : ''}`}
          >
            ▶
          </span>
          {labelRow}
          <Badge label={String(childCount)} variant="default" size="sm" />
        </button>
      )}
      {!isLeaf && expanded ? (
        <ul role="group" className="list-none m-0 p-0">
          {children}
        </ul>
      ) : null}
    </li>
  )
}

function AcademicTree({
  studyTypes,
  studies,
  modules,
  showIds,
  texts,
}: {
  studyTypes: AcademicItem[]
  studies: AcademicStudy[]
  modules: AcademicModule[]
  showIds: boolean
  texts: UserAcademicContextTexts
}) {
  const studiesByType = useMemo(() => groupBy(studies, (s) => s.study_type_id), [studies])
  const modulesByStudy = useMemo(() => groupBy(modules, (m) => m.study_id), [modules])

  // Huérfanos: estudios cuyo study_type_id no está entre los tipos recibidos,
  // y módulos cuyo study_id no está entre los estudios recibidos. Se cuelgan de
  // un nodo sintético «Sin clasificar» para no perderlos.
  const typeIds = useMemo(() => new Set(studyTypes.map((s) => s.id)), [studyTypes])
  const studyIds = useMemo(() => new Set(studies.map((s) => s.id)), [studies])
  const orphanStudies = useMemo(() => studies.filter((s) => !typeIds.has(s.study_type_id)), [studies, typeIds])
  const orphanModules = useMemo(() => modules.filter((m) => !studyIds.has(m.study_id)), [modules, studyIds])

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const renderStudy = (study: AcademicStudy) => {
    const studyModules = modulesByStudy.get(study.id) ?? []
    const hasModules = studyModules.length > 0
    return (
      <TreeNode
        key={study.id}
        level={1}
        name={study.name}
        code={study.code}
        id={study.id}
        showIds={showIds}
        childCount={hasModules ? studyModules.length : undefined}
        expanded={expanded.has(study.id)}
        onToggle={hasModules ? () => toggle(study.id) : undefined}
      >
        {studyModules.map((mod) => (
          <TreeNode key={mod.id} level={2} name={mod.name} code={mod.code} id={mod.id} showIds={showIds} />
        ))}
      </TreeNode>
    )
  }

  return (
    <ul role="tree" className="list-none m-0 p-0">
      {studyTypes.map((type) => {
        const typeStudies = studiesByType.get(type.id) ?? []
        return (
          <TreeNode
            key={type.id}
            level={0}
            name={type.name}
            code={type.code}
            id={type.id}
            showIds={showIds}
            childCount={typeStudies.length}
            expanded={expanded.has(type.id)}
            onToggle={() => toggle(type.id)}
          >
            {typeStudies.map(renderStudy)}
          </TreeNode>
        )
      })}

      {(orphanStudies.length > 0 || orphanModules.length > 0) && (
        <TreeNode
          key="__unclassified__"
          level={0}
          name={texts.blockLabels.unclassified}
          id="__unclassified__"
          showIds={false}
          childCount={orphanStudies.length + orphanModules.length}
          expanded={expanded.has('__unclassified__')}
          onToggle={() => toggle('__unclassified__')}
        >
          {orphanStudies.map(renderStudy)}
          {orphanModules.map((mod) => (
            <TreeNode key={mod.id} level={1} name={mod.name} code={mod.code} id={mod.id} showIds={showIds} />
          ))}
        </TreeNode>
      )}
    </ul>
  )
}

// ── Vista 2: equipos y departamentos ────────────────────────────────────────

function TeamGroups({
  teams,
  showIds,
  texts,
}: {
  teams: AcademicTeam[]
  showIds: boolean
  texts: UserAcademicContextTexts
}) {
  const departments = useMemo(() => teams.filter((t) => t.is_department), [teams])
  const workTeams = useMemo(() => teams.filter((t) => !t.is_department), [teams])
  const [open, setOpen] = useState<{ departments: boolean; workTeams: boolean }>({
    departments: false,
    workTeams: false,
  })

  return (
    <ul role="tree" className="list-none m-0 p-0">
      <TeamGroup
        label={texts.blockLabels.departments}
        rows={departments}
        showIds={showIds}
        emptyState={texts.emptyState}
        expanded={open.departments}
        onToggle={() => setOpen((p) => ({ ...p, departments: !p.departments }))}
      />
      <TeamGroup
        label={texts.blockLabels.workTeams}
        rows={workTeams}
        showIds={showIds}
        emptyState={texts.emptyState}
        expanded={open.workTeams}
        onToggle={() => setOpen((p) => ({ ...p, workTeams: !p.workTeams }))}
      />
    </ul>
  )
}

function TeamGroup({
  label,
  rows,
  showIds,
  emptyState,
  expanded,
  onToggle,
}: {
  label: string
  rows: AcademicTeam[]
  showIds: boolean
  emptyState: string
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <TreeNode
      level={0}
      name={label}
      id={`__group_${label}__`}
      showIds={false}
      childCount={rows.length}
      expanded={expanded}
      onToggle={onToggle}
    >
      {rows.length === 0 ? (
        <li role="treeitem">
          <div className="py-1.5" style={{ paddingLeft: 26 }}>
            <span className="text-text-muted dark:text-text-dark-muted text-sm">{emptyState}</span>
          </div>
        </li>
      ) : (
        rows.map((team) => (
          <TreeNode key={team.id} level={1} name={team.name} code={team.code} id={team.id} showIds={showIds} />
        ))
      )}
    </TreeNode>
  )
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function groupBy<T>(rows: T[], keyOf: (row: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const row of rows) {
    const key = keyOf(row)
    const bucket = map.get(key)
    if (bucket) bucket.push(row)
    else map.set(key, [row])
  }
  return map
}

function loadOpenState(storageKey: string, defaults?: TopBlockKey[]): OpenState {
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<OpenState>
      return {
        academic: typeof parsed.academic === 'boolean' ? parsed.academic : DEFAULT_OPEN.academic,
        teams: typeof parsed.teams === 'boolean' ? parsed.teams : DEFAULT_OPEN.teams,
      }
    }
  } catch {
    /* corrupto o no accesible → caer a defaults */
  }

  if (!defaults || defaults.length === 0) {
    return DEFAULT_OPEN
  }

  const state = { ...DEFAULT_OPEN }
  for (const key of defaults) {
    state[key] = true
  }
  return state
}
