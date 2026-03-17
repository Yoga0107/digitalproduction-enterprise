import { UserRole } from './role-map';

// ── Role groups ─────────────────────────────────────────────────────────────
export const OEE_MASTER_ROLES: UserRole[] = ['admin', 'manager'];
export const OEE_INPUT_ROLES:  UserRole[] = ['admin', 'manager', 'user'];
export const OEE_VIEW_ROLES:   UserRole[] = ['admin', 'manager', 'user', 'viewer'];

// ── Guard helpers (return true = boleh akses) ───────────────────────────────
export const canAccessMaster = (role?: UserRole | null) =>
  !!role && OEE_MASTER_ROLES.includes(role);

export const canAccessInput = (role?: UserRole | null) =>
  !!role && OEE_INPUT_ROLES.includes(role);

export const canAccessView = (role?: UserRole | null) =>
  !!role && OEE_VIEW_ROLES.includes(role);

// ── Route → required roles map ───────────────────────────────────────────────
export const OEE_ROUTE_ROLES: Record<string, UserRole[]> = {
  // Overview
  '/oee':                               OEE_VIEW_ROLES,
  // Master
  '/oee/master/shift':                  OEE_MASTER_ROLES,
  '/oee/master/line':                   OEE_MASTER_ROLES,
  '/oee/master/kode-pakan':             OEE_MASTER_ROLES,
  '/oee/master/standard-throughput':    OEE_MASTER_ROLES,
  '/oee/master/machine-losses':         OEE_MASTER_ROLES,
  // Input
  '/oee/input/output':                  OEE_INPUT_ROLES,
  '/oee/input/machine-losses':          OEE_INPUT_ROLES,
  // View
  '/oee/view/loading-time':             OEE_VIEW_ROLES,
  '/oee/view/operating-time':           OEE_VIEW_ROLES,
  '/oee/view/availability-rate':        OEE_VIEW_ROLES,
  '/oee/view/performance-rate':         OEE_VIEW_ROLES,
  '/oee/view/quality-rate':             OEE_VIEW_ROLES,
  '/oee/view/summary':                  OEE_VIEW_ROLES,
};

export function getRequiredRoles(path: string): UserRole[] {
  return OEE_ROUTE_ROLES[path] ?? OEE_VIEW_ROLES;
}
