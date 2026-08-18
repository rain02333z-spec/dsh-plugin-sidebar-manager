import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type PluginManagerKey } from './locales.ts';
export type { PluginManagerPanelInjected, PluginManagerPanelProps } from './PluginManagerPanel.tsx';
export type { PluginManagerKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        pluginManager: PluginManagerKey;
    }
}
/** Namespace owned by this installable plugin. */
export declare const NS = "pluginManager";
/** Require the existing inventory reader before registering this panel. */
export declare const inject: string[];
/** Mount this plugin's strict Remote contribution, then register its sidebar UI. */
export declare function apply(ctx: ClientContext): Promise<void>;
//# sourceMappingURL=index.d.ts.map