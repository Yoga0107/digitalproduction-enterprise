/**
 * lib/role-map.ts
 * Maps backend role IDs (int) and names (string) → frontend UserRole.
 *
 * Backend default roles (init_db.py):
 *   id 1 = administrator
 *   id 2 = plant_manager
 *   id 3 = operator
 *   id 4 = viewer
 */

export type UserRole = 'admin' | 'manager' | 'user' | 'viewer';

export const ROLE_ID_MAP: Record<number, UserRole> = {
  1: 'admin',
  2: 'manager',
  3: 'user',
  4: 'viewer',
};

export const ROLE_NAME_MAP: Record<string, UserRole> = {
  administrator: 'admin',
  plant_manager: 'manager',
  operator: 'user',
  viewer: 'viewer',
};

export function roleIdToRole(roleId?: number | null): UserRole {
  if (!roleId) return 'viewer';
  return ROLE_ID_MAP[roleId] ?? 'viewer';
}

export function roleNameToRole(roleName?: string | null): UserRole {
  if (!roleName) return 'viewer';
  return ROLE_NAME_MAP[roleName] ?? 'viewer';
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  manager: 'Plant Manager',
  user: 'Operator',
  viewer: 'Viewer',
};