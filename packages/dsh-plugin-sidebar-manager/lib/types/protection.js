/** Module specifier of this manager, which cannot safely mutate itself. */
const PLUGIN_MANAGER_MODULE = 'dsh-plugin-sidebar-manager';
/**
 * Whether a module is read-only in the runtime manager.
 * Official DSH and Cordis modules are system infrastructure; only user-added
 * packages may be changed through the browser-facing Remote.
 * @param moduleName - Exact Loader module specifier.
 * @returns True when the module must not be changed.
 */
export function isProtectedModule(moduleName) {
    return moduleName === PLUGIN_MANAGER_MODULE
        || moduleName.startsWith('@deepseek-ai/')
        || moduleName.startsWith('cordis:');
}
//# sourceMappingURL=protection.js.map