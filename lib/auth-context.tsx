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
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  selectPlant: (plant: Plant) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activePlant, setActivePlant] = useState<Plant | null>(null);
  const [accessiblePlants, setAccessiblePlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    setUser(null);
    setToken(null);
    setActivePlant(null);
    setAccessiblePlants([]);
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

    // Auto-select plant: restore last used, or auto-select if only one
    const savedPlantId = localStorage.getItem('active_plant_id');
    const previousPlant = plants.find((p) => p.id === Number(savedPlantId));

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

      if (savedToken && savedUser) {
        const parsedUser: User = JSON.parse(savedUser);
        if (!parsedUser.full_name || !parsedUser.id) { clearSession(); return; }

        setToken(savedToken);
        setUser(parsedUser);
        if (savedPlants) setAccessiblePlants(JSON.parse(savedPlants));
        if (savedPlant) setActivePlant(JSON.parse(savedPlant));
      }
    } catch {
      clearSession();
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  return (
    <AuthContext.Provider value={{ user, token, activePlant, accessiblePlants, isLoading, login, logout, selectPlant }}>
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
