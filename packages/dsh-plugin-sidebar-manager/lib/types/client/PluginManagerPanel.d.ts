import { type ReactNode } from 'react';
import type { PluginInventorySnapshot } from '@deepseek-ai/dsh-api-remotes/client';
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
/** Client callbacks injected through sidebar.footer.action. */
export interface PluginManagerPanelInjected {
    /** Read the built-in Loader inventory. */
    list: () => Promise<PluginInventorySnapshot>;
    /** Change one entry's live enablement. */
    setEnabled: (entryId: PluginInventorySnapshot['entries'][number]['entryId'], enabled: boolean) => Promise<{
        ok: boolean;
        message?: string;
    }>;
}
/** Props composed by the sidebar footer-action slot. */
export type PluginManagerPanelProps = PropsRuntime<'sidebar.footer.action'> & PropsLocale<'pluginManager'> & InjectFace<PluginManagerPanelInjected>;
/** Sidebar button plus its fixed, searchable, collapsible plugin catalog. */
export declare function PluginManagerPanel({ wide, list, setEnabled, t }: PluginManagerPanelProps): ReactNode;
//# sourceMappingURL=PluginManagerPanel.d.ts.map