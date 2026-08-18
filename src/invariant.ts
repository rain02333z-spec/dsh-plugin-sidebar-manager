/** Package-owned invariant companion. @module dsh-plugin-sidebar-manager/invariant */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = 'dsh-plugin-sidebar-manager'

/** Cordis companion plugin name. */
export const name = 'plugin-manager-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/** No independent state: Loader remains the source of truth. */
const install: InvariantInstaller = () => {}

/** Register this package's invariant companion. */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
/* jscpd:ignore-end */
