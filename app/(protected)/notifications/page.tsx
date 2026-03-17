'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, Info, CheckCircle2, AlertTriangle, MessageCircle } from 'lucide-react';

const notifications = [
  { id: 1, title: 'New user registered',          time: '5 minutes ago', read: false, type: 'info'    },
  { id: 2, title: 'Project milestone completed',  time: '1 hour ago',    read: false, type: 'success' },
  { id: 3, title: 'System maintenance scheduled', time: '3 hours ago',   read: true,  type: 'warning' },
  { id: 4, title: 'New message received',         time: '1 day ago',     read: true,  type: 'info'    },
];

const typeConfig: Record<string, { icon: any; bg: string; iconColor: string; dot: string; label: string; labelColor: string }> = {
  info:    { icon: Info,          bg: 'bg-cyan-50 border-cyan-200',    iconColor: 'text-cyan-600',    dot: 'bg-cyan-500',    label: 'Info',    labelColor: 'bg-cyan-100 text-cyan-700'    },
  success: { icon: CheckCircle2,  bg: 'bg-emerald-50 border-emerald-200', iconColor: 'text-emerald-600', dot: 'bg-emerald-500', label: 'Success', labelColor: 'bg-emerald-100 text-emerald-700' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50 border-amber-200',  iconColor: 'text-amber-600',   dot: 'bg-amber-400',   label: 'Warning', labelColor: 'bg-amber-100 text-amber-700'   },
};

export default function NotificationsPage() {
  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50/30">

      {/* HERO */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-600 px-8 py-10">
        <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center relative">
              <Bell className="h-7 w-7 text-white" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">{unread}</span>
              )}
            </div>
            <div>
              <p className="text-teal-200 text-xs font-semibold uppercase tracking-widest mb-1">Pusat Notifikasi</p>
              <h1 className="text-3xl font-bold text-white tracking-tight">Notifications</h1>
              <p className="text-teal-100 text-sm mt-1">{unread} notifikasi belum dibaca</p>
            </div>
          </div>
          <Button className="bg-white/20 backdrop-blur hover:bg-white/30 text-white border-white/30 border gap-2">
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        </div>
      </div>

      <div className="p-8 space-y-6">

        {/* SUMMARY BADGES */}
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Semua',    count: notifications.length, color: 'bg-emerald-600 text-white' },
            { label: 'Belum dibaca', count: unread, color: 'bg-red-100 text-red-700' },
            { label: 'Sudah dibaca', count: notifications.length - unread, color: 'bg-slate-100 text-slate-600' },
          ].map(({ label, count, color }) => (
            <div key={label} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium cursor-pointer ${color}`}>
              <span>{label}</span>
              <span className="h-5 w-5 rounded-full bg-white/30 flex items-center justify-center text-xs font-bold">{count}</span>
            </div>
          ))}
        </div>

        {/* NOTIFICATION LIST */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />
          <CardHeader className="bg-emerald-50/60">
            <CardTitle className="text-emerald-900 flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                <Bell className="h-4 w-4 text-white" />
              </div>
              All Notifications
            </CardTitle>
            <CardDescription>{unread} unread notifications</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {notifications.map((n) => {
              const cfg = typeConfig[n.type] ?? typeConfig.info;
              const Icon = cfg.icon;
              return (
                <div key={n.id} className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer hover:shadow-sm ${
                  !n.read ? cfg.bg : 'bg-white border-slate-100 hover:bg-slate-50/60'
                }`}>
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${!n.read ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
                    <Icon className={`h-5 w-5 ${!n.read ? cfg.iconColor : 'text-slate-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={`font-semibold text-sm ${!n.read ? 'text-emerald-900' : 'text-slate-700'}`}>{n.title}</p>
                      {!n.read && (
                        <div className={`h-2 w-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{n.time}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!n.read && (
                      <Badge className={`text-xs ${cfg.labelColor}`}>{cfg.label}</Badge>
                    )}
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
