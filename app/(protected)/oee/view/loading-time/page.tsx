"use client"

import { OeeGuard } from '@/components/oee/oee-guard'
import { AlertCircle, Clock, RefreshCw, TrendingDown, Timer, Activity,
         ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingTimeTable } from "@/components/oee/loading-time-table"
import { useOeeMetrics } from '@/hooks/useOeeMetrics'
import { cn } from "@/lib/utils"

export default function LoadingTimePage() {
  const {
    dateFrom, setDateFrom,
    dateTo,   setDateTo,
    groupBy,  setGroupBy,
    rows, lines, loading, error,
    currentPage, totalPages, goToPage, pageLabel, cachedPages,
    fetchData,
  } = useOeeMetrics()

  // KPI dari current page
  const allShifts   = rows.flatMap(r => Object.values(r.all_line?.shifts ?? {}))
  const totalTime   = allShifts.reduce((a, s) => a + (s.total_h      ?? 0), 0)
  const totalSched  = allShifts.reduce((a, s) => a + (s.sched_loss_h ?? 0), 0)
  const totalLoad   = allShifts.reduce((a, s) => a + (s.loading_h    ?? 0), 0)
  const avgLoad     = allShifts.length ? totalLoad / allShifts.length : null
  const fmtH = (v: number | null) => v === null ? "—" : `${v.toFixed(2)} h`

  const canPrev = currentPage > 0
  const canNext = currentPage < totalPages - 1

  return (
    <OeeGuard section="view">
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50/30">

        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-600 px-8 py-10">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="relative flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Clock className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">OEE Data View</p>
              <h1 className="text-3xl font-bold text-white tracking-tight">Loading Time</h1>
              <p className="text-white/70 text-sm mt-1">
                Total Time (8h/shift)
              </p>
            </div>
            {totalPages > 0 && (
              <div className="ml-auto text-right">
                <p className="text-white/50 text-xs">Total Page</p>
                <p className="text-white font-semibold text-sm">{totalPages} halaman</p>
              </div>
            )}
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
                <Select value={groupBy} onValueChange={v => { setGroupBy(v as "daily" | "monthly"); fetchData() }}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily (7 hari/hal)</SelectItem>
                    <SelectItem value="monthly">Monthly (3 bln/hal)</SelectItem>
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
          {(rows.length > 0 || loading) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Time",          value: fmtH(totalTime),  icon: Timer,        color: "text-slate-700",   bg: "bg-slate-50"   },
                { label: "Total Sched. Loss",   value: fmtH(totalSched), icon: TrendingDown,  color: "text-red-600",    bg: "bg-red-50"     },
                { label: "Total Loading Time",  value: fmtH(totalLoad),  icon: Clock,         color: "text-emerald-700",bg: "bg-emerald-50" },
                { label: "Avg Loading / Shift", value: fmtH(avgLoad),    icon: Activity,      color: "text-teal-700",   bg: "bg-teal-50"    },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <Card key={label} className="border-0 shadow-sm overflow-hidden">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${bg}`}>
                      <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className={`text-xl font-bold tabular-nums mt-0.5 ${color}`}>
                        {loading ? <span className="text-slate-300 animate-pulse">—</span> : value}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination bar */}
          {totalPages > 0 && (
            <div className="flex items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-1.5">
                <Button size="icon" variant="outline" className="h-8 w-8 border-emerald-200"
                  onClick={() => goToPage(0)} disabled={!canPrev || loading}>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" className="h-8 w-8 border-emerald-200"
                  onClick={() => goToPage(currentPage - 1)} disabled={!canPrev || loading}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Page number pills */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => {
                    const isActive  = i === currentPage
                    const isCached  = cachedPages.includes(i)
                    const isNear    = Math.abs(i - currentPage) <= 2
                    const isEdge    = i === 0 || i === totalPages - 1
                    if (!isNear && !isEdge) {
                      if (i === currentPage - 3 || i === currentPage + 3) {
                        return <span key={i} className="text-slate-400 text-xs px-1">…</span>
                      }
                      return null
                    }
                    return (
                      <button
                        key={i}
                        onClick={() => goToPage(i)}
                        disabled={loading}
                        className={cn(
                          "h-8 min-w-[2rem] px-2.5 rounded-md text-xs font-medium transition-all relative",
                          isActive
                            ? "bg-emerald-700 text-white shadow-sm"
                            : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50",
                        )}
                      >
                        {i + 1}
                        {isCached && !isActive && (
                          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-400 border border-white" />
                        )}
                      </button>
                    )
                  })}
                </div>

                <Button size="icon" variant="outline" className="h-8 w-8 border-emerald-200"
                  onClick={() => goToPage(currentPage + 1)} disabled={!canNext || loading}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" className="h-8 w-8 border-emerald-200"
                  onClick={() => goToPage(totalPages - 1)} disabled={!canNext || loading}>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500">
                {loading && <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-500" />}
                <span className="font-medium text-emerald-800">
                  {pageLabel(currentPage)}
                </span>
                <Badge variant="outline" className="border-emerald-200 text-emerald-600 text-xs">
                  Hal {currentPage + 1} / {totalPages}
                </Badge>
                <span className="text-xs text-slate-400">
                  ({cachedPages.length} hal. ter-cache)
                </span>
              </div>
            </div>
          )}

          {/* Table */}
          {loading && rows.length === 0 ? (
            <div className="flex items-center justify-center h-48 border-2 border-dashed border-emerald-200 rounded-xl text-emerald-500 text-sm gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />Memuat halaman {currentPage + 1}...
            </div>
          ) : (
            <div className={cn("transition-opacity duration-200", loading ? "opacity-50 pointer-events-none" : "opacity-100")}>
              <LoadingTimeTable data={rows} lines={lines} />
            </div>
          )}

          {/* Bottom pagination (repeat) */}
          {totalPages > 1 && !loading && rows.length > 0 && (
            <div className="flex justify-center gap-2 pt-2">
              <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-700 gap-1"
                onClick={() => goToPage(currentPage - 1)} disabled={!canPrev}>
                <ChevronLeft className="h-3.5 w-3.5" /> Sebelumnya
              </Button>
              <span className="flex items-center px-3 text-sm text-slate-500">
                {pageLabel(currentPage)}
              </span>
              <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-700 gap-1"
                onClick={() => goToPage(currentPage + 1)} disabled={!canNext}>
                Berikutnya <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {/* Formula */}
          <Card className="border border-emerald-100 bg-gradient-to-r from-emerald-50/60 to-teal-50/40 shadow-none">
            <CardContent className="p-5 text-xs text-emerald-800 space-y-1.5">
              <p className="font-bold text-emerald-900 text-sm mb-2">📐 Formula Loading Time</p>
              <p><span className="font-semibold">Total Time</span> = 8 jam per shift (hardcode)</p>
              <p><span className="font-semibold">Scheduled Downtime</span> = Machine Loss L1 = <code className="bg-emerald-100 px-1 rounded">"Scheduled Downtime"</code></p>
              <p><span className="font-semibold">Loading Time</span> = Total Time − Σ Scheduled Downtime per (tanggal × line × shift)</p>
              <p><span className="font-semibold">Pagination</span> = 7 hari per halaman (daily) · 3 bulan per halaman (monthly) · cache otomatis per halaman · pre-fetch halaman berikutnya</p>
            </CardContent>
          </Card>

        </div>
      </div>
    </OeeGuard>
  )
}
