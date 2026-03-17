'use client';

import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Factory, BarChart3, Users, Activity, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ROLE_LABELS } from '@/lib/role-map';

export default function DashboardPage() {
  const { user, activePlant, accessiblePlants } = useAuth();
  const router = useRouter();

  return (
    <div className="p-8 space-y-8">

      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-slate-500">
          Selamat datang, <span className="font-medium text-slate-700">{user?.full_name}</span>
        </p>
      </div>

      {/* Plant aktif banner */}
      {activePlant && (
        <Card className="border-blue-200 bg-blue-50/60">
          <CardContent className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Factory className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-900">{activePlant.name}</p>
                <p className="text-xs text-blue-600">Kode: {activePlant.code} · Schema: {activePlant.schema_name}</p>
              </div>
            </div>
            {accessiblePlants.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-100"
                onClick={() => router.push('/select-plant')}
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                Ganti Plant
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="outline" className="py-1 px-3 text-sm">
          Role: {ROLE_LABELS[user?.role || 'viewer']}
        </Badge>
        <Badge variant="secondary" className="py-1 px-3 text-sm">{user?.email}</Badge>
        {user?.is_superuser && <Badge variant="destructive" className="py-1 px-3 text-sm">Superuser</Badge>}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Akun</CardTitle>
            <CardDescription>Detail user yang sedang login</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              ['User ID', user?.id],
              ['Username', user?.username],
              ['Email', user?.email],
              ['Nama Lengkap', user?.full_name],
              ['Role', ROLE_LABELS[user?.role || 'viewer']],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex justify-between">
                <span className="text-muted-foreground">{label}:</span>
                <span className="font-medium">{String(value ?? '-')}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plant yang Dapat Diakses</CardTitle>
            <CardDescription>
              {accessiblePlants.length === 0 ? 'Belum ada akses plant' : `${accessiblePlants.length} plant tersedia`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {accessiblePlants.map((plant) => (
              <div key={plant.id} className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                activePlant?.id === plant.id ? 'bg-blue-50 text-blue-700' : 'bg-muted/40'
              }`}>
                <div className="flex items-center gap-2">
                  <Factory className="h-4 w-4" />
                  <span className="font-medium">{plant.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{plant.code}</span>
                  {activePlant?.id === plant.id && <Badge variant="secondary" className="text-xs">Aktif</Badge>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
