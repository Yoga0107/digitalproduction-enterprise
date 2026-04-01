'use client';

/**
 * lib/auth-context.tsx
 * Full integration dengan OEE Backend API.
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { roleIdToRole, UserRole } from './role-map';
import { loginApi, logoutApi } from '@/services/authService';
import type { ApiPlant } from '@/types/api';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  role_id: number;
  is_superuser: boolean;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
}

export interface Plant {
  id: number;
  name: string;
  code: string;
  schema_name: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  activePlant: Plant | null;
  accessiblePlants: Plant[];
  isLoading: boolean;
  /** null = tidak ada custom override (pakai role default) */
  modulePermissions: string[] | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  selectPlant: (plant: Plant) => void;
  updateUser: (patch: Partial<User>) => void;
  /** Dipanggil setelah admin ubah module permissions — update state jika userId == currentUser */
  refreshModulePermissions: (userId: number, modules: string[]) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activePlant, setActivePlant] = useState<Plant | null>(null);
  const [accessiblePlants, setAccessiblePlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modulePermissions, setModulePermissions] = useState<string[] | null>(null);

  const mapApiPlant = (p: ApiPlant): Plant => ({
    id: p.id,
    name: p.name,
    code: p.code,
    schema_name: p.schema_name,
    is_active: p.is_active,
  });

  const clearSession = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('accessible_plants');
    localStorage.removeItem('active_plant_id');
    localStorage.removeItem('active_plant');
    localStorage.removeItem('module_permissions');
    setUser(null);
    setToken(null);
    setActivePlant(null);
    setAccessiblePlants([]);
    setModulePermissions(null);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const data = await loginApi(username, password);

    const mappedUser: User = {
      id: data.user.id,
      username: data.user.username,
      email: data.user.email,
      full_name: data.user.full_name || data.user.username,
      role: roleIdToRole(data.user.role?.id),
      role_id: data.user.role?.id ?? 0,
      is_superuser: data.user.is_superuser,
      is_active: data.user.is_active ?? true,
      must_change_password: data.user.must_change_password ?? false,
      created_at: data.user.created_at ?? new Date().toISOString(),
    };

    const plants = data.accessible_plants.map(mapApiPlant);

    setUser(mappedUser);
    setToken(data.token.access_token);
    setAccessiblePlants(plants);

    localStorage.setItem('token', data.token.access_token);
    localStorage.setItem('refresh_token', data.token.refresh_token);
    localStorage.setItem('user', JSON.stringify(mappedUser));
    localStorage.setItem('accessible_plants', JSON.stringify(plants));

    // Fetch module permissions for this user (uses /me/modules — no superuser required)
    try {
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/v1/users/me/modules`,
        { headers: { Authorization: `Bearer ${data.token.access_token}` } }
      );
      if (resp.ok) {
        const modData = await resp.json();
        const mods: string[] | null = modData.use_role_default ? null : modData.modules;
        setModulePermissions(mods);
        localStorage.setItem('module_permissions', JSON.stringify(mods));
      }
    } catch {
      // Non-fatal — fallback to role defaults
      setModulePermissions(null);
    }

    // Auto-select plant: restore last used, or auto-select if only one
    const savedPlantId = localStorage.getItem('active_plant_id');
    const previousPlant = plants.find((p: Plant) => p.id === Number(savedPlantId));

    if (previousPlant) {
      setActivePlant(previousPlant);
    } else if (plants.length === 1) {
      setActivePlant(plants[0]);
      localStorage.setItem('active_plant_id', String(plants[0].id));
      localStorage.setItem('active_plant', JSON.stringify(plants[0]));
    }
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try { await logoutApi(refreshToken); } catch { /* ignore */ }
    }
    clearSession();
  }, [clearSession]);

  const selectPlant = useCallback((plant: Plant) => {
    setActivePlant(plant);
    localStorage.setItem('active_plant_id', String(plant.id));
    localStorage.setItem('active_plant', JSON.stringify(plant));
  }, []);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      const savedPlants = localStorage.getItem('accessible_plants');
      const savedPlant = localStorage.getItem('active_plant');
      const savedModules = localStorage.getItem('module_permissions');

      if (savedToken && savedUser) {
        const parsedUser: User = JSON.parse(savedUser);
        if (!parsedUser.full_name || !parsedUser.id) { clearSession(); return; }

        setToken(savedToken);
        setUser(parsedUser);
        if (savedPlants) setAccessiblePlants(JSON.parse(savedPlants));
        if (savedPlant) setActivePlant(JSON.parse(savedPlant));
        if (savedModules !== null) {
          setModulePermissions(JSON.parse(savedModules));
        }
      }
    } catch {
      clearSession();
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const refreshModulePermissions = useCallback((userId: number, modules: string[]) => {
    // Update in-memory state only if the changed user is the currently logged-in user
    setUser(prev => {
      if (!prev) return prev;
      if (prev.id === userId) {
        const mods = modules.length === 0 ? null : modules;
        setModulePermissions(mods);
        localStorage.setItem('module_permissions', JSON.stringify(mods));
      }
      return prev;
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      user, token, activePlant, accessiblePlants, isLoading,
      modulePermissions,
      login, logout, selectPlant, updateUser, refreshModulePermissions,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export type { UserRole };
