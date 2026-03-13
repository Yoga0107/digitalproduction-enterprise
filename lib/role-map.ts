// lib/role-map.ts

export type UserRole = 'admin' | 'manager' | 'user' | 'viewer';

export const ROLE_ID_MAP: Record<number, UserRole> = {
  1: 'admin',
  2: 'manager',
  3: 'user',
  4: 'viewer',
};

export function roleIdToRole(roleId?: number | null): UserRole {
  if (!roleId) return 'viewer';
  return ROLE_ID_MAP[roleId] ?? 'viewer';
}
