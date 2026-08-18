/** Browser half: mount the pluginManager Remote and contribute the sidebar panel. */
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import pluginManagerRemote from 'dsh-plugin-sidebar-manager/remote'
import { PluginManagerPanel, type PluginManagerPanelInjected } from './PluginManagerPanel.tsx'
import { en, zh, type PluginManagerKey } from './locales.ts'

export type { PluginManagerPanelInjected, PluginManagerPanelProps } from './PluginManagerPanel.tsx'
export type { PluginManagerKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    pluginManager: PluginManagerKey
  }
}

/** Namespace owned by this installable plugin. */
export const NS = 'pluginManager'

/** Require the existing inventory reader before registering this panel. */
export const inject = ['slots', 'locale', 'remote', 'remote.pluginInventory']

/** Mount this plugin's strict Remote contribution, then register its sidebar UI. */
export async function apply(ctx: ClientContext): Promise<void> {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'plugin-manager: dictionaries')
  await ctx.remote.$mount(pluginManagerRemote)

  const list: PluginManagerPanelInjected['list'] = async () => {
    const result = await ctx.remote.pluginInventory.list()
    if (!result.ok) {
      throw new Error('pluginInventory.list failed: ' + result.error.code + ': ' + result.error.message)
    }
    return result.value
  }
  const setEnabled: PluginManagerPanelInjected['setEnabled'] = async (entryId, enabled) => {
    const result = await ctx.remote.pluginManager.setEnabled({ entryId, enabled })
    if (!result.ok) {
      throw new Error('pluginManager.setEnabled failed: ' + result.error.code + ': ' + result.error.message)
    }
    return result.value
  }

  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
    name: 'sidebar.footer.action',
    id: 'dsh-plugin-sidebar-manager',
    locale: NS,
    inject: (): PluginManagerPanelInjected => ({ list, setEnabled }),
  }, PluginManagerPanel))
}
