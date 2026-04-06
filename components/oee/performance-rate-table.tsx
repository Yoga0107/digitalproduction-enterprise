"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { OeeRow } from "@/types/oee-types"
import { ApiLine } from "@/types/api"

interface Props {
  data:       OeeRow[]
  lines:      ApiLine[]
  showDetail: boolean
}

function rateColor(v: number | null): string {
  if (v === null) return "text-gray-400"
  if (v >= 95)   return "text-emerald-700"
  if (v >= 85)   return "text-yellow-600"
  return "text-red-600"
}

const fmtPct = (v: number | null) => v === null ? "—" : `${v.toFixed(1)}%`
const fmtQty = (v: number) => v.toLocaleString("id-ID")
const fmtH   = (v: number) => `${v.toFixed(2)}h`

export function PerformanceRateTable({ data, lines, showDetail }: Props) {
  if (!data.length)
    return <div className="flex items-center justify-center h-32 text-muted-foreground text-sm border rounded-lg">Tidak ada data untuk filter yang dipilih.</div>

  return (
    <div className="overflow-x-auto border rounded-lg shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-violet-700 hover:bg-violet-700">
            <TableHead className="text-white font-semibold whitespace-nowrap" rowSpan={showDetail ? 2 : 1}>Tanggal</TableHead>
            {lines.map(l => (
              <TableHead key={l.id} className="text-white font-semibold text-center whitespace-nowrap" colSpan={showDetail ? 4 : 1}>
                {l.name}
              </TableHead>
            ))}
            <TableHead className="text-white font-semibold text-center whitespace-nowrap bg-violet-900" colSpan={showDetail ? 4 : 1}>
              All Line
            </TableHead>
          </TableRow>
          {showDetail && (
            <TableRow className="bg-violet-100">
              {lines.map(l => (
                <>
                  <TableHead key={`${l.id}-ot`} className="text-violet-800 text-xs text-center">Op. Time</TableHead>
                  <TableHead key={`${l.id}-ac`} className="text-violet-800 text-xs text-center">Actual</TableHead>
                  <TableHead key={`${l.id}-id`} className="text-violet-800 text-xs text-center">Ideal</TableHead>
                  <TableHead key={`${l.id}-pr`} className="text-violet-800 text-xs text-center font-bold">Rate</TableHead>
                </>
              ))}
              <TableHead className="text-violet-800 text-xs text-center">Op. Time</TableHead>
              <TableHead className="text-violet-800 text-xs text-center">Actual</TableHead>
              <TableHead className="text-violet-800 text-xs text-center">Ideal</TableHead>
              <TableHead className="text-violet-800 text-xs text-center font-bold">Rate</TableHead>
            </TableRow>
          )}
        </TableHeader>
        <TableBody>
          {data.map((row, i) => {
            const al = row.all_line
            return (
              <TableRow key={i} className="hover:bg-muted/40 transition-colors">
                <TableCell className="font-medium text-gray-700 whitespace-nowrap">{row.date}</TableCell>
                {lines.map(l => {
                  const d = row.lines[l.id]
                  return showDetail ? (
                    <>
                      <TableCell key={`${l.id}-ot`} className="text-center text-xs text-gray-500">{d ? fmtH(d.operating_h) : "—"}</TableCell>
                      <TableCell key={`${l.id}-ac`} className="text-center text-xs text-gray-500">{d ? fmtQty(d.actual_output) : "—"}</TableCell>
                      <TableCell key={`${l.id}-id`} className="text-center text-xs text-gray-400">{d ? fmtQty(d.ideal_output) : "—"}</TableCell>
                      <TableCell key={`${l.id}-pr`} className={`text-center font-semibold ${d ? rateColor(d.performance) : "text-gray-400"}`}>{d ? fmtPct(d.performance) : "—"}</TableCell>
                    </>
                  ) : (
                    <TableCell key={l.id} className={`text-center font-semibold ${d ? rateColor(d.performance) : "text-gray-400"}`}>
                      {d ? fmtPct(d.performance) : "—"}
                    </TableCell>
                  )
                })}
                {showDetail ? (
                  <>
                    <TableCell className="text-center text-xs text-gray-500 bg-violet-50">{fmtH(al.operating_h)}</TableCell>
                    <TableCell className="text-center text-xs text-gray-500 bg-violet-50">{fmtQty(al.actual_output)}</TableCell>
                    <TableCell className="text-center text-xs text-gray-400 bg-violet-50">{fmtQty(al.ideal_output)}</TableCell>
                    <TableCell className={`text-center font-bold bg-violet-50 ${rateColor(al.performance)}`}>{fmtPct(al.performance)}</TableCell>
                  </>
                ) : (
                  <TableCell className={`text-center font-bold bg-violet-50 ${rateColor(al.performance)}`}>{fmtPct(al.performance)}</TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
