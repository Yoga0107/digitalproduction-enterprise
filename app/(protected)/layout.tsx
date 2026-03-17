'use client';

import { Sidebar } from '@/components/sidebar';
import { ProtectedRoute } from '@/components/protected-route';
import { Toaster } from '@/components/ui/sonner';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requirePlant>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-emerald-50/20">
          {children}
        </main>
      </div>
      <Toaster />
    </ProtectedRoute>
  );
}
