/**
 * Whether a module is read-only in the runtime manager.
 * Official DSH and Cordis modules are system infrastructure; only user-added
 * packages may be changed through the browser-facing Remote.
 * @param moduleName - Exact Loader module specifier.
 * @returns True when the module must not be changed.
 */
export declare function isProtectedModule(moduleName: string): boolean;
//# sourceMappingURL=protection.d.ts.map