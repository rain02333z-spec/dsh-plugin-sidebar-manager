// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { PluginInventorySnapshot } from '@deepseek-ai/dsh-api-remotes/client'
import type { PluginManagerPanelProps } from '../src/client/PluginManagerPanel.tsx'
import { PluginManagerPanel } from '../src/client/PluginManagerPanel.tsx'
import { en, zh } from '../src/client/locales.ts'

afterEach(cleanup)

const SNAPSHOT = {
  entries: [
    {
      entryId: 'system-sidebar',
      moduleName: '@deepseek-ai/dsh-client-ui-sidebar',
      enabled: true,
      fiberPhase: 'active',
    },
    {
      entryId: 'system-search',
      moduleName: '@deepseek-ai/dsh-web-search-deepseek',
      enabled: true,
      fiberPhase: 'active',
    },
    {
      entryId: 'user-weather',
      moduleName: 'dsh-plugin-weather',
      enabled: true,
      fiberPhase: 'active',
    },
    {
      entryId: 'user-notes',
      moduleName: '@example/dsh-plugin-notes',
      enabled: false,
      fiberPhase: null,
    },
  ],
} as unknown as PluginInventorySnapshot

function translate(key: keyof typeof en, values?: Record<string, unknown>): string {
  let text = en[key]
  for (const [name, value] of Object.entries(values ?? {})) text = text.replace(`{${name}}`, String(value))
  return text
}

function mount({
  wide = true,
  list = vi.fn(async () => SNAPSHOT),
  setEnabled = vi.fn(async () => ({ ok: true })),
}: {
  wide?: boolean
  list?: PluginManagerPanelProps['list']
  setEnabled?: PluginManagerPanelProps['setEnabled']
} = {}) {
  const unusedHook = (() => { throw new Error('unused') }) as never
  const props: PluginManagerPanelProps = {
    wide,
    list,
    setEnabled,
    t: translate as PluginManagerPanelProps['t'],
    useSessions: unusedHook,
    useWorkspaces: unusedHook,
  }
  return { ...render(<PluginManagerPanel {...props} />), list, setEnabled }
}

async function openPanel(): Promise<void> {
  fireEvent.click(screen.getByRole('button', { name: 'Plugins' }))
  await screen.findByRole('dialog', { name: 'Plugins' })
}

describe('PluginManagerPanel', () => {
  it('ships complete Chinese and English dictionaries', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(zh).sort())
    expect(zh['panel.builtin']).toBe('系统插件')
    expect(zh['panel.user']).toBe('用户新增')
    expect(en['panel.builtin']).toBe('System plugins')
    expect(en['panel.user']).toBe('User-added plugins')
  })

  it('opens from the sidebar, groups system and user plugins, and shows the total', async () => {
    const { list } = mount()
    await openPanel()

    await screen.findByText('web-search-deepseek')
    expect(screen.getByText('plugin-weather')).toBeTruthy()
    expect(screen.getByText('plugin-notes')).toBeTruthy()
    expect(screen.getByText('System plugins').parentElement?.textContent).toContain('2')
    expect(screen.getByText('User-added plugins').parentElement?.textContent).toContain('2')
    expect(screen.getByText('4 plugins')).toBeTruthy()
    expect(list).toHaveBeenCalledOnce()
    expect(document.activeElement).toBe(screen.getByRole('searchbox'))
  })

  it('searches by short name and Loader entry id without case sensitivity', async () => {
    mount()
    await openPanel()
    await screen.findByText('plugin-weather')

    fireEvent.input(screen.getByRole('searchbox'), { target: { value: 'NOTES' } })
    expect(screen.getByText('plugin-notes')).toBeTruthy()
    expect(screen.queryByText('plugin-weather')).toBeNull()

    fireEvent.input(screen.getByRole('searchbox'), { target: { value: 'system-search' } })
    expect(screen.getByText('web-search-deepseek')).toBeTruthy()
    expect(screen.queryByText('plugin-notes')).toBeNull()

    fireEvent.input(screen.getByRole('searchbox'), { target: { value: 'missing' } })
    expect(screen.getByText('No matching plugins.')).toBeTruthy()
  })

  it('collapses and expands each category independently', async () => {
    mount()
    await openPanel()
    await screen.findByText('web-search-deepseek')

    fireEvent.click(screen.getByRole('button', { name: /System plugins/ }))
    expect(screen.queryByText('web-search-deepseek')).toBeNull()
    expect(screen.getByText('plugin-weather')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /System plugins/ }))
    expect(screen.getByText('web-search-deepseek')).toBeTruthy()
  })

  it('toggles an ordinary plugin and reloads the inventory', async () => {
    const setEnabled = vi.fn(async () => ({ ok: true }))
    const list = vi.fn(async () => SNAPSHOT)
    mount({ list, setEnabled })
    await openPanel()
    await screen.findByText('plugin-weather')

    const row = screen.getByText('plugin-weather').closest('li')!
    fireEvent.click(row.querySelector('[role="switch"]')!)

    await waitFor(() => { expect(setEnabled).toHaveBeenCalledWith('user-weather', false) })
    await waitFor(() => { expect(list).toHaveBeenCalledTimes(2) })
  })

  it('locks system plugins in the UI', async () => {
    const setEnabled = vi.fn(async () => ({ ok: true }))
    mount({ setEnabled })
    await openPanel()
    await screen.findByText('ui-sidebar')

    const row = screen.getByText('ui-sidebar').closest('li')!
    const toggle = row.querySelector('[role="switch"]') as HTMLButtonElement
    expect(toggle.disabled).toBe(true)
    expect(toggle.getAttribute('aria-label')).toBe('Protected plugin cannot be changed')
    fireEvent.click(toggle)
    expect(setEnabled).not.toHaveBeenCalled()
  })

  it('shows operation errors on the affected row', async () => {
    const setEnabled = vi.fn(async () => ({ ok: false, message: 'transition rejected' }))
    mount({ setEnabled })
    await openPanel()
    await screen.findByText('plugin-weather')

    const row = screen.getByText('plugin-weather').closest('li')!
    fireEvent.click(row.querySelector('[role="switch"]')!)
    expect((await screen.findByRole('alert')).textContent).toContain('transition rejected')
  })

  it('shows a load failure and retries', async () => {
    const list = vi.fn<PluginManagerPanelProps['list']>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(SNAPSHOT)
    mount({ list })
    await openPanel()

    expect((await screen.findByRole('alert')).textContent).toContain('temporarily unavailable')
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText('plugin-weather')).toBeTruthy()
    expect(list).toHaveBeenCalledTimes(2)
  })

  it('closes on Escape, outside pointer input, and a second trigger click', async () => {
    mount()
    await openPanel()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()

    await openPanel()
    fireEvent.pointerDown(document.body)
    expect(screen.queryByRole('dialog')).toBeNull()

    await openPanel()
    fireEvent.click(screen.getByRole('button', { name: 'Plugins' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('renders an icon-only trigger when the sidebar is collapsed', async () => {
    mount({ wide: false })
    await waitFor(() => { expect(screen.getByRole('button', { name: 'Plugins' })).toBeTruthy() })
    expect(screen.queryByText('Plugins')).toBeNull()
  })
})
