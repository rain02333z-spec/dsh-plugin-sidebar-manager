import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const packageDir = resolve(root, 'packages/dsh-plugin-sidebar-manager')
const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const result = spawnSync(command, [
  'install',
  '--prod',
  '--no-lockfile',
  '--config.auto-install-peers=false',
], {
  cwd: packageDir,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

if (result.error) throw result.error
process.exit(result.status ?? 1)
