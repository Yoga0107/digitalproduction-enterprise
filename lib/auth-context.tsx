'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export type UserRole = 'admin' | 'manager' | 'user' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'admin@company.com': {
    password: 'admin123',
    user: {
      id: '1',
      email: 'admin@company.com',
      name: 'Admin User',
      role: 'admin',
    },
  },
  'manager@company.com': {
    password: 'manager123',
    user: {
      id: '2',
      email: 'manager@company.com',
      name: 'Manager User',
      role: 'manager',
    },
  },
  'user@company.com': {
    password: 'user123',
    user: {
      id: '3',
      email: 'user@company.com',
      name: 'Regular User',
      role: 'user',
    },
  },
  'viewer@company.com': {
    password: 'viewer123',
    user: {
      id: '4',
      email: 'viewer@company.com',
      name: 'Viewer User',
      role: 'viewer',
    },
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const mockUser = MOCK_USERS[email];

    if (mockUser && mockUser.password === password) {
      setUser(mockUser.user);
      localStorage.setItem('user', JSON.stringify(mockUser.user));
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
