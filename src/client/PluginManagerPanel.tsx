import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import type { PluginInventorySnapshot } from '@deepseek-ai/dsh-api-remotes/client'
import {
  IconChevronDownOutline14,
  IconPersonalizationOutline16,
  IconSearchOutline16,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import { isProtectedModule } from '../protection.ts'
import css from './PluginManagerPanel.module.css'

/** Client callbacks injected through sidebar.footer.action. */
export interface PluginManagerPanelInjected {
  /** Read the built-in Loader inventory. */
  list: () => Promise<PluginInventorySnapshot>
  /** Change one entry's live enablement. */
  setEnabled: (
    entryId: PluginInventorySnapshot['entries'][number]['entryId'],
    enabled: boolean,
  ) => Promise<{ ok: boolean; message?: string }>
}

type PluginEntry = PluginInventorySnapshot['entries'][number]
type PluginCategory = 'builtin' | 'user'

type ViewState =
  | { readonly status: 'loading' }
  | { readonly status: 'error' }
  | { readonly status: 'ready'; readonly snapshot: PluginInventorySnapshot }

/** Props composed by the sidebar footer-action slot. */
export type PluginManagerPanelProps =
  PropsRuntime<'sidebar.footer.action'>
  & PropsLocale<'pluginManager'>
  & InjectFace<PluginManagerPanelInjected>

/** Short display name for a Loader module specifier. */
function moduleShortName(moduleName: string): string {
  const unscoped = moduleName.startsWith('@') ? moduleName.slice(moduleName.indexOf('/') + 1) : moduleName
  return unscoped
    .replace(/^cordis:/, '')
    .replace(/^cordis-plugin-/, '')
    .replace(/^dsh-(?:host-|client-)?/, '')
}

/** Categorize entirely from the stable module specifier supplied by pluginInventory.list(). */
function categoryOf(moduleName: string): PluginCategory {
  return moduleName.startsWith('@deepseek-ai/') || moduleName.startsWith('cordis:') ? 'builtin' : 'user'
}

/** Search module specifier, short name, and Loader tree id. */
function matches(entry: PluginEntry, normalizedQuery: string): boolean {
  if (normalizedQuery.length === 0) return true
  return [entry.moduleName, moduleShortName(entry.moduleName), entry.entryId]
    .some(value => value.toLocaleLowerCase().includes(normalizedQuery))
}

function Toggle({ checked, busy, locked, label, onToggle }: {
  checked: boolean
  busy: boolean
  locked: boolean
  label: string
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={locked ? label : undefined}
      className={css.switch}
      data-on={checked ? 'true' : undefined}
      data-locked={locked ? 'true' : undefined}
      disabled={busy || locked}
      onClick={onToggle}
    >
      <span className={css.switchThumb} />
    </button>
  )
}

function CategorySection({
  title, count, expanded, onToggle, emptyText, children,
}: {
  title: string
  count: number
  expanded: boolean
  onToggle: () => void
  emptyText: string
  children: ReactNode
}) {
  return (
    <section className={css.category} data-expanded={expanded ? 'true' : undefined}>
      <button type="button" className={css.categoryHeader} aria-expanded={expanded} onClick={onToggle}>
        <IconChevronDownOutline14 className={css.categoryChevron} size={12} aria-hidden="true" />
        <span className={css.categoryTitle}>{title}</span>
        <span className={css.categoryCount}>{count}</span>
      </button>
      {expanded ? (
        count > 0 ? <ul className={css.rows}>{children}</ul> : <p className={css.note}>{emptyText}</p>
      ) : null}
    </section>
  )
}

/** Sidebar button plus its fixed, searchable, collapsible plugin catalog. */
export function PluginManagerPanel({ wide, list, setEnabled, t }: PluginManagerPanelProps): ReactNode {
  const panelId = useId()
  const layerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [request, setRequest] = useState(0)
  const [state, setState] = useState<ViewState>({ status: 'loading' })
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set())
  const [errors, setErrors] = useState<ReadonlyMap<string, string>>(new Map())
  const [expanded, setExpanded] = useState<Record<PluginCategory, boolean>>({ builtin: true, user: true })

  useEffect(() => {
    let current = true
    void Promise.resolve().then(() => list()).then(
      (snapshot) => { if (current) setState({ status: 'ready', snapshot }) },
      () => { if (current) setState({ status: 'error' }) },
    )
    return () => { current = false }
  }, [list, request])

  useEffect(() => {
    if (!open) return
    searchRef.current?.focus()
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false)
    }
    const closeOnOutsidePointer = (event: PointerEvent): void => {
      if (event.target instanceof Node && layerRef.current?.contains(event.target) !== true) setOpen(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    document.addEventListener('pointerdown', closeOnOutsidePointer)
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
    }
  }, [open])

  const normalizedQuery = query.trim().toLocaleLowerCase()
  const entries = useMemo(() => state.status === 'ready' ? state.snapshot.entries : [], [state])
  const filtered = useMemo(() => entries.filter(entry => matches(entry, normalizedQuery)), [entries, normalizedQuery])
  const builtins = filtered.filter(entry => categoryOf(entry.moduleName) === 'builtin')
  const users = filtered.filter(entry => categoryOf(entry.moduleName) === 'user')

  const toggle = async (entry: PluginEntry): Promise<void> => {
    if (pending.has(entry.entryId)) return
    setPending(current => new Set(current).add(entry.entryId))
    setErrors((current) => {
      const next = new Map(current)
      next.delete(entry.entryId)
      return next
    })
    try {
      const result = await setEnabled(entry.entryId, !entry.enabled)
      if (!result.ok) setErrors(current => new Map(current).set(entry.entryId, result.message ?? t('operationError')))
    } catch (error) {
      setErrors(current => new Map(current).set(entry.entryId, error instanceof Error ? error.message : String(error)))
    } finally {
      setPending((current) => {
        const next = new Set(current)
        next.delete(entry.entryId)
        return next
      })
      setRequest(value => value + 1)
    }
  }

  const renderEntry = (entry: PluginEntry): ReactNode => {
    const failure = errors.get(entry.entryId)
    const locked = isProtectedModule(entry.moduleName)
    return (
      <li className={css.row} key={entry.entryId} data-plugin-entry={entry.entryId}>
        <div className={css.rowHead}>
          <span className={css.rowName} title={entry.moduleName}>{moduleShortName(entry.moduleName)}</span>
          <span className={css.rowState} data-enabled={entry.enabled ? 'true' : 'false'}>
            {t(entry.enabled ? 'enabledTag' : 'disabledTag')}
          </span>
          <Toggle
            checked={entry.enabled}
            busy={pending.has(entry.entryId)}
            locked={locked}
            label={t(locked ? 'protected' : entry.enabled ? 'disable' : 'enable')}
            onToggle={() => { void toggle(entry) }}
          />
        </div>
        {failure !== undefined ? <p className={css.rowError} role="alert">{failure}</p> : null}
      </li>
    )
  }

  const total = state.status === 'ready' ? state.snapshot.entries.length : 0
  const flipCategory = (category: PluginCategory): void => {
    setExpanded(current => ({ ...current, [category]: !current[category] }))
  }

  return (
    <div ref={layerRef} className={wide ? css.layer : css.layer + ' ' + css.rail}>
      {open ? (
        <section id={panelId} role="dialog" className={css.panel} data-plugin-manager aria-label={t('panel.title')}>
          <header className={css.header}>
            <span className={css.title}>{t('panel.title')}</span>
            <span className={css.count}>{t('panel.count', { count: total })}</span>
          </header>
          <label className={css.search}>
            <IconSearchOutline16 aria-hidden="true" />
            <span className={css.visuallyHidden}>{t('search')}</span>
            <input
              ref={searchRef}
              type="search"
              value={query}
              placeholder={t('search')}
              aria-label={t('search')}
              onInput={(event) => { setQuery(event.currentTarget.value) }}
            />
          </label>
          <div className={css.body}>
            {state.status === 'loading' ? <p className={css.note}>{t('loading')}</p> : null}
            {state.status === 'error' ? (
              <div className={css.failure}>
                <p role="alert">{t('error')}</p>
                <button type="button" onClick={() => { setState({ status: 'loading' }); setRequest(value => value + 1) }}>
                  {t('retry')}
                </button>
              </div>
            ) : null}
            {state.status === 'ready' && entries.length === 0 ? <p className={css.note}>{t('empty')}</p> : null}
            {state.status === 'ready' && entries.length > 0 && filtered.length === 0 ? <p className={css.note}>{t('emptySearch')}</p> : null}
            {state.status === 'ready' && entries.length > 0 && filtered.length > 0 ? (
              <>
                <CategorySection
                  title={t('panel.builtin')}
                  count={builtins.length}
                  expanded={expanded.builtin}
                  onToggle={() => { flipCategory('builtin') }}
                  emptyText={t('emptyCategory')}
                >
                  {builtins.map(renderEntry)}
                </CategorySection>
                <CategorySection
                  title={t('panel.user')}
                  count={users.length}
                  expanded={expanded.user}
                  onToggle={() => { flipCategory('user') }}
                  emptyText={t('emptyCategory')}
                >
                  {users.map(renderEntry)}
                </CategorySection>
              </>
            ) : null}
          </div>
        </section>
      ) : null}
      <div className={css.footerButtons}>
        <button
          type="button"
          className={css.badge}
          data-active={open || undefined}
          aria-label={t('panel.aria')}
          aria-expanded={open}
          aria-controls={panelId}
          aria-haspopup="dialog"
          onClick={() => { setOpen(value => !value) }}
        >
          <IconPersonalizationOutline16 size={16} aria-hidden="true" />
          {wide ? (
            <>
              <span className={css.badgeLabel}>{t('panel.trigger')}</span>
              <span className={css.badgeCount}>{total}</span>
            </>
          ) : null}
        </button>
      </div>
    </div>
  )
}
