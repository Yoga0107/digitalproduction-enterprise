'use client';


import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/lib/role-map';
import { canAccessMaster, canAccessInput, canAccessView } from '@/lib/oee-access';
import { ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export type OeeSection = 'master' | 'input' | 'view';

interface OeeGuardProps {
  section: OeeSection;
  children: React.ReactNode;
}

const SECTION_LABELS: Record<OeeSection, string> = {
  master: 'Master Data',
  input:  'Input Data',
  view:   'Data View',
};

const SECTION_REQUIRED: Record<OeeSection, string> = {
  master: 'Administrator atau Plant Manager',
  input:  'Administrator, Plant Manager, atau Operator',
  view:   'semua role',
};

export function OeeGuard({ section, children }: OeeGuardProps) {
  const { user } = useAuth();
  const router = useRouter();

  const allowed =
    section === 'master' ? canAccessMaster(user?.role) :
    section === 'input'  ? canAccessInput(user?.role)  :
                           canAccessView(user?.role);

  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <ShieldOff className="h-8 w-8 text-red-400" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-800">Akses Ditolak</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Halaman <span className="font-medium text-slate-700">{SECTION_LABELS[section]}</span> hanya
            dapat diakses oleh <span className="font-medium text-slate-700">{SECTION_REQUIRED[section]}</span>.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Role Anda saat ini: <span className="font-medium">{user?.role ?? '—'}</span>
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/oee')}>
          Kembali ke OEE Overview
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
