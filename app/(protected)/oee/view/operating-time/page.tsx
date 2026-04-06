"use client"

import { OeeGuard } from '@/components/oee/oee-guard'
import { AlertCircle, Timer, RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { OperatingTimeTable } from "@/components/oee/operating-time-table"
import { useOeeMetrics } from '@/hooks/useOeeMetrics'
import { OeeFilterBar } from '@/components/oee/oee-filter-bar'

export default function OperatingTimePage() {
  const {
    dateFrom, setDateFrom, dateTo, setDateTo,
    groupBy, setGroupBy, showDetail, setShowDetail,
    rows, lines, loading, error, fetchData,
  } = useOeeMetrics()

  const allOps = rows.map(r => r.all_line.operating_h)
  const avg = allOps.length ? allOps.reduce((a, b) => a + b, 0) / allOps.length : null
  const min = allOps.length ? Math.min(...allOps) : null
  const max = allOps.length ? Math.max(...allOps) : null
  const fmtH = (v: number | null) => v === null ? "N/A" : `${v.toFixed(2)} h`

  return (
    <OeeGuard section="view">
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50/30">
        <div className="relative overflow-hidden bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-500 px-8 py-10">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="relative flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Timer className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">OEE Data View</p>
              <h1 className="text-3xl font-bold text-white tracking-tight">Operating Time</h1>
              <p className="text-white/70 text-sm mt-1">Loading Time − Σ Operating Losses</p>
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
                { label: "Rata-rata / hari", value: fmtH(avg), color: "text-teal-700"  },
                { label: "Minimum",          value: fmtH(min), color: "text-red-600"   },
                { label: "Maksimum",         value: fmtH(max), color: "text-cyan-700"  },
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
              <RefreshCw className="h-4 w-4 animate-spin" />Menghitung operating time...
            </div>
          ) : (
            <OperatingTimeTable data={rows} lines={lines} showDetail={showDetail} />
          )}

          <Card className="border border-teal-100 bg-teal-50/40 shadow-none">
            <CardContent className="p-4 text-xs text-teal-800 space-y-1">
              <p className="font-semibold text-teal-900 mb-2">📐 Formula</p>
              <p><span className="font-medium">Loading Time</span> = Total Time − Σ Scheduled Downtime</p>
              <p><span className="font-medium">Operating Losses</span> = semua Machine Loss selain Scheduled</p>
              <p><span className="font-medium">Operating Time</span> = Loading Time − Σ Operating Losses</p>
              <p><span className="font-medium">All Line</span> = Σ Operating Time semua line</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </OeeGuard>
  )
}
