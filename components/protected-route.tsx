'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, UserRole } from '@/lib/auth-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  authPage?: boolean; 
  // true  => halaman login / register
  // false => halaman protected (default)
}

export function ProtectedRoute({
  children,
  allowedRoles,
  authPage = false,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    // ===============================
    // 1️⃣ AUTH PAGE (LOGIN / REGISTER)
    // ===============================
    if (authPage) {
      if (user) {
        router.replace('/dashboard');
      }
      return;
    }

    // ===============================
    // 2️⃣ PROTECTED PAGE
    // ===============================
    if (!user) {
      router.replace('/login');
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace('/unauthorized');
    }
  }, [user, isLoading, allowedRoles, authPage, router, pathname]);

  // ===============================
  // ⏳ LOADING STATE
  // ===============================
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  if (authPage && user) return null;
  if (!authPage && !user) return null;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}
