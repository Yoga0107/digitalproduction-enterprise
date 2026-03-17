'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Plus, Clock, MapPin, Users } from 'lucide-react';

const upcoming = [
  { title: 'Daily Standup OEE',       time: '08:00',  date: 'Hari ini',      color: 'bg-emerald-500', tag: 'Meeting',    tagColor: 'bg-emerald-100 text-emerald-700' },
  { title: 'Review Laporan Produksi', time: '10:30',  date: 'Hari ini',      color: 'bg-teal-500',    tag: 'Review',     tagColor: 'bg-teal-100 text-teal-700'       },
  { title: 'Maintenance Line 3',      time: '13:00',  date: 'Besok',         color: 'bg-amber-500',   tag: 'Maintenance',tagColor: 'bg-amber-100 text-amber-700'      },
  { title: 'Rapat Bulanan',           time: '09:00',  date: 'Rabu, 19 Mar',  color: 'bg-cyan-500',    tag: 'Meeting',    tagColor: 'bg-cyan-100 text-cyan-700'        },
];

export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50/30">

      {/* HERO */}
      <div className="relative overflow-hidden bg-gradient-to-r from-cyan-700 via-teal-600 to-emerald-600 px-8 py-10">
        <div className="absolute -top-8 -right-8 h-44 w-44 rounded-full bg-white/5" />
        <div className="absolute top-4 right-48 h-16 w-16 rounded-full bg-white/5" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <CalendarIcon className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-cyan-200 text-xs font-semibold uppercase tracking-widest mb-1">Jadwal</p>
              <h1 className="text-3xl font-bold text-white tracking-tight">Calendar</h1>
              <p className="text-cyan-100 text-sm mt-1">Manage your schedule and events</p>
            </div>
          </div>
          <Button className="bg-white/20 backdrop-blur hover:bg-white/30 text-white border-white/30 border gap-2">
            <Plus className="h-4 w-4" />
            New Event
          </Button>
        </div>
      </div>

      <div className="p-8 space-y-6">

        {/* MINI STATS */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Event Hari Ini', value: '2', from: 'from-emerald-500', to: 'to-emerald-600' },
            { label: 'Minggu Ini',     value: '7', from: 'from-teal-500',    to: 'to-teal-600'    },
            { label: 'Bulan Ini',      value: '24',from: 'from-cyan-500',    to: 'to-cyan-600'    },
          ].map(({ label, value, from, to }) => (
            <div key={label} className={`rounded-2xl bg-gradient-to-br ${from} ${to} p-5 text-white shadow-sm`}>
              <p className="text-3xl font-bold">{value}</p>
              <p className="text-white/70 text-xs mt-1 font-medium">{label}</p>
            </div>
          ))}
        </div>

        {/* UPCOMING EVENTS */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400" />
          <CardHeader className="bg-teal-50/60">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-teal-600 flex items-center justify-center">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-emerald-900 text-base">Upcoming Events</CardTitle>
                <CardDescription className="text-xs">Your schedule for the next 7 days</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {upcoming.map(({ title, time, date, color, tag, tagColor }) => (
              <div key={title} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50/70 hover:bg-emerald-50/50 border border-transparent hover:border-emerald-100 transition-all cursor-pointer">
                <div className={`w-1 h-12 rounded-full flex-shrink-0 ${color}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-emerald-900 text-sm">{title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-slate-500"><Clock className="h-3 w-3" />{time}</span>
                    <span className="text-xs text-slate-400">{date}</span>
                  </div>
                </div>
                <Badge className={`text-xs flex-shrink-0 ${tagColor}`}>{tag}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* CALENDAR PLACEHOLDER */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-cyan-400" />
          <CardContent className="p-0">
            <div className="h-64 flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50/50 to-teal-50/50 gap-3">
              <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <CalendarIcon className="h-7 w-7 text-emerald-500" />
              </div>
              <p className="text-emerald-500 text-sm font-medium">Calendar view available for all roles</p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
