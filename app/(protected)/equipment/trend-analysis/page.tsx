"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { canAccessEquipment } from "@/lib/oee-access"
import {
  TrendingUp, TrendingDown, Minus, BarChart3, Activity,
  Calendar, Filter, RefreshCw, ShieldOff, Download,
  ArrowUpRight, ArrowDownRight, ChevronRight, Info,
  Layers, CheckCircle2, Clock, Zap, AreaChart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api-client"

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimelinePoint {
  period:         string
  label:          string
  count:          number
  cumulative:     number
  verified_count: number
}

interface GrowthPoint {
  period:      string
  label:       string
  count:       number
  growth_rate: number
  trend:       "up" | "down" | "stable"
}

interface BreakdownSeries {
  group:  string
  label:  string
  total:  number
  series: { period: string; label: string; count: number }[]
}

interface TrendAnalysisData {
  period:        string
  group_by:      string
  total_records: number
  date_range:    { start: string | null; end: string | null }
  timeline:      TimelinePoint[]
  summary: {
    total_periods:  number
    avg_per_period: number
    max_per_period: number
    min_per_period: number
    overall_trend:  "increasing" | "decreasing" | "stable"
  }
  peak_period:  { period: string; label: string; count: number } | null
  growth_trend: GrowthPoint[]
  breakdown:    BreakdownSeries[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PERIOD_OPTIONS = [
  { value: "daily",     label: "Harian" },
  { value: "weekly",    label: "Mingguan" },
  { value: "monthly",   label: "Bulanan" },
  { value: "quarterly", label: "Per Kuartal" },
  { value: "yearly",    label: "Per Tahun" },
]

const GROUPBY_OPTIONS = [
  { value: "level",    label: "Level Hierarki" },
  { value: "sistem",   label: "Sistem" },
  { value: "bu",       label: "Business Unit" },
  { value: "verified", label: "Status Verifikasi" },
]

// Generate date range presets
const DATE_PRESETS = [
  { label: "30 Hari Terakhir",  days: 30 },
  { label: "90 Hari Terakhir",  days: 90 },
  { label: "6 Bulan Terakhir",  days: 180 },
  { label: "1 Tahun Terakhir",  days: 365 },
  { label: "2 Tahun Terakhir",  days: 730 },
  { label: "Semua Waktu",       days: 0 },
]

const GROUP_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#f97316", "#ec4899",
  "#14b8a6", "#6366f1",
]

const LEVEL_ORDER = ["sistem","sub_sistem","unit_mesin","bagian_mesin","spare_part"]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toIsoDate(date: Date): string {
  return date.toISOString().split("T")[0]
}

function getPresetRange(days: number): { start: string; end: string } | null {
  if (days === 0) return null
  const end   = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)
  return { start: toIsoDate(start), end: toIsoDate(end) }
}

// ─── Mini bar chart (pure CSS/SVG) ────────────────────────────────────────────

function MiniBarChart({ data, color = "#3b82f6" }: {
  data: { label: string; count: number }[]
  color?: string
}) {
  const maxVal = Math.max(...data.map(d => d.count), 1)
  const W = 600
  const H = 140
  const pad = { l: 40, r: 16, t: 12, b: 40 }
  const chartW = W - pad.l - pad.r
  const chartH = H - pad.t - pad.b
  const barW   = Math.max(8, Math.min(40, chartW / data.length - 4))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {/* Y-axis gridlines */}
      {[0, 0.25, 0.5, 0.75, 1].map(pct => {
        const y = pad.t + chartH - pct * chartH
        const val = Math.round(maxVal * pct)
        return (
          <g key={pct}>
            <line x1={pad.l} y1={y} x2={W - pad.r} y2={y}
              stroke="#e2e8f0" strokeWidth={1} strokeDasharray="3,3" />
            <text x={pad.l - 6} y={y + 4} fontSize={9} fill="#94a3b8" textAnchor="end">{val}</text>
          </g>
        )
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const x   = pad.l + (i / data.length) * chartW + (chartW / data.length - barW) / 2
        const pct = d.count / maxVal
        const bH  = Math.max(2, pct * chartH)
        const y   = pad.t + chartH - bH
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bH} rx={3} fill={color} opacity={0.85} />
            {data.length <= 24 && (
              <text x={x + barW / 2} y={H - pad.b + 12} fontSize={8} fill="#64748b"
                textAnchor="middle" transform={data.length > 12 ? `rotate(-45,${x + barW/2},${H - pad.b + 12})` : undefined}>
                {d.label.length > 8 ? d.label.slice(0, 8) : d.label}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ─── Area chart (cumulative) ──────────────────────────────────────────────────

function CumulativeAreaChart({ data }: { data: TimelinePoint[] }) {
  if (data.length === 0) return null
  const W = 600; const H = 160
  const pad = { l: 50, r: 16, t: 16, b: 36 }
  const chartW = W - pad.l - pad.r
  const chartH = H - pad.t - pad.b
  const maxVal = Math.max(...data.map(d => d.cumulative), 1)

  const pts = data.map((d, i) => ({
    x: pad.l + (i / (data.length - 1 || 1)) * chartW,
    y: pad.t + chartH - (d.cumulative / maxVal) * chartH,
    d,
  }))

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ")
  const areaPath = `${linePath} L ${pts[pts.length - 1].x},${pad.t + chartH} L ${pts[0].x},${pad.t + chartH} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map(pct => {
        const y = pad.t + chartH - pct * chartH
        return (
          <g key={pct}>
            <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#e2e8f0" strokeWidth={1} strokeDasharray="3,3" />
            <text x={pad.l - 6} y={y + 4} fontSize={9} fill="#94a3b8" textAnchor="end">
              {Math.round(maxVal * pct)}
            </text>
          </g>
        )
      })}
      <path d={areaPath} fill="url(#areaGrad)" />
      <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinejoin="round" />
      {/* Dot highlights for small datasets */}
      {data.length <= 30 && pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="#fff" stroke="#3b82f6" strokeWidth={1.5} />
      ))}
    </svg>
  )
}

// ─── Stacked bar chart for breakdown ─────────────────────────────────────────

function StackedBreakdownChart({
  breakdown, timeline,
}: {
  breakdown: BreakdownSeries[]
  timeline:  TimelinePoint[]
}) {
  if (!timeline.length || !breakdown.length) return null
  const W = 600; const H = 180
  const pad = { l: 44, r: 16, t: 12, b: 40 }
  const chartW = W - pad.l - pad.r
  const chartH = H - pad.t - pad.b

  // Max stacked value per period
  const maxStacked = Math.max(...timeline.map(tp => {
    return breakdown.reduce((sum, b) => {
      const pt = b.series.find(s => s.period === tp.period)
      return sum + (pt?.count ?? 0)
    }, 0)
  }), 1)

  const barW = Math.max(6, Math.min(36, chartW / timeline.length - 3))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {[0, 0.25, 0.5, 0.75, 1].map(pct => {
        const y = pad.t + chartH - pct * chartH
        return (
          <g key={pct}>
            <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#e2e8f0" strokeWidth={1} strokeDasharray="2,3" />
            <text x={pad.l - 6} y={y + 4} fontSize={8} fill="#94a3b8" textAnchor="end">
              {Math.round(maxStacked * pct)}
            </text>
          </g>
        )
      })}

      {timeline.map((tp, ti) => {
        const x = pad.l + (ti / timeline.length) * chartW + (chartW / timeline.length - barW) / 2
        let yOffset = pad.t + chartH

        const segments = breakdown.map((b, bi) => {
          const pt  = b.series.find(s => s.period === tp.period)
          const cnt = pt?.count ?? 0
          const bH  = (cnt / maxStacked) * chartH
          const y   = yOffset - bH
          yOffset  -= bH
          return { color: GROUP_COLORS[bi % GROUP_COLORS.length], y, bH, label: b.label, cnt }
        }).filter(s => s.bH > 0)

        return (
          <g key={ti}>
            {segments.map((seg, si) => (
              <rect key={si} x={x} y={seg.y} width={barW} height={seg.bH}
                rx={si === segments.length - 1 ? 3 : 0} fill={seg.color} opacity={0.8} />
            ))}
            {timeline.length <= 24 && (
              <text x={x + barW / 2} y={H - pad.b + 12} fontSize={8} fill="#64748b" textAnchor="middle"
                transform={timeline.length > 12 ? `rotate(-45,${x + barW/2},${H - pad.b + 12})` : undefined}>
                {tp.label.length > 7 ? tp.label.slice(0, 7) : tp.label}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ─── Growth Rate Row ──────────────────────────────────────────────────────────

function GrowthRow({ item, maxCount }: { item: GrowthPoint; maxCount: number }) {
  const pct  = maxCount > 0 ? (item.count / maxCount) * 100 : 0
  const isUp = item.trend === "up"
  const isDn = item.trend === "down"
  return (
    <div className="flex items-center gap-3 py-2 border-b last:border-0 hover:bg-slate-50 px-2 rounded transition-colors">
      <div className="w-28 shrink-0 text-xs text-slate-500 truncate">{item.label}</div>
      <div className="flex-1 relative h-5 bg-slate-100 rounded overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-blue-200 rounded transition-all duration-500"
          style={{ width: `${pct}%` }} />
        <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-slate-700">
          {item.count} data
        </span>
      </div>
      <div className={cn(
        "flex items-center gap-0.5 text-xs font-semibold w-16 justify-end shrink-0",
        isUp ? "text-emerald-600" : isDn ? "text-red-500" : "text-slate-400"
      )}>
        {isUp ? <ArrowUpRight className="h-3 w-3" />
          : isDn ? <ArrowDownRight className="h-3 w-3" />
          : <Minus className="h-3 w-3" />}
        {item.growth_rate !== 0 ? `${Math.abs(item.growth_rate)}%` : "—"}
      </div>
    </div>
  )
}

// ─── Access Denied ────────────────────────────────────────────────────────────

function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center px-4">
      <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
        <ShieldOff className="h-8 w-8 text-red-400" />
      </div>
      <div>
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Halaman ini hanya untuk <strong>Administrator</strong> dan <strong>Plant Manager</strong>.
        </p>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EquipmentTrendAnalysisPage() {
  const { user } = useAuth()

  const [period,       setPeriod]       = useState("monthly")
  const [groupBy,      setGroupBy]      = useState("level")
  const [presetDays,   setPresetDays]   = useState(365)
  const [activeTab,    setActiveTab]    = useState<"bar" | "cumulative" | "breakdown">("bar")
  const [loading,      setLoading]      = useState(false)
  const [data,         setData]         = useState<TrendAnalysisData | null>(null)
  const [error,        setError]        = useState<string | null>(null)

  if (!canAccessEquipment(user?.role)) return <AccessDenied />

  // ── Fetch data ─────────────────────────────────────────────────────────────

  const fetchTrend = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const range = presetDays > 0 ? getPresetRange(presetDays) : null
      const q = new URLSearchParams({ period, group_by: groupBy })
      if (range) {
        q.set("start_date", range.start)
        q.set("end_date",   range.end)
      }
      const result = await api.get<TrendAnalysisData>(`/api/v1/equipment/trend-analysis?${q}`)
      setData(result)
    } catch (e: any) {
      setError(e?.message ?? "Gagal memuat data trend")
    } finally {
      setLoading(false)
    }
  }, [period, groupBy, presetDays])

  useEffect(() => { fetchTrend() }, [fetchTrend])

  // ── Derived values ─────────────────────────────────────────────────────────

  const maxGrowthCount = useMemo(() =>
    data ? Math.max(...data.growth_trend.map(g => g.count), 1) : 1,
    [data]
  )

  const overallTrendMeta = useMemo(() => {
    if (!data) return null
    const t = data.summary.overall_trend
    if (t === "increasing") return { icon: TrendingUp,   color: "text-emerald-600", bg: "bg-emerald-50", label: "Meningkat",  badge: "bg-emerald-100 text-emerald-700" }
    if (t === "decreasing") return { icon: TrendingDown, color: "text-red-500",     bg: "bg-red-50",     label: "Menurun",    badge: "bg-red-100 text-red-700" }
    return                         { icon: Minus,        color: "text-slate-500",   bg: "bg-slate-50",   label: "Stabil",     badge: "bg-slate-100 text-slate-600" }
  }, [data])

  const sortedBreakdown = useMemo(() => {
    if (!data) return []
    if (groupBy === "level") {
      return [...data.breakdown].sort((a, b) =>
        LEVEL_ORDER.indexOf(a.group) - LEVEL_ORDER.indexOf(b.group)
      )
    }
    return data.breakdown
  }, [data, groupBy])

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-screen-xl mx-auto">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span>Equipment</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-700 font-medium">Trend Analysis</span>
          </div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Trend Analysis Pengumpulan Data
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Analisis seberapa banyak data equipment yang terkumpul dari waktu ke waktu
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchTrend} disabled={loading}
          className="gap-1.5 self-start sm:self-auto">
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <Card className="border border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold">Filter & Konfigurasi</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Period */}
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1.5 block uppercase tracking-wide">
                Granularitas Periode
              </label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Rentang waktu */}
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1.5 block uppercase tracking-wide">
                Rentang Waktu
              </label>
              <Select value={String(presetDays)} onValueChange={v => setPresetDays(Number(v))}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_PRESETS.map(p => (
                    <SelectItem key={p.days} value={String(p.days)}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Group by */}
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1.5 block uppercase tracking-wide">
                Kelompokkan Berdasarkan
              </label>
              <Select value={groupBy} onValueChange={setGroupBy}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GROUPBY_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Error ─────────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <Info className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      {/* ── Loading skeleton ───────────────────────────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* ── Content ───────────────────────────────────────────────────────── */}
      {!loading && data && (
        <>
          {/* ── KPI Cards ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Records */}
            <Card className="border border-slate-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Total Data</p>
                    <p className="text-2xl font-bold text-slate-800">{data.total_records.toLocaleString()}</p>
                    <p className="text-xs text-slate-400 mt-0.5">equipment tercatat</p>
                  </div>
                  <div className="h-9 w-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                    <Layers className="h-4.5 w-4.5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rata-rata per periode */}
            <Card className="border border-slate-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Rata-rata/Periode</p>
                    <p className="text-2xl font-bold text-slate-800">{data.summary.avg_per_period}</p>
                    <p className="text-xs text-slate-400 mt-0.5">data per {PERIOD_OPTIONS.find(p => p.value === period)?.label.toLowerCase()}</p>
                  </div>
                  <div className="h-9 w-9 bg-violet-50 rounded-lg flex items-center justify-center shrink-0">
                    <Activity className="h-4.5 w-4.5 text-violet-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Peak period */}
            <Card className="border border-slate-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Periode Terbanyak</p>
                    <p className="text-xl font-bold text-slate-800 leading-tight">
                      {data.peak_period?.count.toLocaleString() ?? "—"}
                    </p>
                    <p className="text-xs text-amber-600 font-medium mt-0.5 truncate" title={data.peak_period?.label}>
                      {data.peak_period?.label ?? "—"}
                    </p>
                  </div>
                  <div className="h-9 w-9 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                    <Zap className="h-4.5 w-4.5 text-amber-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tren keseluruhan */}
            <Card className="border border-slate-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Tren Keseluruhan</p>
                    <p className={cn("text-xl font-bold mt-1", overallTrendMeta?.color)}>
                      {overallTrendMeta?.label}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{data.summary.total_periods} periode dianalisis</p>
                  </div>
                  {overallTrendMeta && (
                    <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", overallTrendMeta.bg)}>
                      <overallTrendMeta.icon className={cn("h-4.5 w-4.5", overallTrendMeta.color)} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Chart Tabs ─────────────────────────────────────────────────── */}
          <Card className="border border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="pb-0 border-b">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AreaChart className="h-4 w-4 text-blue-600" />
                  Visualisasi Trend
                </CardTitle>
                <div className="flex items-center border rounded-lg overflow-hidden text-xs">
                  {[
                    { key: "bar",        label: "Per Periode",   icon: BarChart3 },
                    { key: "cumulative", label: "Kumulatif",     icon: TrendingUp },
                    { key: "breakdown",  label: "Breakdown",     icon: Layers },
                  ].map(tab => (
                    <button key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={cn(
                        "flex items-center gap-1 px-3 py-1.5 transition-colors",
                        activeTab === tab.key
                          ? "bg-blue-600 text-white"
                          : "text-slate-600 hover:bg-slate-50"
                      )}>
                      <tab.icon className="h-3 w-3" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              {data.timeline.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  Tidak ada data dalam rentang waktu yang dipilih
                </div>
              ) : (
                <>
                  {activeTab === "bar" && (
                    <div>
                      <p className="text-xs text-slate-500 mb-3">
                        Jumlah data equipment yang ditambahkan per {PERIOD_OPTIONS.find(p => p.value === period)?.label.toLowerCase()}
                      </p>
                      <MiniBarChart
                        data={data.timeline.map(t => ({ label: t.label, count: t.count }))}
                        color="#3b82f6"
                      />
                    </div>
                  )}

                  {activeTab === "cumulative" && (
                    <div>
                      <p className="text-xs text-slate-500 mb-3">
                        Total kumulatif data equipment yang terkumpul dari waktu ke waktu
                      </p>
                      <CumulativeAreaChart data={data.timeline} />
                      <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <span className="inline-block w-3 h-3 rounded-full bg-blue-500" />
                          Total Kumulatif
                        </span>
                        <span>
                          Mulai: <strong>{data.timeline[0]?.label}</strong>
                          {" → "}
                          Akhir: <strong>{data.timeline[data.timeline.length - 1]?.label}</strong>
                        </span>
                      </div>
                    </div>
                  )}

                  {activeTab === "breakdown" && (
                    <div>
                      <p className="text-xs text-slate-500 mb-3">
                        Distribusi data per {GROUPBY_OPTIONS.find(g => g.value === groupBy)?.label.toLowerCase()} per periode
                      </p>
                      <StackedBreakdownChart breakdown={sortedBreakdown} timeline={data.timeline} />
                      {/* Legend */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {sortedBreakdown.map((b, i) => (
                          <div key={b.group} className="flex items-center gap-1.5 text-xs text-slate-600">
                            <span className="inline-block w-3 h-3 rounded"
                              style={{ backgroundColor: GROUP_COLORS[i % GROUP_COLORS.length] }} />
                            {b.label}
                            <Badge className="text-[10px] px-1 py-0 bg-slate-100 text-slate-600 hover:bg-slate-100">
                              {b.total}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* ── Two-column: Growth table + Breakdown table ─────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Growth per period */}
            <Card className="border border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Growth per Periode
                  <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 ml-auto text-[10px]">
                    {data.growth_trend.length} periode
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 max-h-72 overflow-y-auto">
                {data.growth_trend.length === 0 ? (
                  <p className="text-xs text-center text-slate-400 py-6">Tidak ada data</p>
                ) : (
                  data.growth_trend.map(g => (
                    <GrowthRow key={g.period} item={g} maxCount={maxGrowthCount} />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Breakdown by group */}
            <Card className="border border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="h-4 w-4 text-violet-600" />
                  Distribusi {GROUPBY_OPTIONS.find(g => g.value === groupBy)?.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 max-h-72 overflow-y-auto">
                {sortedBreakdown.length === 0 ? (
                  <p className="text-xs text-center text-slate-400 py-6">Tidak ada data</p>
                ) : (
                  sortedBreakdown.map((b, i) => {
                    const maxTotal = Math.max(...sortedBreakdown.map(x => x.total), 1)
                    const pct = (b.total / maxTotal) * 100
                    const pctOfAll = data.total_records > 0
                      ? ((b.total / data.total_records) * 100).toFixed(1)
                      : "0"
                    return (
                      <div key={b.group} className="py-2 border-b last:border-0 px-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-sm shrink-0"
                              style={{ backgroundColor: GROUP_COLORS[i % GROUP_COLORS.length] }} />
                            <span className="text-xs font-medium text-slate-700">{b.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">{pctOfAll}%</span>
                            <span className="text-xs font-semibold text-slate-700">{b.total.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: GROUP_COLORS[i % GROUP_COLORS.length],
                            }} />
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Peak & Info Banner ─────────────────────────────────────────── */}
          {data.peak_period && (
            <Card className="border border-amber-200 bg-amber-50/50 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                    <Zap className="h-4.5 w-4.5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Periode Paling Produktif</p>
                    <p className="text-sm text-amber-700 mt-0.5">
                      <strong>{data.peak_period.label}</strong> adalah periode dengan pengumpulan data terbanyak,
                      yaitu sebanyak <strong>{data.peak_period.count.toLocaleString()} data</strong> ditambahkan —
                      {data.summary.avg_per_period > 0 && (
                        <> {((data.peak_period.count / data.summary.avg_per_period - 1) * 100).toFixed(0)}% di atas rata-rata</>
                      )}.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Detail Tabel Timeline ──────────────────────────────────────── */}
          <Card className="border border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                Detail Per Periode
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 ml-auto text-[10px]">
                  {data.timeline.length} periode
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-auto max-h-72">
                <table className="w-full text-sm min-w-[600px]">
                  <thead className="bg-slate-50 sticky top-0 z-10 border-b">
                    <tr>
                      {["Periode", "Ditambahkan", "Terverifikasi Baru", "Kumulatif", "Growth"].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...data.timeline].reverse().map((row, i) => {
                      const growth = data.growth_trend.find(g => g.period === row.period)
                      const isPeak = data.peak_period?.period === row.period
                      return (
                        <tr key={row.period}
                          className={cn(
                            "border-t hover:bg-blue-50/30 transition-colors",
                            i % 2 === 0 ? "bg-white" : "bg-slate-50/50",
                            isPeak && "bg-amber-50/60 hover:bg-amber-50"
                          )}>
                          <td className="px-4 py-2.5 text-xs font-medium">
                            <div className="flex items-center gap-2">
                              {isPeak && <Zap className="h-3 w-3 text-amber-500 shrink-0" />}
                              {row.label}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-xs font-semibold text-blue-700">
                            {row.count.toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-emerald-600">
                            {row.verified_count > 0 ? `+${row.verified_count}` : "—"}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-slate-600">
                            {row.cumulative.toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5">
                            {growth && growth.growth_rate !== 0 ? (
                              <span className={cn(
                                "flex items-center gap-0.5 text-xs font-medium",
                                growth.trend === "up" ? "text-emerald-600" : "text-red-500"
                              )}>
                                {growth.trend === "up"
                                  ? <ArrowUpRight className="h-3 w-3" />
                                  : <ArrowDownRight className="h-3 w-3" />}
                                {Math.abs(growth.growth_rate)}%
                              </span>
                            ) : (
                              <span className="text-xs text-slate-300">—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ── Empty state ────────────────────────────────────────────────────── */}
      {!loading && !data && !error && (
        <div className="text-center py-20 text-slate-400 text-sm">
          Pilih filter dan klik Refresh untuk memuat data trend analysis
        </div>
      )}
    </div>
  )
}