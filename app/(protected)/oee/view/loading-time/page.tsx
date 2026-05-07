"use client"

import { OeeGuard } from '@/components/oee/oee-guard'
import { AlertCircle, Clock, RefreshCw, TrendingDown, Timer, Activity } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingTimeTable } from "@/components/oee/loading-time-table"
import { useOeeMetrics } from '@/hooks/useOeeMetrics'

export default function LoadingTimePage() {
  const {
    dateFrom, setDateFrom,
    dateTo,   setDateTo,
    groupBy,  setGroupBy,
    rows, lines, loading, error, fetchData,
  } = useOeeMetrics()

  // KPI cards — aggregate all_line across all buckets
  const allLoadings   = rows.flatMap(r =>
    Object.values(r.all_line?.shifts ?? {}).map(s => s.loading_h)
  )
  const allSchedLoss  = rows.flatMap(r =>
    Object.values(r.all_line?.shifts ?? {}).map(s => s.sched_loss_h)
  )
  const totalLoading  = allLoadings.reduce((a, b) => a + b, 0)
  const totalSchedLoss= allSchedLoss.reduce((a, b) => a + b, 0)
  const totalTime     = rows.flatMap(r =>
    Object.values(r.all_line?.shifts ?? {}).map(s => s.total_h)
  ).reduce((a, b) => a + b, 0)
  const avgLoading    = allLoadings.length ? totalLoading / allLoadings.length : null
  const fmtH = (v: number | null) => v === null ? "N/A" : `${v.toFixed(2)} h`

  return (
    <OeeGuard section="view">
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50/30">

        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-600 px-8 py-10">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="relative flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shadow-inner">
              <Clock className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">OEE Data View</p>
              <h1 className="text-3xl font-bold text-white tracking-tight">Loading Time</h1>
              <p className="text-white/70 text-sm mt-1">
                Total Time (8h/shift) − Σ Scheduled Downtime — breakdown per tanggal, line, dan shift
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">

          {/* Filter */}
          <Card className="border-0 shadow-sm">
            <CardContent className="flex flex-wrap items-end gap-4 pt-5 pb-5">
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1.5">Dari Tanggal</p>
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1.5">Sampai Tanggal</p>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1.5">Group By</p>
                <Select value={groupBy} onValueChange={v => setGroupBy(v as "daily" | "monthly")}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={fetchData} disabled={loading}
                className="bg-gradient-to-r from-emerald-700 to-teal-600 hover:from-emerald-800 hover:to-teal-700 text-white gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Memuat..." : "Tampilkan"}
              </Button>
            </CardContent>
          </Card>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}

          {/* KPI Cards */}
          {!loading && rows.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Time",         value: fmtH(totalTime),      icon: Timer,        color: "text-slate-700",   bg: "bg-slate-50"   },
                { label: "Total Sched. Loss",  value: fmtH(totalSchedLoss), icon: TrendingDown,  color: "text-red-600",    bg: "bg-red-50"     },
                { label: "Total Loading Time", value: fmtH(totalLoading),   icon: Clock,         color: "text-emerald-700",bg: "bg-emerald-50" },
                { label: "Avg Loading / Shift",value: fmtH(avgLoading),     icon: Activity,      color: "text-teal-700",   bg: "bg-teal-50"    },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <Card key={label} className="border-0 shadow-sm overflow-hidden">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${bg}`}>
                      <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className={`text-xl font-bold tabular-nums mt-0.5 ${color}`}>{value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center h-48 border-2 border-dashed border-emerald-200 rounded-xl text-emerald-500 text-sm gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />Menghitung loading time per shift...
            </div>
          ) : (
            <LoadingTimeTable data={rows} lines={lines} />
          )}

          {/* Formula */}
          <Card className="border border-emerald-100 bg-gradient-to-r from-emerald-50/60 to-teal-50/40 shadow-none">
            <CardContent className="p-5 text-xs text-emerald-800 space-y-1.5">
              <p className="font-bold text-emerald-900 text-sm mb-2">📐 Formula Loading Time</p>
              <p><span className="font-semibold">Total Time</span> = 8 jam per shift (hardcode, sesuai notebook)</p>
              <p><span className="font-semibold">Scheduled Downtime</span> = Machine Loss dengan L1 = <code className="bg-emerald-100 px-1 rounded">"Scheduled Downtime"</code></p>
              <p><span className="font-semibold">Loading Time</span> = Total Time − Σ Scheduled Downtime per (tanggal, line, shift)</p>
              <p><span className="font-semibold">Tampilan</span> = flat per baris (1 baris = 1 tanggal × 1 line × 1 shift)</p>
              <p className="text-emerald-600 italic pt-1">
                Klik ikon ▾ pada baris yang ada scheduled loss untuk melihat detail breakdown L1 → L2 → L3.
                Kolom header bisa diklik untuk sorting. Filter line dan pencarian tersedia di atas tabel.
              </p>
            </CardContent>
          </Card>

        </div>
      </div>
    </OeeGuard>
  )
}
