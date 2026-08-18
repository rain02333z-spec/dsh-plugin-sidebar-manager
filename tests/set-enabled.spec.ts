import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context, type Plugin } from '@deepseek-ai/cordis'
import Loader from '@deepseek-ai/cordis-plugin-loader'
import { Group } from '../../../../vendor/loader/src/config/group.ts'
import { remoteMethods } from '@deepseek-ai/dsh-typert-protocol'
import type { PluginEntryId } from '@deepseek-ai/dsh-host-plugin-inventory/types'
import PluginManagerGateway from '../src/index.ts'

const contexts: Context[] = []

afterEach(async () => {
  await Promise.all(contexts.splice(0).map(ctx => ctx.fiber.dispose()))
})

const activePlugin: Plugin.Function = () => {}
const pluginEntryId = (value: string): PluginEntryId => value as PluginEntryId

async function harness(): Promise<{ ctx: Context; manager: PluginManagerGateway }> {
  const ctx = new Context()
  contexts.push(ctx)
  await ctx.plugin(Loader)
  ctx.loader.builtins.toggle = activePlugin
  ctx.loader.builtins.group = Group
  const importPlugin = ctx.loader.import.bind(ctx.loader)
  vi.spyOn(ctx.loader, 'import').mockImplementation((moduleName, getOuterStack) => {
    if (moduleName.startsWith('dsh-plugin-')) return activePlugin
    return importPlugin(moduleName, getOuterStack)
  })
  await ctx.plugin(PluginManagerGateway)
  return { ctx, manager: ctx.get('pluginManager') as PluginManagerGateway }
}

describe('PluginManagerGateway', () => {
  it('publishes one setEnabled Remote method', async () => {
    const { manager } = await harness()
    expect(manager.typertRemote).toMatchObject({ serviceKey: 'pluginManager', namespace: 'pluginManager' })
    expect(remoteMethods(manager)).toEqual([{ method: 'setEnabled', invocation: { kind: 'direct' } }])
  })

  it('toggles one Loader entry without using the tree write path', async () => {
    const { ctx, manager } = await harness()
    const entryId = await ctx.loader.create({ name: 'dsh-plugin-toggle' })

    expect(await manager.setEnabled({ entryId: pluginEntryId(entryId), enabled: false })).toEqual({ ok: true })
    expect(ctx.loader.resolve(entryId).disabled).toBe(true)

    expect(await manager.setEnabled({ entryId: pluginEntryId(entryId), enabled: true })).toEqual({ ok: true })
    expect(ctx.loader.resolve(entryId).disabled).toBe(false)
  })

  it('rejects changes to system plugins and the manager itself', async () => {
    const { ctx, manager } = await harness()
    const systemId = await ctx.loader.create({ name: 'cordis:toggle' })
    const managerId = await ctx.loader.create({ name: 'dsh-plugin-sidebar-manager', disabled: true })

    for (const entryId of [systemId, managerId]) {
      const result = await manager.setEnabled({ entryId: pluginEntryId(entryId), enabled: false })
      expect(result.ok).toBe(false)
      expect(result.message).toContain('protected plugin')
    }
  })

  it('rejects group entries that are absent from the public inventory', async () => {
    const { ctx, manager } = await harness()
    const entryId = await ctx.loader.create({ name: 'cordis:group', group: true, config: [] })

    const result = await manager.setEnabled({ entryId: pluginEntryId(entryId), enabled: false })
    expect(result).toEqual({ ok: false, message: 'plugin groups cannot be changed' })
  })

  it('reports an ancestor-controlled effective state and restores the child option', async () => {
    const { ctx, manager } = await harness()
    const groupId = await ctx.loader.create({ name: 'cordis:group', group: true, disabled: true, config: [] })
    const entryId = await ctx.loader.create({ name: 'dsh-plugin-child', disabled: true }, groupId)

    const result = await manager.setEnabled({ entryId: pluginEntryId(entryId), enabled: true })
    expect(result.ok).toBe(false)
    expect(result.message).toContain('ancestor group')
    expect(ctx.loader.resolve(entryId).options.disabled).toBe(true)
  })

  it('reports a missing Loader entry without throwing', async () => {
    const { manager } = await harness()
    const result = await manager.setEnabled({ entryId: pluginEntryId('missing-entry'), enabled: true })
    expect(result.ok).toBe(false)
    expect(result.message).toContain('missing-entry')
  })
})
