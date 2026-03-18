'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, UserRole } from '@/lib/auth-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  authPage?: boolean;
  requirePlant?: boolean;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  authPage = false,
  requirePlant = false,
}: ProtectedRouteProps) {
  const { user, isLoading, activePlant, accessiblePlants } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    
    if (authPage) {
      if (user) {

        if (!activePlant && accessiblePlants.length > 1) {
          router.replace('/select-plant');
        } else if (!activePlant) {
          router.replace('/select-plant');
        } else {
          router.replace('/dashboard');
        }
      }
      return;
    }


    if (!user) {
      router.replace('/login');
      return;
    }


    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace('/unauthorized');
      return;
    }


    if (requirePlant && !activePlant) {
      router.replace('/select-plant');
      return;
    }
  }, [user, isLoading, activePlant, accessiblePlants, allowedRoles, authPage, requirePlant, router, pathname]);


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


  if (requirePlant && !activePlant) return null;

  return <>{children}</>;
}
