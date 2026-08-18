/**
 * Host half of the installable plugin manager. It adds only the mutable
 * operation missing from DSH's built-in read-only pluginInventory Remote.
 * The browser UI continues to read its catalog through pluginInventory.list().
 */
import type { Context } from '@deepseek-ai/cordis'
import type { Entry } from '@deepseek-ai/cordis-plugin-loader'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
// The generated ./typert and ./remote artifacts import zod at runtime.
import type {} from 'zod'
import { isProtectedModule } from './protection.ts'
import type { PluginManagerSetEnabledRequest, PluginManagerSetEnabledResult } from './types.ts'

export type * from './types.ts'

/** Trusted Host Remote that toggles already-configured Loader entries. */
export class PluginManagerGateway extends TypertRemoteService {
  static inject = ['loader']

  constructor(ctx: Context) {
    super(ctx, 'pluginManager')
  }

  /**
   * Apply a runtime enablement transition without writing the profile patch.
   * A restart restores the configured value from cordis.patch.yml.
   * @param request - entry identity and desired enablement.
   * @returns whether the requested transition completed.
   */
  @Remote('setEnabled')
  async setEnabled(request: PluginManagerSetEnabledRequest): Promise<PluginManagerSetEnabledResult> {
    const entry = this.resolveEntry(request.entryId)
    if (entry === undefined) return { ok: false, message: 'plugin entry not found: ' + request.entryId }
    if (entry.options.group) return { ok: false, message: 'plugin groups cannot be changed' }
    if (isProtectedModule(entry.options.name)) {
      return { ok: false, message: 'protected plugin cannot be changed: ' + entry.options.name }
    }

    const desiredDisabled = !request.enabled
    if (request.enabled && !entry.disabled) return { ok: true }
    if (desiredDisabled && entry.options.disabled === true) return { ok: true }
    const previousDisabled = entry.options.disabled
    try {
      // Entry.update() changes the live Loader state but does not write the
      // composed profile tree back into the generated root cordis.yml.
      await entry.update({ disabled: desiredDisabled })
      if (entry.disabled !== desiredDisabled) {
        await entry.update({ disabled: previousDisabled ?? null })
        return { ok: false, message: 'plugin effective state is controlled by an ancestor group' }
      }
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : String(error) }
    }
    return { ok: true }
  }

  /** Resolve a public Loader-tree id while tolerating a concurrent removal. */
  private resolveEntry(entryId: string): Entry | undefined {
    try {
      return this.ctx.loader.resolve(entryId)
    } catch {
      return undefined
    }
  }
}

export default PluginManagerGateway
