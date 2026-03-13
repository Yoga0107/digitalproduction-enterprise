"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"

import { PerformanceRow } from "@/types/performance-types"

type Props = {
  data: PerformanceRow[]
}

export function PerformanceRateTable({ data }: Props) {

  return (

    <div className="border rounded-lg">

      <Table>

        <TableHeader>

          <TableRow>

            <TableHead>Date</TableHead>
            <TableHead className="text-center">Line 1</TableHead>
            <TableHead className="text-center">Line 2</TableHead>
            <TableHead className="text-center">Line 3A & 3B</TableHead>
            <TableHead className="text-center">Line 4</TableHead>
            <TableHead className="text-center">Line 5</TableHead>
            <TableHead className="text-center">Line 6A & 6B</TableHead>
            <TableHead className="text-center">All Line</TableHead>

          </TableRow>

        </TableHeader>

        <TableBody>

          {data.map((row) => (

            <TableRow key={row.date}>

              <TableCell>
                {new Date(row.date).toLocaleDateString("id-ID")}
              </TableCell>

              <TableCell className="text-center">{row.line1 ?? "-"}</TableCell>
              <TableCell className="text-center">{row.line2 ?? "-"}</TableCell>
              <TableCell className="text-center">{row.line3 ?? "-"}</TableCell>
              <TableCell className="text-center">{row.line4 ?? "-"}</TableCell>
              <TableCell className="text-center">{row.line5 ?? "-"}</TableCell>
              <TableCell className="text-center">{row.line6 ?? "-"}</TableCell>

              <TableCell className="text-center font-semibold">
                {row.allLine ?? "-"}
              </TableCell>

            </TableRow>

          ))}

        </TableBody>

      </Table>

    </div>

  )

}