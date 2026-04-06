"use client"

import { OeeGuard } from '@/components/oee/oee-guard'
import { AlertCircle, TrendingUp, RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { OeeFilterBar } from "@/components/oee/oee-filter-bar"
import { PerformanceRateTable } from "@/components/oee/performance-rate-table"
import { useOeeMetrics } from "@/hooks/useOeeMetrics"

export default function PerformanceRatePage() {
  const {
    dateFrom, setDateFrom, dateTo, setDateTo,
    groupBy, setGroupBy, showDetail, setShowDetail,
    rows, lines, loading, error, fetchData,
  } = useOeeMetrics()

  const allPerf = rows.map(r => r.all_line.performance).filter((v): v is number => v !== null)
  const avg = allPerf.length ? allPerf.reduce((a, b) => a + b, 0) / allPerf.length : null
  const min = allPerf.length ? Math.min(...allPerf) : null
  const max = allPerf.length ? Math.max(...allPerf) : null
  const fmtPct = (v: number | null) => v === null ? "N/A" : `${v.toFixed(1)}%`

  return (
    <OeeGuard section="view">
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50/30">
        <div className="relative overflow-hidden bg-gradient-to-r from-violet-800 via-violet-700 to-purple-600 px-8 py-10">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="relative flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <TrendingUp className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">OEE Data View</p>
              <h1 className="text-3xl font-bold text-white tracking-tight">Performance Rate</h1>
              <p className="text-white/70 text-sm mt-1">Actual Output ÷ Ideal Output × 100%</p>
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
                { label: "Rata-rata", value: fmtPct(avg), color: "text-violet-700" },
                { label: "Minimum",  value: fmtPct(min), color: "text-red-600"    },
                { label: "Maksimum", value: fmtPct(max), color: "text-purple-700" },
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
              <RefreshCw className="h-4 w-4 animate-spin" />Menghitung performance rate...
            </div>
          ) : (
            <PerformanceRateTable data={rows} lines={lines} showDetail={showDetail} />
          )}

          <Card className="border border-violet-100 bg-violet-50/40 shadow-none">
            <CardContent className="p-4 text-xs text-violet-800 space-y-1">
              <p className="font-semibold text-violet-900 mb-2">📐 Formula</p>
              <p><span className="font-medium">Ideal Output</span> = Operating Time (jam) × Standard Throughput (unit/jam)</p>
              <p><span className="font-medium">Actual Output</span> = Σ semua tipe output produksi</p>
              <p><span className="font-medium">Performance Rate</span> = Actual Output ÷ Ideal Output × 100%</p>
              <p><span className="font-medium">All Line</span> = Σ Actual semua line ÷ Σ Ideal semua line × 100%</p>
              <p className="text-violet-600 mt-2">* Standard Throughput diambil dari master data per line + feed code</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </OeeGuard>
  )
}
