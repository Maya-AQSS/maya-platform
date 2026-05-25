import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  Badge,
  DataTable,
  EmptyState,
  Spinner,
  type ColumnDef,
} from '@maya/shared-ui-react'
import type {
  AcademicBlockKey,
  AcademicContext,
  AcademicItem,
  AcademicStudy,
  AcademicTeam,
} from '../academicContextTypes'

const STORAGE_KEY = 'maya:academic-context:open'

type OpenState = Record<AcademicBlockKey, boolean>

const DEFAULT_OPEN: OpenState = {
  study_types: false,
  studies: false,
  modules: false,
  teams: false,
}

export interface UserAcademicContextTexts {
  loading: string
  loadErrorPrefix: string
  sectionAriaLabel: string
  blockLabels: Record<AcademicBlockKey, string>
  unavailableBadge: string
  blockUnavailable: string
  emptyState: string
  headers: {
    code: string
    name: string
    id: string
    type: string
    department: string
  }
}

function getDefaultTexts(t: (key: string, options?: Record<string, unknown>) => string): UserAcademicContextTexts {
  return {
    loading: t('profile.academicContext.loading', { defaultValue: 'Loading academic context…' }),
    loadErrorPrefix: t('profile.academicContext.loadErrorPrefix', { defaultValue: 'Could not load academic context:' }),
    sectionAriaLabel: t('profile.academicContext.sectionAriaLabel', { defaultValue: 'Academic context' }),
    blockLabels: {
      study_types: t('profile.academicContext.blocks.studyTypes', { defaultValue: 'Study types' }),
      studies: t('profile.academicContext.blocks.studies', { defaultValue: 'Studies' }),
      modules: t('profile.academicContext.blocks.modules', { defaultValue: 'Modules' }),
      teams: t('profile.academicContext.blocks.teams', { defaultValue: 'Teams / Departments' }),
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
      type: t('profile.academicContext.headers.type', { defaultValue: 'Type' }),
      department: t('profile.academicContext.headers.department', { defaultValue: 'Department' }),
    },
  }
}

export interface UserAcademicContextProps {
  /** Datos cargados del endpoint. `undefined` mientras carga. */
  data: AcademicContext | undefined
  /** True mientras se resuelve la primera llamada. */
  isLoading: boolean
  /** Si la llamada falló (no la FDW individual: el endpoint entero). */
  error?: Error | null
  /** Bloques que deben renderizarse abiertos por defecto la primera vez. */
  defaultOpenBlocks?: AcademicBlockKey[]
  /** Clave alternativa para localStorage si conviven varios consumidores en la misma página. */
  storageKey?: string
  /** Textos traducidos para evitar cadenas hardcodeadas en el componente. */
  texts?: UserAcademicContextTexts
}

/**
 * Vista read-only del contexto académico (study_types, studies, modules, teams)
 * con id+code+name por entidad. Cuatro colapsables verticales, cada uno con
 * un DataTable compartido.
 *
 * El componente es agnóstico del data-fetching: la app pasa `data`/`isLoading`/`error`
 * resueltos por su propio hook (SWR, React Query, etc.). Patrón paralelo al resto
 * de componentes del paquete shared.
 */
export function UserAcademicContext({
  data,
  isLoading,
  error,
  defaultOpenBlocks,
  storageKey = STORAGE_KEY,
  texts,
}: UserAcademicContextProps) {
  const { t } = useTranslation('common')
  const resolvedTexts = useMemo(() => texts ?? getDefaultTexts(t), [texts, t])
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

  const toggle = (key: AcademicBlockKey) =>
    setOpenState((prev) => ({ ...prev, [key]: !prev[key] }))

  return (
    <section className="my-6 flex flex-col gap-3" aria-label={resolvedTexts.sectionAriaLabel}>
      <AcademicBlock
        keyId="study_types"
        open={openState.study_types}
        onToggle={toggle}
        status={data._status.study_types}
        count={data.study_types.length}
        texts={resolvedTexts}
      >
        <SimpleItemsTable rows={data.study_types} texts={resolvedTexts} />
      </AcademicBlock>

      <AcademicBlock
        keyId="studies"
        open={openState.studies}
        onToggle={toggle}
        status={data._status.studies}
        count={data.studies.length}
        texts={resolvedTexts}
      >
        <StudiesTable rows={data.studies} studyTypes={data.study_types} texts={resolvedTexts} />
      </AcademicBlock>

      <AcademicBlock
        keyId="modules"
        open={openState.modules}
        onToggle={toggle}
        status={data._status.modules}
        count={data.modules.length}
        texts={resolvedTexts}
      >
        <SimpleItemsTable rows={data.modules} texts={resolvedTexts} />
      </AcademicBlock>

      <AcademicBlock
        keyId="teams"
        open={openState.teams}
        onToggle={toggle}
        status={data._status.teams}
        count={data.teams.length}
        texts={resolvedTexts}
      >
        <TeamsTable rows={data.teams} texts={resolvedTexts} />
      </AcademicBlock>
    </section>
  )
}

