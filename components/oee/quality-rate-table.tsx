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
  if (v >= 98)   return "text-emerald-700"
  if (v >= 90)   return "text-yellow-600"
  return "text-red-600"
}

const fmtPct = (v: number | null) => v === null ? "—" : `${v.toFixed(1)}%`
const fmtQty = (v: number) => v.toLocaleString("id-ID")

export function QualityRateTable({ data, lines, showDetail }: Props) {
  if (!data.length)
    return <div className="flex items-center justify-center h-32 text-muted-foreground text-sm border rounded-lg">Tidak ada data untuk filter yang dipilih.</div>

  return (
    <div className="overflow-x-auto border rounded-lg shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-sky-700 hover:bg-sky-700">
            <TableHead className="text-white font-semibold whitespace-nowrap" rowSpan={showDetail ? 2 : 1}>Tanggal</TableHead>
            {lines.map(l => (
              <TableHead key={l.id} className="text-white font-semibold text-center whitespace-nowrap" colSpan={showDetail ? 3 : 1}>
                {l.name}
              </TableHead>
            ))}
            <TableHead className="text-white font-semibold text-center whitespace-nowrap bg-sky-900" colSpan={showDetail ? 3 : 1}>
              All Line
            </TableHead>
          </TableRow>
          {showDetail && (
            <TableRow className="bg-sky-100">
              {lines.map(l => (
                <>
                  <TableHead key={`${l.id}-ac`} className="text-sky-800 text-xs text-center">Actual</TableHead>
                  <TableHead key={`${l.id}-gp`} className="text-sky-800 text-xs text-center">Good Product</TableHead>
                  <TableHead key={`${l.id}-qr`} className="text-sky-800 text-xs text-center font-bold">Rate</TableHead>
                </>
              ))}
              <TableHead className="text-sky-800 text-xs text-center">Actual</TableHead>
              <TableHead className="text-sky-800 text-xs text-center">Good Product</TableHead>
              <TableHead className="text-sky-800 text-xs text-center font-bold">Rate</TableHead>
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
                      <TableCell key={`${l.id}-ac`} className="text-center text-xs text-gray-500">{d ? fmtQty(d.actual_output) : "—"}</TableCell>
                      <TableCell key={`${l.id}-gp`} className="text-center text-xs text-emerald-600">{d ? fmtQty(d.good_product) : "—"}</TableCell>
                      <TableCell key={`${l.id}-qr`} className={`text-center font-semibold ${d ? rateColor(d.quality) : "text-gray-400"}`}>{d ? fmtPct(d.quality) : "—"}</TableCell>
                    </>
                  ) : (
                    <TableCell key={l.id} className={`text-center font-semibold ${d ? rateColor(d.quality) : "text-gray-400"}`}>
                      {d ? fmtPct(d.quality) : "—"}
                    </TableCell>
                  )
                })}
                {showDetail ? (
                  <>
                    <TableCell className="text-center text-xs text-gray-500 bg-sky-50">{fmtQty(al.actual_output)}</TableCell>
                    <TableCell className="text-center text-xs text-emerald-600 bg-sky-50">{fmtQty(al.good_product)}</TableCell>
                    <TableCell className={`text-center font-bold bg-sky-50 ${rateColor(al.quality)}`}>{fmtPct(al.quality)}</TableCell>
                  </>
                ) : (
                  <TableCell className={`text-center font-bold bg-sky-50 ${rateColor(al.quality)}`}>{fmtPct(al.quality)}</TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
