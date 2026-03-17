'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { canAccessMaster, canAccessInput } from '@/lib/oee-access';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Settings, Database, BarChart3, Timer, Factory,
  Package, Activity, Workflow, LineChart, BarChart2,
  TrendingUp, Clock, Lock, ChevronRight,
} from 'lucide-react';

function SectionCard({
  title, description, icon: Icon, links, locked, lockedMsg,
  headerFrom, headerTo, headerShadow, accentBg, accentText, numberBg,
}: {
  title: string;
  description: string;
  icon: any;
  links: { href: string; label: string; icon: any }[];
  locked?: boolean;
  lockedMsg?: string;
  headerFrom: string;
  headerTo: string;
  headerShadow: string;
  accentBg: string;
  accentText: string;
  numberBg: string;
}) {
  return (
    <div className={`rounded-2xl border-0 shadow-sm overflow-hidden ${locked ? 'opacity-60' : ''}`}>
      {/* Section Header */}
      <div className={`bg-gradient-to-r ${headerFrom} ${headerTo} px-6 py-5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base">{title}</h3>
              <p className="text-white/70 text-xs mt-0.5">{description}</p>
            </div>
          </div>
          {locked && (
            <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs gap-1">
              <Lock className="h-3 w-3" /> {lockedMsg}
            </Badge>
          )}
        </div>
      </div>

      {/* Links Grid */}
      <div className="bg-white px-6 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {links.map(({ href, label, icon: LinkIcon }, idx) =>
            locked ? (
              <div key={href} className="flex items-center gap-3 h-12 px-4 rounded-xl border border-slate-100 text-sm text-slate-400 cursor-not-allowed bg-slate-50/70">
                <Lock className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                <span>{label}</span>
              </div>
            ) : (
              <Link key={href} href={href}>
                <div className={`group flex items-center gap-3 h-12 px-4 rounded-xl border border-emerald-100 text-sm cursor-pointer transition-all hover:shadow-md hover:border-transparent hover:bg-gradient-to-r ${accentBg} bg-emerald-50/50`}>
                  <div className={`h-7 w-7 rounded-lg ${numberBg} flex items-center justify-center flex-shrink-0 group-hover:bg-white/25`}>
                    <LinkIcon className={`h-3.5 w-3.5 ${accentText} group-hover:text-white`} />
                  </div>
                  <span className={`font-medium ${accentText} group-hover:text-white flex-1`}>{label}</span>
                  <ChevronRight className={`h-3.5 w-3.5 ${accentText} opacity-0 group-hover:opacity-100 group-hover:text-white transition-opacity`} />
                </div>
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default function OEEPage() {
  const { user } = useAuth();
  const hasMaster = canAccessMaster(user?.role);
  const hasInput  = canAccessInput(user?.role);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50/30">

      {/* HERO */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-600 px-8 py-10">
        <div className="absolute -top-10 -right-10 h-52 w-52 rounded-full bg-white/5" />
        <div className="absolute top-6 right-40 h-20 w-20 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center flex-shrink-0">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          <div>
            <p className="text-emerald-300 text-xs font-semibold uppercase tracking-widest mb-1">Modul</p>
            <h1 className="text-3xl font-bold text-white tracking-tight">OEE Module</h1>
            <p className="text-emerald-200 text-sm mt-1">
              Overall Equipment Effectiveness — Plant {user?.role && (
                <Badge className="text-xs ml-1 bg-white/20 text-white border-white/30 hover:bg-white/30">{user.role}</Badge>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">

        {/* COUNTER BADGES */}
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Master Data', count: 5, color: 'bg-emerald-100 text-emerald-800' },
            { label: 'Input Data',  count: 2, color: 'bg-teal-100 text-teal-800'       },
            { label: 'Data View',   count: 6, color: 'bg-cyan-100 text-cyan-800'        },
          ].map(({ label, count, color }) => (
            <div key={label} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${color}`}>
              <span>{label}</span>
              <span className="h-5 w-5 rounded-full bg-white/60 flex items-center justify-center text-xs font-bold">{count}</span>
            </div>
          ))}
        </div>

        <SectionCard
          title="Master Data"
          description="Konfigurasi data master yang digunakan dalam kalkulasi OEE"
          icon={Settings}
          locked={!hasMaster}
          lockedMsg="Admin / Manager"
          headerFrom="from-emerald-600"
          headerTo="to-emerald-500"
          headerShadow="shadow-emerald-200"
          accentBg="hover:from-emerald-500 hover:to-emerald-600"
          accentText="text-emerald-700"
          numberBg="bg-emerald-100"
          links={[
            { href: '/oee/master/shift',              label: 'Master Shift',        icon: Timer    },
            { href: '/oee/master/line',               label: 'Master Line',         icon: Factory  },
            { href: '/oee/master/kode-pakan',         label: 'Kode Pakan',          icon: Package  },
            { href: '/oee/master/standard-throughput',label: 'Standard Throughput', icon: Activity },
            { href: '/oee/master/machine-losses',     label: 'Machine Losses',      icon: Workflow },
          ]}
        />

        <SectionCard
          title="Input Data"
          description="Input data operasional mesin harian"
          icon={Database}
          locked={!hasInput}
          lockedMsg="Admin / Manager / Operator"
          headerFrom="from-teal-600"
          headerTo="to-teal-500"
          headerShadow="shadow-teal-200"
          accentBg="hover:from-teal-500 hover:to-teal-600"
          accentText="text-teal-700"
          numberBg="bg-teal-100"
          links={[
            { href: '/oee/input/output',         label: 'Input Output',       icon: Activity },
            { href: '/oee/input/machine-losses', label: 'Input Machine Loss', icon: Factory  },
          ]}
        />

        <SectionCard
          title="Data View"
          description="Lihat dan analisa metrik OEE yang sudah terhitung"
          icon={BarChart3}
          locked={false}
          headerFrom="from-cyan-600"
          headerTo="to-teal-500"
          headerShadow="shadow-cyan-200"
          accentBg="hover:from-cyan-500 hover:to-teal-500"
          accentText="text-cyan-700"
          numberBg="bg-cyan-100"
          links={[
            { href: '/oee/view/loading-time',      label: 'Loading Time',      icon: Clock     },
            { href: '/oee/view/operating-time',    label: 'Operating Time',    icon: Timer     },
            { href: '/oee/view/availability-rate', label: 'Availability Rate', icon: BarChart2 },
            { href: '/oee/view/performance-rate',  label: 'Performance Rate',  icon: TrendingUp},
            { href: '/oee/view/quality-rate',      label: 'Quality Rate',      icon: LineChart },
            { href: '/oee/view/summary',           label: 'Summary OEE',       icon: BarChart3 },
          ]}
        />

      </div>
    </div>
  );
}
