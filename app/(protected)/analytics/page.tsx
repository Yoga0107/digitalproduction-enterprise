'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, Activity, ArrowUpRight, Zap } from 'lucide-react';

const stats = [
  { label: 'Total Revenue', value: '$45,231', delta: '+20.1%', icon: TrendingUp, from: 'from-emerald-500', to: 'to-emerald-600', shadow: 'shadow-emerald-200', ring: 'bg-white/25' },
  { label: 'Active Users',  value: '2,350',   delta: '+180',   icon: Users,      from: 'from-teal-500',   to: 'to-teal-600',   shadow: 'shadow-teal-200',   ring: 'bg-white/25' },
  { label: 'Conversion',    value: '12.5%',   delta: '+2.3%',  icon: BarChart3,  from: 'from-cyan-500',   to: 'to-cyan-600',   shadow: 'shadow-cyan-200',   ring: 'bg-white/25' },
  { label: 'Engagement',    value: '89.2%',   delta: '+5.1%',  icon: Activity,   from: 'from-green-500',  to: 'to-green-600',  shadow: 'shadow-green-200',  ring: 'bg-white/25' },
];

const trends = [
  { label: 'Minggu ini',   value: '84%', width: 'w-5/6',  color: 'bg-emerald-500' },
  { label: 'Minggu lalu',  value: '76%', width: 'w-4/6',  color: 'bg-teal-400'    },
  { label: '2 minggu lalu',value: '65%', width: 'w-3/6',  color: 'bg-cyan-400'    },
  { label: '3 minggu lalu',value: '59%', width: 'w-2/5',  color: 'bg-emerald-300' },
];

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50/30">

      {/* HERO */}
      <div className="relative overflow-hidden bg-gradient-to-r from-teal-700 via-emerald-600 to-green-500 px-8 py-10">
        <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute bottom-0 right-24 h-20 w-20 rounded-full bg-white/5" />
        <div className="relative">
          <p className="text-teal-200 text-sm font-medium mb-1">Overview</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Analytics</h1>
          <p className="text-teal-100 text-sm mt-1">Data insights and performance metrics</p>
        </div>
      </div>

      <div className="p-8 space-y-8">

        {/* STAT CARDS */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ label, value, delta, icon: Icon, from, to, shadow, ring }) => (
            <div key={label} className={`rounded-2xl bg-gradient-to-br ${from} ${to} p-5 text-white shadow-md ${shadow}`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`h-10 w-10 rounded-xl ${ring} backdrop-blur flex items-center justify-center`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="flex items-center gap-1 text-xs font-semibold bg-white/20 px-2 py-1 rounded-full">
                  <ArrowUpRight className="h-3 w-3" />{delta}
                </span>
              </div>
              <p className="text-3xl font-bold">{value}</p>
              <p className="text-white/70 text-xs mt-1 font-medium uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>

        {/* TWO COLUMN ROW */}
        <div className="grid gap-6 md:grid-cols-5">

          {/* Trend bar chart */}
          <Card className="md:col-span-3 border-0 shadow-sm overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-teal-400" />
            <CardHeader className="bg-emerald-50/60">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-emerald-900 text-base">Performance Trend</CardTitle>
                  <CardDescription className="text-xs">Perbandingan 4 minggu terakhir</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              {trends.map(({ label, value, width, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-emerald-700 font-medium">{label}</span>
                    <span className="font-bold text-emerald-900">{value}</span>
                  </div>
                  <div className="h-2.5 w-full bg-emerald-100 rounded-full overflow-hidden">
                    <div className={`h-full ${width} ${color} rounded-full transition-all`} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Activity feed */}
          <Card className="md:col-span-2 border-0 shadow-sm overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-teal-400 to-cyan-400" />
            <CardHeader className="bg-teal-50/60">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-teal-600 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-emerald-900 text-base">Recent Activity</CardTitle>
                  <CardDescription className="text-xs">Aktivitas terbaru sistem</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {[
                { label: 'Data OEE diperbarui',   time: '2 mnt lalu',  dot: 'bg-emerald-500' },
                { label: 'User baru terdaftar',   time: '15 mnt lalu', dot: 'bg-teal-500'    },
                { label: 'Export Excel selesai',  time: '1 jam lalu',  dot: 'bg-cyan-500'    },
                { label: 'Backup database',       time: '3 jam lalu',  dot: 'bg-green-400'   },
                { label: 'Laporan bulanan dibuat',time: 'Kemarin',      dot: 'bg-emerald-300' },
              ].map(({ label, time, dot }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="mt-1.5 flex-shrink-0">
                    <div className={`h-2 w-2 rounded-full ${dot}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-emerald-900 truncate">{label}</p>
                    <p className="text-xs text-emerald-500">{time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>

        {/* CHART PLACEHOLDER */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400" />
          <CardHeader className="bg-gradient-to-r from-emerald-50/80 to-teal-50/60">
            <CardTitle className="text-emerald-900">Analytics Dashboard</CardTitle>
            <CardDescription>Detailed insights available only for Admin and Manager roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 gap-3">
              <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <BarChart3 className="h-7 w-7 text-emerald-500" />
              </div>
              <p className="text-emerald-500 text-sm font-medium">Chart visualization would go here</p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
