"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { OeeRow } from "@/types/oee-types"
import { ApiLine } from "@/types/api"

interface Props { data: OeeRow[]; lines: ApiLine[] }

const fmtH = (h: number | undefined | null) =>
  h == null ? "—" : `${h.toFixed(2)} h`

export function TotalTimeTable({ data, lines }: Props) {
  if (!data.length)
    return <div className="flex items-center justify-center h-32 text-muted-foreground text-sm border rounded-lg">Tidak ada data untuk filter yang dipilih.</div>

  return (
    <div className="overflow-x-auto border rounded-lg shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-violet-700 hover:bg-violet-700">
            <TableHead className="text-white font-semibold whitespace-nowrap">Tanggal</TableHead>
            {lines.map(l => (
              <TableHead key={l.id} className="text-white font-semibold text-center whitespace-nowrap">
                {l.name}
              </TableHead>
            ))}
            <TableHead className="text-white font-semibold text-center whitespace-nowrap bg-violet-900">All Line</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, i) => {
            const allLineTotal = row.all_line.total_h
            return (
              <TableRow key={i} className="hover:bg-muted/40 transition-colors">
                <TableCell className="font-medium text-gray-700 whitespace-nowrap">{row.date}</TableCell>
                {lines.map(l => {
                  const d = row.lines[l.id]
                  return (
                    <TableCell key={l.id} className="text-center font-semibold text-violet-700">
                      {fmtH(d?.total_h)}
                    </TableCell>
                  )
                })}
                <TableCell className="text-center font-bold text-violet-900 bg-violet-50">
                  {fmtH(allLineTotal)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
