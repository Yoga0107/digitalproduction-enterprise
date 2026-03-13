// lib/auth-context.ts (FIXED)

'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { roleIdToRole, UserRole } from './role-map';

export interface User {
  id: number;
  email: string;
  full_name: string; // WAJIB
  role: UserRole;
  role_id?: number;
}

interface AuthContextType {
  isLoading: any;
  user: User | null;
  token: string | null;
  login: (token: string, user: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const login = (accessToken: string, apiUser: any) => {
    const role = roleIdToRole(apiUser.role_id);

    const mappedUser: User = {
      id: apiUser.id,
      email: apiUser.email,
      full_name:
        apiUser.full_name ||
        apiUser.name ||
        apiUser.username ||
        apiUser.email?.split('@')[0] ||
        'User',
      role,
      role_id: apiUser.role_id,
    };

    setUser(mappedUser);
    setToken(accessToken);

    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(mappedUser));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');

    if (savedUser && savedToken) {
      const parsed = JSON.parse(savedUser);

      // 🔐 HARD GUARD
      if (!parsed.full_name) {
        logout();
        return;
      }

      setUser(parsed);
      setToken(savedToken);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isLoading:false, user, token, login, logout }}>
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

