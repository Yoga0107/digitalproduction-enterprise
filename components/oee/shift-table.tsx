'use client'



import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"

import { Button } from "@/components/ui/button"
import { Shift } from "@/types/shift-types"

type Props = {
  shifts: Shift[]
  onEdit: (shift: Shift) => void
  onDelete: (id: string) => void
}

export function ShiftTable({ shifts, onEdit, onDelete }: Props) {

  return (
    <Table>

      <TableHeader>
        <TableRow>
          <TableHead>Shift</TableHead>
          <TableHead>From</TableHead>
          <TableHead>To</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>

        {shifts.map((shift) => (
          <TableRow key={shift.id}>

            <TableCell>{shift.name}</TableCell>
            <TableCell>{shift.from}</TableCell>
            <TableCell>{shift.to}</TableCell>

            <TableCell className="space-x-2">

              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(shift)}
              >
                Edit
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(shift.id)}
              >
                Delete
              </Button>

            </TableCell>

          </TableRow>
        ))}

      </TableBody>

    </Table>
  )
}