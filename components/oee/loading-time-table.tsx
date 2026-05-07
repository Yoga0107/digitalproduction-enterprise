"use client"

import { useState, useMemo } from "react"
import { OeeRow } from "@/types/oee-types"
import { ApiLine } from "@/types/api"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Search, ArrowUpDown, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface FlatRow {
  date:         string
  dateLabel:    string
  lineId:       number
  lineName:     string
  shiftId:      number
  shiftName:    string
  totalH:       number
  schedLossH:   number
  loadingH:     number
  breakdown:    { l1: string; l2: string; l3: string; hours: number }[]
}

type SortKey = "date" | "lineName" | "shiftName" | "loadingH"
type SortDir = "asc" | "desc"

interface Props {
  data:  OeeRow[]
  lines: ApiLine[]
}

function fmt(h: number) {
  return h.toFixed(2)
}

function dateLabel(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  })
}

export function LoadingTimeTable({ data, lines }: Props) {
  const [search,  setSearch]  = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("date")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [lineFilter, setLineFilter] = useState<number | null>(null)

  // Flatten all rows: date × line × shift
  const flat = useMemo<FlatRow[]>(() => {
    const rows: FlatRow[] = []
    for (const row of data) {
      for (const line of lines) {
        const ld = row.lines?.[line.id]
        if (!ld?.shifts) continue
        for (const [sidStr, sd] of Object.entries(ld.shifts)) {
          const sid = Number(sidStr)
          rows.push({
            date:       row.date,
            dateLabel:  dateLabel(row.date),
            lineId:     line.id,
            lineName:   line.name,
            shiftId:    sid,
            shiftName:  sd.shift_name,
            totalH:     sd.total_h      ?? 8,
            schedLossH: sd.sched_loss_h ?? 0,
            loadingH:   sd.loading_h    ?? 8,
            breakdown:  sd.sched_breakdown ?? [],
          })
        }
      }
    }
    return rows
  }, [data, lines])

  // Filter
  const filtered = useMemo(() => {
    let r = flat
    if (lineFilter !== null) r = r.filter(row => row.lineId === lineFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      r = r.filter(row =>
        row.dateLabel.toLowerCase().includes(q) ||
        row.lineName.toLowerCase().includes(q) ||
        row.shiftName.toLowerCase().includes(q)
      )
    }
    return r
  }, [flat, lineFilter, search])

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0
      if (sortKey === "date")      cmp = a.date.localeCompare(b.date) || a.lineId - b.lineId || a.shiftId - b.shiftId
      if (sortKey === "lineName")  cmp = a.lineName.localeCompare(b.lineName) || a.date.localeCompare(b.date) || a.shiftId - b.shiftId
      if (sortKey === "shiftName") cmp = a.shiftName.localeCompare(b.shiftName) || a.date.localeCompare(b.date) || a.lineId - b.lineId
      if (sortKey === "loadingH")  cmp = a.loadingH - b.loadingH
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortKey(key); setSortDir("asc") }
  }

  function toggleExpand(key: string) {
    setExpandedRows(prev => {
      const s = new Set(prev)
      s.has(key) ? s.delete(key) : s.add(key)
      return s
    })
  }

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? sortDir === "asc"
        ? <ChevronUp   className="h-3 w-3 ml-1 inline text-emerald-300" />
        : <ChevronDown className="h-3 w-3 ml-1 inline text-emerald-300" />
      : <ArrowUpDown className="h-3 w-3 ml-1 inline text-white/40" />

  // Summary stats
  const totalRows  = sorted.length
  const withLoss   = sorted.filter(r => r.schedLossH > 0).length
  const avgLoading = totalRows ? sorted.reduce((a, r) => a + r.loadingH, 0) / totalRows : 0

  if (!data.length) return (
    <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-emerald-200 rounded-xl text-emerald-400 gap-2">
      <Search className="h-8 w-8 opacity-40" />
      <p className="text-sm">Tidak ada data. Pilih rentang tanggal lalu klik Tampilkan.</p>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* ── Controls ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
          <Input
            placeholder="Cari tanggal, line, atau shift..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 border-emerald-200 focus-visible:ring-emerald-400"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm" variant={lineFilter === null ? "default" : "outline"}
            className={cn("text-xs", lineFilter === null ? "bg-emerald-700 hover:bg-emerald-800" : "border-emerald-200 text-emerald-700")}
            onClick={() => setLineFilter(null)}
          >
            Semua Line
          </Button>
          {lines.map(l => (
            <Button
              key={l.id}
              size="sm"
              variant={lineFilter === l.id ? "default" : "outline"}
              className={cn("text-xs", lineFilter === l.id ? "bg-emerald-700 hover:bg-emerald-800" : "border-emerald-200 text-emerald-700")}
              onClick={() => setLineFilter(lineFilter === l.id ? null : l.id)}
            >
              {l.name}
            </Button>
          ))}
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div className="flex items-center gap-6 px-4 py-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-700">
        <span><span className="font-bold text-emerald-900">{totalRows}</span> baris ditampilkan</span>
        <span><span className="font-bold text-emerald-900">{fmt(avgLoading)} h</span> rata-rata loading time</span>
        {withLoss > 0 && (
          <span className="flex items-center gap-1 text-amber-600">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="font-bold">{withLoss}</span> shift dengan scheduled downtime
          </span>
        )}
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Sticky header */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-emerald-800 text-white">
                <th className="w-8 px-3 py-3" />
                <th
                  className="px-4 py-3 text-left font-semibold cursor-pointer select-none whitespace-nowrap hover:bg-emerald-700 transition-colors"
                  onClick={() => toggleSort("date")}
                >
                  Tanggal <SortIcon k="date" />
                </th>
                <th
                  className="px-4 py-3 text-left font-semibold cursor-pointer select-none whitespace-nowrap hover:bg-emerald-700 transition-colors"
                  onClick={() => toggleSort("lineName")}
                >
                  Line <SortIcon k="lineName" />
                </th>
                <th
                  className="px-4 py-3 text-left font-semibold cursor-pointer select-none whitespace-nowrap hover:bg-emerald-700 transition-colors"
                  onClick={() => toggleSort("shiftName")}
                >
                  Shift <SortIcon k="shiftName" />
                </th>
                <th className="px-4 py-3 text-right font-semibold whitespace-nowrap text-white/80 text-xs">
                  Total Time (h)
                </th>
                <th className="px-4 py-3 text-right font-semibold whitespace-nowrap text-white/80 text-xs">
                  Sched. Loss (h)
                </th>
                <th
                  className="px-4 py-3 text-right font-semibold cursor-pointer select-none whitespace-nowrap bg-emerald-900 hover:bg-emerald-950 transition-colors"
                  onClick={() => toggleSort("loadingH")}
                >
                  Loading Time (h) <SortIcon k="loadingH" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 text-sm">
                    Tidak ada data yang cocok dengan filter.
                  </td>
                </tr>
              ) : sorted.map((row, idx) => {
                const rowKey = `${row.date}-${row.lineId}-${row.shiftId}`
                const isExpanded = expandedRows.has(rowKey)
                const hasBreakdown = row.breakdown.length > 0
                const isLossRow = row.schedLossH > 0
                const isZero    = row.loadingH === 0

                return (
                  <>
                    <tr
                      key={rowKey}
                      className={cn(
                        "group transition-colors",
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/50",
                        isLossRow && "bg-amber-50/40",
                        isZero     && "bg-red-50/30",
                        "hover:bg-emerald-50/70"
                      )}
                    >
                      {/* Expand button */}
                      <td className="w-8 px-3 text-center">
                        {hasBreakdown ? (
                          <button
                            onClick={() => toggleExpand(rowKey)}
                            className="text-emerald-400 hover:text-emerald-700 transition-colors"
                          >
                            {isExpanded
                              ? <ChevronUp   className="h-3.5 w-3.5" />
                              : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                        ) : null}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap tabular-nums">
                        {row.dateLabel}
                      </td>

                      {/* Line */}
                      <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                        {row.lineName}
                      </td>

                      {/* Shift */}
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="border-emerald-200 text-emerald-700 font-normal text-xs">
                          {row.shiftName}
                        </Badge>
                      </td>

                      {/* Total Time */}
                      <td className="px-4 py-3 text-right font-mono text-slate-400 text-sm tabular-nums">
                        {fmt(row.totalH)}
                      </td>

                      {/* Scheduled Loss */}
                      <td className="px-4 py-3 text-right font-mono text-sm tabular-nums">
                        {row.schedLossH > 0 ? (
                          <span className="text-red-500 font-medium">−{fmt(row.schedLossH)}</span>
                        ) : (
                          <span className="text-slate-300">0.00</span>
                        )}
                      </td>

                      {/* Loading Time */}
                      <td className="px-4 py-3 text-right bg-emerald-50/80 group-hover:bg-emerald-100/60 transition-colors">
                        <span className={cn(
                          "font-mono font-bold text-sm tabular-nums",
                          isZero         ? "text-red-500"     :
                          row.loadingH < row.totalH ? "text-amber-600" :
                          "text-emerald-700"
                        )}>
                          {fmt(row.loadingH)}
                        </span>
                      </td>
                    </tr>

                    {/* Breakdown detail */}
                    {isExpanded && hasBreakdown && (
                      <tr key={`${rowKey}-bd`} className="bg-amber-50/60 border-l-2 border-amber-300">
                        <td colSpan={7} className="px-8 py-3">
                          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">
                            Detail Scheduled Downtime — {row.lineName} / {row.shiftName}
                          </p>
                          <div className="space-y-1">
                            {row.breakdown.map((item, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                                <span className="text-slate-400">{item.l1}</span>
                                {item.l2 && <><span className="text-slate-300">›</span><span>{item.l2}</span></>}
                                {item.l3 && <><span className="text-slate-300">›</span><span>{item.l3}</span></>}
                                <span className="ml-auto font-mono font-medium text-red-500">−{item.hours.toFixed(2)} h</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>

            {/* Footer summary */}
            {sorted.length > 0 && (
              <tfoot>
                <tr className="bg-emerald-900 text-white text-sm font-semibold">
                  <td colSpan={4} className="px-4 py-3">Total ({totalRows} baris)</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {fmt(sorted.reduce((a, r) => a + r.totalH, 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-red-300">
                    {fmt(sorted.reduce((a, r) => a + r.schedLossH, 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums bg-emerald-950">
                    {fmt(sorted.reduce((a, r) => a + r.loadingH, 0))}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
