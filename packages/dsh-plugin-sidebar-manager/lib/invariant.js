//#region lib/types/invariant.js
/** Package-owned invariant companion. @module dsh-plugin-sidebar-manager/invariant */
const PACKAGE_NAME = "dsh-plugin-sidebar-manager";
/** Cordis companion plugin name. */
const name = "plugin-manager-invariant";
/** Service required before the companion can reserve package ownership. */
const inject = ["invariants"];
/** No independent state: Loader remains the source of truth. */
const install = () => {};
/** Register this package's invariant companion. */
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
