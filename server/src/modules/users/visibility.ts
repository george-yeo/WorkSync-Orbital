import type { AuthContext } from '../../middleware/auth.js'

export type Viewer = AuthContext

/**
 * Demo isolation rules. Guests live in a sandbox: they can only see the fictional seed users and
 * their own sandbox groups. Real users never see guests or other guests' sandboxes, so nothing a
 * demo visitor types is ever shown to anyone else.
 */
export function visibleUsersFilter(viewer: Viewer) {
  return viewer.isGuest ? { isSeed: true } : { isGuest: false }
}

export function visibleGroupsFilter(viewer: Viewer) {
  return { demoOwner: viewer.isGuest ? viewer.userId : null }
}
