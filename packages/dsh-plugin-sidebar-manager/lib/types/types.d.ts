import type { PluginEntryId } from '@deepseek-ai/dsh-host-plugin-inventory/types';
/** Payload for the runtime enablement switch. */
export interface PluginManagerSetEnabledRequest {
    /** Loader-tree entry identity returned by pluginInventory.list(). */
    readonly entryId: PluginEntryId;
    /** Desired effective enablement for that entry. */
    readonly enabled: boolean;
}
/** Outcome of a runtime enablement switch. */
export interface PluginManagerSetEnabledResult {
    /** Whether the entry now reflects the requested state. */
    readonly ok: boolean;
    /** Human-readable failure detail when ok is false. */
    readonly message?: string;
}
//# sourceMappingURL=types.d.ts.map