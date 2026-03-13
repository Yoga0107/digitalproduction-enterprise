"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"

import { LoadingRow } from "@/types/loading-types"

type Props = {
  data: LoadingRow[]
}

export function LoadingTimeTable({ data }: Props) {

  return (
    <div className="border rounded-lg">

      <Table>

        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Line</TableHead>
            <TableHead>Shift</TableHead>
            <TableHead className="text-center">Loading Time</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.map((row, idx) => (
            <TableRow key={idx}>
              <TableCell>{new Date(row.date).toLocaleDateString("id-ID")}</TableCell>
              <TableCell>{row.line}</TableCell>
              <TableCell>{row.shift}</TableCell>
              <TableCell className="text-center">{row.loadingTime}</TableCell>
            </TableRow>
          ))}
        </TableBody>

      </Table>

    </div>
  )
}