'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Server, HardDrive, ShieldAlert, CheckCircle2, Activity } from 'lucide-react';

const tables = ['users', 'projects', 'reports', 'analytics', 'settings'];
const tableColors = [
  { from: 'from-emerald-500', to: 'to-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'text-emerald-500' },
  { from: 'from-teal-500',    to: 'to-teal-600',    bg: 'bg-teal-50',    border: 'border-teal-200',    text: 'text-teal-700',    icon: 'text-teal-500'    },
  { from: 'from-cyan-500',    to: 'to-cyan-600',    bg: 'bg-cyan-50',    border: 'border-cyan-200',    text: 'text-cyan-700',    icon: 'text-cyan-500'    },
  { from: 'from-green-500',   to: 'to-green-600',   bg: 'bg-green-50',   border: 'border-green-200',   text: 'text-green-700',   icon: 'text-green-500'   },
  { from: 'from-emerald-600', to: 'to-teal-500',    bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'text-emerald-500' },
];

export default function DatabasePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50/30">

      {/* HERO */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 via-emerald-900 to-teal-800 px-8 py-10">
        <div className="absolute -top-10 -right-10 h-52 w-52 rounded-full bg-white/5" />
        <div className="absolute bottom-0 left-64 h-24 w-24 rounded-full bg-emerald-500/10" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Database className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-emerald-300 text-xs font-semibold uppercase tracking-widest mb-1">Sistem</p>
              <h1 className="text-3xl font-bold text-white tracking-tight">Database</h1>
              <p className="text-emerald-200 text-sm mt-1">Database management and monitoring</p>
            </div>
          </div>
          <Badge className="bg-red-500/80 text-white border-0 gap-1.5 px-3 py-1.5">
            <ShieldAlert className="h-3.5 w-3.5" /> Admin Only
          </Badge>
        </div>
      </div>

      <div className="p-8 space-y-8">

        {/* STAT CARDS */}
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-md shadow-emerald-200">
            <div className="flex items-start justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Database className="h-5 w-5" />
              </div>
              <CheckCircle2 className="h-4 w-4 text-emerald-200" />
            </div>
            <p className="text-3xl font-bold">45,231</p>
            <p className="text-emerald-200 text-xs mt-1 font-medium uppercase tracking-wide">Total Records</p>
            <p className="text-emerald-300 text-xs mt-0.5">Across all tables</p>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white shadow-md shadow-amber-200">
            <div className="flex items-start justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                <HardDrive className="h-5 w-5" />
              </div>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-semibold">78%</span>
            </div>
            <p className="text-3xl font-bold">24.5 GB</p>
            <p className="text-orange-200 text-xs mt-1 font-medium uppercase tracking-wide">Storage Used</p>
            <div className="mt-2 h-1.5 w-full bg-white/20 rounded-full">
              <div className="h-full w-4/5 bg-white/70 rounded-full" />
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 p-6 text-white shadow-md shadow-teal-200">
            <div className="flex items-start justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Server className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                <Activity className="h-3 w-3" /> Live
              </div>
            </div>
            <p className="text-3xl font-bold">127</p>
            <p className="text-teal-200 text-xs mt-1 font-medium uppercase tracking-wide">Active Connections</p>
            <p className="text-teal-300 text-xs mt-0.5">All connections healthy</p>
          </div>
        </div>

        {/* TABLE LIST */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />
          <CardHeader className="bg-emerald-50/60">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-700 flex items-center justify-center">
                <Database className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-emerald-900 text-base">Database Tables</CardTitle>
                <CardDescription className="text-xs">Overview of all database tables</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-2.5">
            {tables.map((table, idx) => {
              const c = tableColors[idx % tableColors.length];
              return (
                <div key={table} className={`flex items-center justify-between p-4 rounded-xl border ${c.border} ${c.bg} transition-all hover:shadow-sm cursor-pointer`}>
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${c.from} ${c.to} flex items-center justify-center shadow-sm`}>
                      <Database className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <span className={`font-semibold capitalize text-sm ${c.text}`}>{table}</span>
                      <p className="text-xs text-slate-400 mt-0.5">{Math.floor(Math.random() * 9000 + 1000).toLocaleString()} rows</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-400" />
                    <Badge variant="outline" className={`border ${c.border} ${c.text} text-xs`}>Active</Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
