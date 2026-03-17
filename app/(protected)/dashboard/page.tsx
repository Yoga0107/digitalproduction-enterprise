'use client';

import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Factory, ArrowLeftRight, ShieldCheck, Mail, User, Hash, Layers, TrendingUp, Activity, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ROLE_LABELS } from '@/lib/role-map';

export default function DashboardPage() {
  const { user, activePlant, accessiblePlants } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50/30">

      {/* ── HERO BANNER ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-500 px-8 py-10">
        {/* decorative circles */}
        <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute top-4 right-32 h-24 w-24 rounded-full bg-white/5" />
        <div className="absolute -bottom-6 right-16 h-32 w-32 rounded-full bg-teal-400/20" />

        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-emerald-200 text-sm font-medium mb-1">Selamat datang kembali 👋</p>
            <h1 className="text-3xl font-bold text-white tracking-tight">{user?.full_name ?? 'User'}</h1>
            <div className="flex items-center gap-2 mt-3">
              <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs px-3 py-1">
                {ROLE_LABELS[user?.role || 'viewer']}
              </Badge>
              {user?.is_superuser && (
                <Badge className="bg-amber-400/90 text-amber-900 border-0 text-xs px-3 py-1">
                  <ShieldCheck className="h-3 w-3 mr-1" /> Superuser
                </Badge>
              )}
            </div>
          </div>
          <div className="hidden md:flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <Factory className="h-10 w-10 text-white" />
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">

        {/* ── QUICK STATS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 text-white shadow-sm shadow-emerald-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">Plant Aktif</span>
              <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Factory className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold">{activePlant?.name ?? '—'}</p>
            <p className="text-emerald-200 text-xs mt-1">{activePlant?.code ?? 'Belum dipilih'}</p>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 p-5 text-white shadow-sm shadow-teal-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-teal-100 text-xs font-semibold uppercase tracking-wider">Akses Plant</span>
              <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Layers className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold">{accessiblePlants.length}</p>
            <p className="text-teal-200 text-xs mt-1">Plant tersedia</p>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 p-5 text-white shadow-sm shadow-cyan-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-cyan-100 text-xs font-semibold uppercase tracking-wider">Role</span>
              <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold capitalize">{user?.role ?? '—'}</p>
            <p className="text-cyan-200 text-xs mt-1">{ROLE_LABELS[user?.role || 'viewer']}</p>
          </div>
        </div>

        {/* ── PLANT AKTIF BANNER ── */}
        {activePlant && (
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-200">
                <Factory className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-emerald-500 font-semibold uppercase tracking-wider mb-0.5">Plant Sedang Aktif</p>
                <p className="font-bold text-emerald-900 text-lg">{activePlant.name}</p>
                <p className="text-xs text-emerald-600">Kode: <span className="font-semibold">{activePlant.code}</span> · Schema: <span className="font-semibold">{activePlant.schema_name}</span></p>
              </div>
            </div>
            {accessiblePlants.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-100 bg-white"
                onClick={() => router.push('/select-plant')}
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                Ganti Plant
              </Button>
            )}
          </div>
        )}

        {/* ── INFO CARDS ── */}
        <div className="grid gap-6 md:grid-cols-2">

          {/* Informasi Akun */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-teal-400" />
            <CardHeader className="bg-emerald-50/60 pb-3">
              <CardTitle className="text-emerald-900 flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                Informasi Akun
              </CardTitle>
              <CardDescription>Detail user yang sedang login</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-0">
              {[
                { label: 'User ID',      value: user?.id,        icon: Hash,        color: 'bg-slate-100 text-slate-600' },
                { label: 'Username',     value: user?.username,  icon: User,        color: 'bg-emerald-100 text-emerald-600' },
                { label: 'Email',        value: user?.email,     icon: Mail,        color: 'bg-teal-100 text-teal-600' },
                { label: 'Nama Lengkap', value: user?.full_name, icon: User,        color: 'bg-cyan-100 text-cyan-600' },
                { label: 'Role',         value: ROLE_LABELS[user?.role || 'viewer'], icon: ShieldCheck, color: 'bg-emerald-100 text-emerald-700' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="flex items-center justify-between py-2.5 border-b border-emerald-50 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-6 w-6 rounded-md flex items-center justify-center ${color}`}>
                      <Icon className="h-3 w-3" />
                    </div>
                    <span className="text-sm text-emerald-700">{label}</span>
                  </div>
                  <span className="text-sm font-semibold text-emerald-900">{String(value ?? '—')}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Plant List */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-teal-400 to-cyan-400" />
            <CardHeader className="bg-teal-50/60 pb-3">
              <CardTitle className="text-emerald-900 flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-teal-600 flex items-center justify-center">
                  <Layers className="h-4 w-4 text-white" />
                </div>
                Plant yang Dapat Diakses
              </CardTitle>
              <CardDescription>
                {accessiblePlants.length === 0 ? 'Belum ada akses plant' : `${accessiblePlants.length} plant tersedia`}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              {accessiblePlants.map((plant, idx) => {
                const isActive = activePlant?.id === plant.id;
                const colors = ['bg-emerald-600','bg-teal-600','bg-cyan-600','bg-green-600'];
                const bg = colors[idx % colors.length];
                return (
                  <div key={plant.id} className={`flex items-center justify-between rounded-xl px-4 py-3 transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 shadow-sm'
                      : 'bg-slate-50 hover:bg-emerald-50/50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-xl ${bg} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                        {plant.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-emerald-900">{plant.name}</p>
                        <p className="text-xs text-emerald-500">{plant.code}</p>
                      </div>
                    </div>
                    {isActive && <Badge className="text-xs bg-emerald-600 text-white shadow-sm">Aktif</Badge>}
                  </div>
                );
              })}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
