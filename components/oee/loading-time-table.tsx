"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { OeeRow } from "@/types/oee-types"
import { ApiLine } from "@/types/api"

interface Props {
  data:       OeeRow[]
  lines:      ApiLine[]
  showDetail: boolean
}

const fmtH = (h: number) => `${h.toFixed(2)} h`

export function LoadingTimeTable({ data, lines, showDetail }: Props) {
  if (!data.length)
    return <div className="flex items-center justify-center h-32 text-muted-foreground text-sm border rounded-lg">Tidak ada data untuk filter yang dipilih.</div>

  return (
    <div className="overflow-x-auto border rounded-lg shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-emerald-700 hover:bg-emerald-700">
            <TableHead className="text-white font-semibold whitespace-nowrap" rowSpan={showDetail ? 2 : 1}>Tanggal</TableHead>
            {lines.map(l => (
              <TableHead key={l.id} className="text-white font-semibold text-center whitespace-nowrap" colSpan={showDetail ? 3 : 1}>
                {l.name}
              </TableHead>
            ))}
            <TableHead className="text-white font-semibold text-center whitespace-nowrap bg-emerald-900" colSpan={showDetail ? 3 : 1}>All Line</TableHead>
          </TableRow>
          {showDetail && (
            <TableRow className="bg-emerald-100">
              {lines.map(l => (
                <>
                  <TableHead key={`${l.id}-tt`} className="text-emerald-800 text-xs text-center">Total</TableHead>
                  <TableHead key={`${l.id}-sl`} className="text-emerald-800 text-xs text-center">Sched. Loss</TableHead>
                  <TableHead key={`${l.id}-lt`} className="text-emerald-800 text-xs text-center font-bold">Loading</TableHead>
                </>
              ))}
              <TableHead className="text-emerald-800 text-xs text-center">Total</TableHead>
              <TableHead className="text-emerald-800 text-xs text-center">Sched. Loss</TableHead>
              <TableHead className="text-emerald-800 text-xs text-center font-bold">Loading</TableHead>
            </TableRow>
          )}
        </TableHeader>
        <TableBody>
          {data.map((row, i) => {
            const al = row.all_line
            const allSched = lines.reduce((s, l) => s + (row.lines[l.id]?.sched_loss_h ?? 0), 0)
            return (
              <TableRow key={i} className="hover:bg-muted/40 transition-colors">
                <TableCell className="font-medium text-gray-700 whitespace-nowrap">{row.date}</TableCell>
                {lines.map(l => {
                  const d = row.lines[l.id]
                  return showDetail ? (
                    <>
                      <TableCell key={`${l.id}-tt`} className="text-center text-xs text-gray-500">{d ? fmtH(d.total_h) : "—"}</TableCell>
                      <TableCell key={`${l.id}-sl`} className="text-center text-xs text-red-400">{d ? fmtH(d.sched_loss_h) : "—"}</TableCell>
                      <TableCell key={`${l.id}-lt`} className="text-center font-semibold text-emerald-700">{d ? fmtH(d.loading_h) : "—"}</TableCell>
                    </>
                  ) : (
                    <TableCell key={l.id} className="text-center font-semibold text-emerald-700">{d ? fmtH(d.loading_h) : "—"}</TableCell>
                  )
                })}
                {showDetail ? (
                  <>
                    <TableCell className="text-center text-xs text-gray-500 bg-emerald-50">{fmtH(al.total_h)}</TableCell>
                    <TableCell className="text-center text-xs text-red-400 bg-emerald-50">{fmtH(allSched)}</TableCell>
                    <TableCell className="text-center font-bold text-emerald-800 bg-emerald-50">{fmtH(al.loading_h)}</TableCell>
                  </>
                ) : (
                  <TableCell className="text-center font-bold text-emerald-800 bg-emerald-50">{fmtH(al.loading_h)}</TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
