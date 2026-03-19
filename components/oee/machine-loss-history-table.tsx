'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Pencil, Trash2 } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { ApiMachineLossInput } from '@/types/api'
import { fmtDate, fmtHours } from '@/lib/machine-loss-utils'

type Props = {
  rows:      ApiMachineLossInput[]
  isLoading: boolean
  onEdit:    (row: ApiMachineLossInput) => void
  onDelete:  (id: number) => void
}

export function MachineLossHistoryTable({ rows, isLoading, onEdit, onDelete }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          Loss History
          {!isLoading && (
            <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-100">
              {rows.length} records
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Line</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Feed Code</TableHead>
                  <TableHead>L1 Category</TableHead>
                  <TableHead>L2 Sub-Category</TableHead>
                  <TableHead>L3 Detail</TableHead>
                  <TableHead className="text-center">From</TableHead>
                  <TableHead className="text-center">To</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead className="text-center w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-12 text-muted-foreground">
                      No records found. Click <strong>Add Loss Entry</strong> to get started.
                    </TableCell>
                  </TableRow>
                ) : rows.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm font-medium whitespace-nowrap">
                      {fmtDate(r.date)}
                    </TableCell>
                    <TableCell className="text-sm">{r.line_name ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{r.shift_name ?? '—'}</Badge>
                    </TableCell>
                    <TableCell>
                      {r.feed_code_code
                        ? <Badge className="bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-100 text-xs font-mono">{r.feed_code_code}</Badge>
                        : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell>
                      {r.loss_l1_name
                        ? <Badge className="bg-red-100 text-red-700 border border-red-200 hover:bg-red-100 text-xs">{r.loss_l1_name}</Badge>
                        : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell className="text-sm">{r.loss_l2_name ?? '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.loss_l3_name ?? '—'}</TableCell>
                    <TableCell className="text-center text-sm font-mono">{r.time_from ?? '—'}</TableCell>
                    <TableCell className="text-center text-sm font-mono">{r.time_to   ?? '—'}</TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-semibold text-orange-600">
                        {fmtHours(r.duration_minutes)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[8rem] truncate">
                      {r.remarks || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => onEdit(r)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm" variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => onDelete(r.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
