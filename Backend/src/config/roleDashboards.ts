import { UserRole } from '../types';

export interface RoleDashboard {
  /** Stable key for the client: the granting role, or the cohort id. */
  key: string;
  /** The name in the button, e.g. "Bookshop Manager" or "DCA Basic". */
  label: string;
  /** Route the button navigates to. */
  path: string;
  /**
   * Verb in front of the label. A role dashboard is somewhere you are admitted
   * to, a cohort is somewhere you are sent, and the wording follows.
   */
  cta?: 'Access' | 'Go to';
}

/**
 * The only place that maps a role to a dashboard.
 *
 * A role appears here solely when a dashboard for it actually exists and its
 * screens admit that role. Listing a role without one would hand a member a
 * button leading straight to a redirect. Roles such as pastor, hod, cell_leader
 * and worker are therefore deliberately absent: they are meaningful
 * assignments, but they have no dashboard of their own yet.
 *
 * Adding a dashboard later is one entry here; the button and the picker modal
 * both read from this list and need no change.
 */
const ROLE_DASHBOARDS: Partial<Record<UserRole, RoleDashboard>> = {
  [UserRole.SUPER_ADMIN]: {
    key: UserRole.SUPER_ADMIN,
    label: 'Super Admin',
    path: '/dashboard/admin',
  },
  [UserRole.ADMIN]: {
    key: UserRole.ADMIN,
    label: 'Admin',
    path: '/dashboard/academy',
  },
  [UserRole.BOOKSHOP_MANAGER]: {
    key: UserRole.BOOKSHOP_MANAGER,
    label: 'Bookshop Manager',
    path: '/dashboard/bookshop-manager',
  },
};

/**
 * Dashboards a member may enter, beyond the member dashboard everyone has.
 *
 * Returns a list rather than a single entry because a member may hold several
 * roles at once; the caller renders one button for a single result and a picker
 * for more than one. This is presentation only — each dashboard still enforces
 * its own role check on arrival.
 */
export function getDashboardsForRoles(roles: (UserRole | string)[]): RoleDashboard[] {
  const seen = new Set<string>();
  const dashboards: RoleDashboard[] = [];

  for (const role of roles) {
    const dashboard = ROLE_DASHBOARDS[role as UserRole];
    if (dashboard && !seen.has(dashboard.key)) {
      seen.add(dashboard.key);
      dashboards.push(dashboard);
    }
  }

  return dashboards;
}
