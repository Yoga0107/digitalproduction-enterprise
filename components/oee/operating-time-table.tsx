"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { OeeRow } from "@/types/oee-types"
import { ApiLine } from "@/types/api"
import { ChevronDown, ChevronRight } from "lucide-react"

interface Props { data: OeeRow[]; lines: ApiLine[]; showDetail: boolean }

const fmtH = (h: number | undefined | null) =>
  h == null ? "—" : `${h.toFixed(2)} h`

export function OperatingTimeTable({ data, lines, showDetail }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const toggle = (key: string) =>
    setExpanded(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s })

  if (!data.length)
    return <div className="flex items-center justify-center h-32 text-muted-foreground text-sm border rounded-lg">Tidak ada data untuk filter yang dipilih.</div>

  const colsPerLine = showDetail ? 3 : 1
  const allLineColSpan = showDetail ? 3 : 1

  return (
    <div className="overflow-x-auto border rounded-lg shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-teal-700 hover:bg-teal-700">
            <TableHead className="text-white font-semibold whitespace-nowrap w-8" rowSpan={showDetail ? 2 : 1}></TableHead>
            <TableHead className="text-white font-semibold whitespace-nowrap" rowSpan={showDetail ? 2 : 1}>Tanggal</TableHead>
            {lines.map(l => (
              <TableHead key={l.id} className="text-white font-semibold text-center whitespace-nowrap" colSpan={colsPerLine}>
                {l.name}
              </TableHead>
            ))}
            <TableHead className="text-white font-semibold text-center whitespace-nowrap bg-teal-900" colSpan={allLineColSpan}>All Line</TableHead>
          </TableRow>
          {showDetail && (
            <TableRow className="bg-teal-100">
              {lines.map(l => (
                <>
                  <TableHead key={`${l.id}-ld`} className="text-teal-800 text-xs text-center">Loading</TableHead>
                  <TableHead key={`${l.id}-ol`} className="text-teal-800 text-xs text-center">Op. Loss</TableHead>
                  <TableHead key={`${l.id}-ot`} className="text-teal-800 text-xs text-center font-bold">Operating</TableHead>
                </>
              ))}
              <TableHead className="text-teal-800 text-xs text-center">Loading</TableHead>
              <TableHead className="text-teal-800 text-xs text-center">Op. Loss</TableHead>
              <TableHead className="text-teal-800 text-xs text-center font-bold">Operating</TableHead>
            </TableRow>
          )}
        </TableHeader>
        <TableBody>
          {data.map((row, i) => {
            const al = row.all_line
            const hasBreakdown = al.op_breakdown?.length > 0 ||
              lines.some(l => row.lines[l.id]?.op_breakdown?.length > 0)
            const isOpen = expanded.has(row.date)
            const totalCols = 2 + lines.length * colsPerLine + allLineColSpan

            return (
              <>
                <TableRow key={`r-${i}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="w-8 cursor-pointer text-center" onClick={() => hasBreakdown && toggle(row.date)}>
                    {hasBreakdown
                      ? (isOpen
                          ? <ChevronDown className="h-3.5 w-3.5 text-teal-600 mx-auto" />
                          : <ChevronRight className="h-3.5 w-3.5 text-teal-400 mx-auto" />)
                      : null}
                  </TableCell>
                  <TableCell className="font-medium text-gray-700 whitespace-nowrap">{row.date}</TableCell>
                  {lines.map(l => {
                    const d = row.lines[l.id]
                    return showDetail ? (
                      <>
                        <TableCell key={`${l.id}-ld`} className="text-center text-xs text-gray-500">{fmtH(d?.loading_h)}</TableCell>
                        <TableCell key={`${l.id}-ol`} className="text-center text-xs text-red-400">{fmtH(d?.op_loss_h)}</TableCell>
                        <TableCell key={`${l.id}-ot`} className="text-center font-semibold text-teal-700">{fmtH(d?.operating_h)}</TableCell>
                      </>
                    ) : (
                      <TableCell key={l.id} className="text-center font-semibold text-teal-700">{fmtH(d?.operating_h)}</TableCell>
                    )
                  })}
                  {showDetail ? (
                    <>
                      <TableCell className="text-center text-xs text-gray-500 bg-teal-50">{fmtH(al.loading_h)}</TableCell>
                      <TableCell className="text-center text-xs text-red-400 bg-teal-50">{fmtH(al.op_loss_h)}</TableCell>
                      <TableCell className="text-center font-bold text-teal-800 bg-teal-50">{fmtH(al.operating_h)}</TableCell>
                    </>
                  ) : (
                    <TableCell className="text-center font-bold text-teal-800 bg-teal-50">{fmtH(al.operating_h)}</TableCell>
                  )}
                </TableRow>

                {isOpen && (
                  <TableRow key={`bd-header-${i}`} className="bg-slate-50">
                    <TableCell colSpan={totalCols} className="py-1 px-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Detail Operating Losses</p>
                    </TableCell>
                  </TableRow>
                )}

                {isOpen && lines.map(l => {
                  const bd = row.lines[l.id]?.op_breakdown ?? []
                  if (!bd.length) return null
                  return (
                    <TableRow key={`bd-line-${l.id}-${i}`} className="bg-slate-50/50">
                      <TableCell colSpan={totalCols} className="py-0.5 px-4">
                        <p className="text-xs font-medium text-teal-700 mb-0.5">↳ {l.name}</p>
                        <div className="pl-3 space-y-0.5 mb-1">
                          {bd.map((item, idx) => (
                            <p key={idx} className="text-xs text-slate-500">
                              <span className="text-slate-400">{item.l1}</span>
                              {item.l2 && <><span className="mx-1 text-slate-300">›</span>{item.l2}</>}
                              {item.l3 && <><span className="mx-1 text-slate-300">›</span>{item.l3}</>}
                              <span className="ml-2 font-mono font-medium text-red-500">−{item.hours.toFixed(2)} h</span>
                            </p>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}

                {isOpen && al.op_breakdown?.length > 0 && (
                  <TableRow key={`bd-all-${i}`} className="bg-slate-50/50">
                    <TableCell colSpan={totalCols} className="py-0.5 px-4">
                      <p className="text-xs font-medium text-teal-900 mb-0.5">↳ All Line (Agregat)</p>
                      <div className="pl-3 space-y-0.5 mb-1">
                        {al.op_breakdown.map((item, idx) => (
                          <p key={idx} className="text-xs text-slate-500">
                            <span className="text-slate-400">{item.l1}</span>
                            {item.l2 && <><span className="mx-1 text-slate-300">›</span>{item.l2}</>}
                            {item.l3 && <><span className="mx-1 text-slate-300">›</span>{item.l3}</>}
                            <span className="ml-2 font-mono font-medium text-red-500">−{item.hours.toFixed(2)} h</span>
                          </p>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
