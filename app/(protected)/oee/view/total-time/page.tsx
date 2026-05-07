"use client"

import { OeeGuard } from '@/components/oee/oee-guard'
import { AlertCircle, Clock4, RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { TotalTimeTable } from "@/components/oee/total-time-table"
import { useOeeMetrics } from '@/hooks/useOeeMetrics'
import { OeeFilterBar } from '@/components/oee/oee-filter-bar'

export default function TotalTimePage() {
  const {
    dateFrom, setDateFrom, dateTo, setDateTo,
    groupBy, setGroupBy,
    rows, lines, loading, error, fetchData,
    showDetail, setShowDetail,
  } = useOeeMetrics()

  const allTotals = rows.map(r => r.all_line.total_h)
  const sum = allTotals.reduce((a, b) => a + b, 0)
  const avg = allTotals.length ? sum / allTotals.length : null
  const min = allTotals.length ? Math.min(...allTotals) : null
  const max = allTotals.length ? Math.max(...allTotals) : null
  const fmtH = (v: number | null) => v === null ? "N/A" : `${v.toFixed(2)} h`

  return (
    <OeeGuard section="view">
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50/30">
        <div className="relative overflow-hidden bg-gradient-to-r from-violet-700 via-violet-600 to-purple-500 px-8 py-10">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="relative flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Clock4 className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">OEE Data View</p>
              <h1 className="text-3xl font-bold text-white tracking-tight">Total Time</h1>
              <p className="text-white/70 text-sm mt-1">n_shifts × shift_hours × n_days — deterministik dari timeframe</p>
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
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Total Keseluruhan", value: fmtH(sum),  color: "text-violet-700" },
                { label: "Rata-rata / bucket", value: fmtH(avg), color: "text-violet-700" },
                { label: "Minimum",            value: fmtH(min), color: "text-red-600"    },
                { label: "Maksimum",           value: fmtH(max), color: "text-purple-700" },
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
              <RefreshCw className="h-4 w-4 animate-spin" />Menghitung total time...
            </div>
          ) : (
            <TotalTimeTable data={rows} lines={lines} />
          )}

          <Card className="border border-violet-100 bg-violet-50/40 shadow-none">
            <CardContent className="p-4 text-xs text-violet-800 space-y-1">
              <p className="font-semibold text-violet-900 mb-2">📐 Formula</p>
              <p><span className="font-medium">Total Time (harian)</span> = Σ shift_hours × 1 hari</p>
              <p><span className="font-medium">Total Time (bulanan)</span> = Σ shift_hours × jumlah hari dalam bulan</p>
              <p><span className="font-medium">Contoh 3 shift @8 jam</span> = 8 × 3 = 24 jam/hari</p>
              <p><span className="font-medium">All Line</span> = Σ Total Time semua line (non-merged-member)</p>
              <p className="text-violet-600 italic">Nilai ini deterministik — tidak bergantung pada ada/tidaknya data transaksi.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </OeeGuard>
  )
}
