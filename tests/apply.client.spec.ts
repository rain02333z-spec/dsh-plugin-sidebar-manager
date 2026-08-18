import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it, vi } from 'vitest'
import { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import { SlotRegistry } from '@deepseek-ai/dsh-client-runtime/client'
import { apply, inject } from '../src/client/index.ts'

async function bench() {
  const ctx = new Context()
  await ctx.plugin(SlotRegistry).await()
  ctx.slots.register({
    name: 'root',
    children: { 'sidebar.footer.action': { kind: 'list', scope: 'root' } },
  } as never, (() => null) as never)
  ctx.provide('locale', new LocaleRuntime(ctx))
  const pluginInventory = { list: vi.fn(async () => ({ entries: [] })) }
  const remote = {
    $mount: vi.fn(async () => {}),
    pluginInventory,
    pluginManager: { setEnabled: vi.fn(async () => ({ ok: true })) },
  }
  ctx.provide('remote', remote as never)
  ctx.provide('remote.pluginInventory', pluginInventory as never)
  return { ctx, remote }
}

describe('plugin-manager client apply', () => {
  it('declares the services used by its client integration', () => {
    expect(inject).toEqual(['slots', 'locale', 'remote', 'remote.pluginInventory'])
  })

  it('registers one package-qualified sidebar entry and removes it on teardown', async () => {
    const { ctx, remote } = await bench()
    const fiber = ctx.plugin({ inject: [...inject], apply })
    await fiber.await()

    expect(ctx.slots.entries('sidebar.footer.action').map(entry => entry.options.id))
      .toEqual(['dsh-plugin-sidebar-manager'])
    expect(remote.$mount).toHaveBeenCalledOnce()

    await fiber.dispose()
    expect(ctx.slots.entries('sidebar.footer.action')).toHaveLength(0)
    await ctx.fiber.dispose()
  })
})