// ── Sub-componentes ────────────────────────────────────────────────────────

interface AcademicBlockProps {
  keyId: AcademicBlockKey
  open: boolean
  onToggle: (key: AcademicBlockKey) => void
  status: 'ok' | 'unavailable'
  count: number
  children: ReactNode
  texts: UserAcademicContextTexts
}

function AcademicBlock({ keyId, open, onToggle, status, count, children, texts }: AcademicBlockProps) {
  const label = texts.blockLabels[keyId]

  return (
    <div className="bg-ui-card dark:bg-ui-dark-card border border-ui-border dark:border-ui-dark-border rounded-lg shadow-card overflow-hidden">
      <button
        type="button"
        onClick={() => onToggle(keyId)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-ui-hover dark:hover:bg-ui-dark-hover transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-text-primary dark:text-text-dark-primary font-semibold">
            {label}
          </span>
          {status === 'ok'
            ? <Badge label={String(count)} variant="default" size="sm" />
            : <Badge label={texts.unavailableBadge} variant="warning" size="sm" />}
        </div>
        <span
          aria-hidden="true"
          className={`text-text-muted dark:text-text-dark-muted transition-transform ${open ? 'rotate-180' : ''}`}
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="border-t border-ui-border dark:border-ui-dark-border px-4 py-3">
          {status === 'unavailable' ? (
            <Alert tone="warning">
              {texts.blockUnavailable}
            </Alert>
          ) : count === 0 ? (
            <EmptyState title={texts.emptyState} />
          ) : (
            children
          )}
        </div>
      )}
    </div>
  )
}

// ── Tablas ─────────────────────────────────────────────────────────────────

const idCellClass = 'font-mono text-text-muted dark:text-text-dark-muted text-xs'
const codeCellClass = 'font-mono text-odoo-purple dark:text-odoo-dark-purple text-sm'

function SimpleItemsTable({ rows, texts }: { rows: AcademicItem[]; texts: UserAcademicContextTexts }) {
  const columns: ColumnDef<AcademicItem>[] = useMemo(() => [
    {
      id: 'code',
      header: texts.headers.code,
      cell: (row) => <code className={codeCellClass}>{row.code || '—'}</code>,
    },
    {
      id: 'name',
      header: texts.headers.name,
      cell: (row) => row.name,
    },
    {
      id: 'id',
      header: texts.headers.id,
      cell: (row) => <code className={idCellClass}>{row.id}</code>,
    },
  ], [texts.headers.code, texts.headers.id, texts.headers.name])

  return <DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />
}

function StudiesTable({ rows, studyTypes, texts }: { rows: AcademicStudy[]; studyTypes: AcademicItem[]; texts: UserAcademicContextTexts }) {
  const typeLabels = useMemo(() => {
    const map = new Map<string, string>()
    for (const t of studyTypes) {
      map.set(t.id, t.name)
    }
    return map
  }, [studyTypes])

  const columns: ColumnDef<AcademicStudy>[] = useMemo(() => [
    {
      id: 'code',
      header: texts.headers.code,
      cell: (row) => <code className={codeCellClass}>{row.code || '—'}</code>,
    },
    {
      id: 'name',
      header: texts.headers.name,
      cell: (row) => row.name,
    },
    {
      id: 'study_type',
      header: texts.headers.type,
      cell: (row) => typeLabels.get(row.study_type_id) ?? row.study_type_id ?? '—',
    },
    {
      id: 'id',
      header: texts.headers.id,
      cell: (row) => <code className={idCellClass}>{row.id}</code>,
    },
  ], [texts.headers.code, texts.headers.id, texts.headers.name, texts.headers.type, typeLabels])

  return <DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />
}

function TeamsTable({ rows, texts }: { rows: AcademicTeam[]; texts: UserAcademicContextTexts }) {
  const columns: ColumnDef<AcademicTeam>[] = useMemo(() => [
    {
      id: 'code',
      header: texts.headers.code,
      cell: (row) => <code className={codeCellClass}>{row.code || '—'}</code>,
    },
    {
      id: 'name',
      header: texts.headers.name,
      cell: (row) => (
        <span className="flex items-center gap-2">
          {row.name}
          {row.is_department && <Badge label={texts.headers.department} variant="info" size="sm" />}
        </span>
      ),
    },
    {
      id: 'id',
      header: texts.headers.id,
      cell: (row) => <code className={idCellClass}>{row.id}</code>,
    },
  ], [texts.headers.code, texts.headers.department, texts.headers.id, texts.headers.name])

  return <DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />
}

// ── localStorage helpers ──────────────────────────────────────────────────

function loadOpenState(storageKey: string, defaults?: AcademicBlockKey[]): OpenState {
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<OpenState>
      return { ...DEFAULT_OPEN, ...parsed }
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
