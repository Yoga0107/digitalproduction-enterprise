"use client"

import { OeeGuard } from '@/components/oee/oee-guard'
import { Activity, Construction, Clock, BarChart2, TrendingUp, LineChart, Layers } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const metrics = [
  { label: "Loading Time",       icon: Clock,       color: "from-emerald-600 to-teal-500" },
  { label: "Operating Time",     icon: Activity,    color: "from-teal-600 to-cyan-500" },
  { label: "Availability Rate",  icon: BarChart2,   color: "from-cyan-600 to-emerald-500" },
  { label: "Performance Rate",   icon: TrendingUp,  color: "from-emerald-700 to-teal-600" },
  { label: "Quality Rate",       icon: LineChart,   color: "from-teal-700 to-cyan-600" },
]

export default function SummaryOeePage() {
  return (
    <OeeGuard section="view">
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50/30">

        {/* HERO */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-900 via-emerald-700 to-teal-600 px-8 py-10">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-white/5 -translate-x-1/2 translate-y-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Layers className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">OEE Data View</p>
              <h1 className="text-3xl font-bold text-white tracking-tight">Summary OEE</h1>
              <p className="text-white/70 text-sm mt-1">Ringkasan keseluruhan Overall Equipment Effectiveness</p>
            </div>
          </div>
        </div>

        {/* UNDER DEVELOPMENT BANNER */}
        <div className="p-8 space-y-6">

          <Card className="border-2 border-dashed border-amber-300 bg-amber-50/60">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-5 text-center">
              <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center">
                <Construction className="h-10 w-10 text-amber-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-amber-700">Under Development</h2>
                <p className="text-amber-600 mt-2 text-sm max-w-md">
                  Halaman Summary OEE sedang dalam tahap pengembangan.
                  Fitur ini akan segera tersedia dan akan menampilkan ringkasan
                  dari semua metrik OEE secara terintegrasi.
                </p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-200/60 rounded-full">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Coming Soon</span>
              </div>
            </CardContent>
          </Card>

          {/* Preview metric cards */}
          <div>
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-3">
              Metrik yang akan ditampilkan:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {metrics.map(({ label, icon: Icon, color }) => (
                <div
                  key={label}
                  className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${color} p-4 opacity-50 select-none`}
                >
                  <Icon className="h-5 w-5 text-white/70 mb-2" />
                  <p className="text-white text-xs font-semibold leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </OeeGuard>
  )
}
