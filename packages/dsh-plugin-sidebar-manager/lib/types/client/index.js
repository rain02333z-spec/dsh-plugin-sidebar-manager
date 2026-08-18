import pluginManagerRemote from 'dsh-plugin-sidebar-manager/remote';
import { PluginManagerPanel } from "./PluginManagerPanel.js";
import { en, zh } from "./locales.js";
/** Namespace owned by this installable plugin. */
export const NS = 'pluginManager';
/** Require the existing inventory reader before registering this panel. */
export const inject = ['slots', 'locale', 'remote', 'remote.pluginInventory'];
/** Mount this plugin's strict Remote contribution, then register its sidebar UI. */
export async function apply(ctx) {
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'plugin-manager: dictionaries');
    await ctx.remote.$mount(pluginManagerRemote);
    const list = async () => {
        const result = await ctx.remote.pluginInventory.list();
        if (!result.ok) {
            throw new Error('pluginInventory.list failed: ' + result.error.code + ': ' + result.error.message);
        }
        return result.value;
    };
    const setEnabled = async (entryId, enabled) => {
        const result = await ctx.remote.pluginManager.setEnabled({ entryId, enabled });
        if (!result.ok) {
            throw new Error('pluginManager.setEnabled failed: ' + result.error.code + ': ' + result.error.message);
        }
        return result.value;
    };
    ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
        name: 'sidebar.footer.action',
        id: 'dsh-plugin-sidebar-manager',
        locale: NS,
        inject: () => ({ list, setEnabled }),
    }, PluginManagerPanel));
}
//# sourceMappingURL=index.js.map