"use client"

import { OeeGuard } from '@/components/oee/oee-guard'
import { AlertCircle, Clock, RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { LoadingTimeTable } from "@/components/oee/loading-time-table"
import { useOeeMetrics } from '@/hooks/useOeeMetrics'
import { OeeFilterBar } from '@/components/oee/oee-filter-bar'

export default function LoadingTimePage() {
  const {
    dateFrom, setDateFrom, dateTo, setDateTo,
    groupBy, setGroupBy, showDetail, setShowDetail,
    rows, lines, loading, error, fetchData,
  } = useOeeMetrics()

  const allLoadings = rows.map(r => r.all_line.loading_h)
  const avg = allLoadings.length ? allLoadings.reduce((a, b) => a + b, 0) / allLoadings.length : null
  const min = allLoadings.length ? Math.min(...allLoadings) : null
  const max = allLoadings.length ? Math.max(...allLoadings) : null
  const fmtH = (v: number | null) => v === null ? "N/A" : `${v.toFixed(2)} h`

  return (
    <OeeGuard section="view">
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50/30">
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-500 px-8 py-10">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="relative flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Clock className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">OEE Data View</p>
              <h1 className="text-3xl font-bold text-white tracking-tight">Loading Time</h1>
              <p className="text-white/70 text-sm mt-1">Total Time − Σ Scheduled Downtime</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <OeeFilterBar
            dateFrom={dateFrom} dateTo={dateTo} groupBy={groupBy}
            showDetail={showDetail} loading={loading}
            onDateFrom={setDateFrom} onDateTo={setDateTo} onGroupBy={setGroupBy}
            onToggleDetail={() => setShowDetail(v => !v)} onFetch={fetchData}
          />

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}

          {!loading && rows.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Rata-rata / hari", value: fmtH(avg), color: "text-emerald-700" },
                { label: "Minimum",          value: fmtH(min), color: "text-red-600"     },
                { label: "Maksimum",         value: fmtH(max), color: "text-teal-700"    },
              ].map(({ label, value, color }) => (
                <Card key={label} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{label} All Line</p>
                    <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-48 border rounded-lg text-muted-foreground text-sm gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />Menghitung loading time...
            </div>
          ) : (
            <LoadingTimeTable data={rows} lines={lines} showDetail={showDetail} />
          )}

          <Card className="border border-emerald-100 bg-emerald-50/40 shadow-none">
            <CardContent className="p-4 text-xs text-emerald-800 space-y-1">
              <p className="font-semibold text-emerald-900 mb-2">📐 Formula</p>
              <p><span className="font-medium">Total Time</span> = Σ durasi shift × jumlah hari aktif per line</p>
              <p><span className="font-medium">Scheduled Downtime</span> = Machine Loss L1 mengandung "Scheduled / Jadwal / Planned"</p>
              <p><span className="font-medium">Loading Time</span> = Total Time − Σ Scheduled Downtime</p>
              <p><span className="font-medium">All Line</span> = Σ Loading Time semua line</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </OeeGuard>
  )
}
