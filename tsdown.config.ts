import { clientBundle } from '../../client/tsdown.client.ts'

export default clientBundle(
  'dsh-plugin-sidebar-manager',
  ['lib/types/index.js', 'lib/types/invariant.js'],
  { hostPhase: true },
)
