/**
 * Host half of the installable plugin manager. It adds only the mutable
 * operation missing from DSH's built-in read-only pluginInventory Remote.
 * The browser UI continues to read its catalog through pluginInventory.list().
 */
import type { Context } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { PluginManagerSetEnabledRequest, PluginManagerSetEnabledResult } from './types.ts';
export type * from './types.ts';
/** Trusted Host Remote that toggles already-configured Loader entries. */
export declare class PluginManagerGateway extends TypertRemoteService {
    static inject: string[];
    constructor(ctx: Context);
    /**
     * Apply a runtime enablement transition without writing the profile patch.
     * A restart restores the configured value from cordis.patch.yml.
     * @param request - entry identity and desired enablement.
     * @returns whether the requested transition completed.
     */
    setEnabled(request: PluginManagerSetEnabledRequest): Promise<PluginManagerSetEnabledResult>;
    /** Resolve a public Loader-tree id while tolerating a concurrent removal. */
    private resolveEntry;
}
export default PluginManagerGateway;
//# sourceMappingURL=index.d.ts.map