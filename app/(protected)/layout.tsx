'use client';

import { Sidebar } from '@/components/sidebar';
import { ProtectedRoute } from '@/components/protected-route';
import { Toaster } from '@/components/ui/sonner';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requirePlant>
      {/* h-screen + overflow-hidden = the outer box never grows beyond viewport.
          Sidebar and main both flex inside this fixed-height container.
          Sidebar handles its own internal scroll via flex-1 + min-h-0 + overflow-y-auto.
          Main content scrolls independently via overflow-y-auto. */}
      <div className="flex h-screen w-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-y-auto bg-emerald-50/20">
          {children}
        </main>
      </div>
      <Toaster />
    </ProtectedRoute>
  );
}
