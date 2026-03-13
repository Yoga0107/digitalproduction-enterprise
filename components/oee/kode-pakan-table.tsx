'use client'

import { KodePakan } from "@/types/kode-pakan-types"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"

import { Button } from "@/components/ui/button"

type Props = {
  data: KodePakan[]
  onEdit: (item: KodePakan) => void
  onDelete: (id: string) => void
}

export function KodePakanTable({ data, onEdit, onDelete }: Props) {

  return (
    <Table>

      <TableHeader>
        <TableRow>
          <TableHead>Kode Pakan</TableHead>
          <TableHead>Remarks</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>

        {data.map((item) => (
          <TableRow key={item.id}>

            <TableCell className="font-medium">
              {item.kode}
            </TableCell>

            <TableCell>
              {item.remarks ?? "-"}
            </TableCell>

            <TableCell className="space-x-2">

              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(item)}
              >
                Edit
              </Button>

              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(item.id)}
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