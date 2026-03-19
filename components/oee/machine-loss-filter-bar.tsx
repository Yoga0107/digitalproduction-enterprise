'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ApiLine, ApiShift } from '@/types/api'

type Props = {
  filterDate:  string
  filterLine:  string
  filterShift: string
  lines:  ApiLine[]
  shifts: ApiShift[]
  onDateChange:  (v: string) => void
  onLineChange:  (v: string) => void
  onShiftChange: (v: string) => void
  onClear: () => void
}

export function MachineLossFilterBar({
  filterDate, filterLine, filterShift,
  lines, shifts,
  onDateChange, onLineChange, onShiftChange, onClear,
}: Props) {
  return (
    <Card>
      <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Date</Label>
          <Input type="date" value={filterDate} onChange={e => onDateChange(e.target.value)} />
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Line</Label>
          <Select value={filterLine} onValueChange={onLineChange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Lines</SelectItem>
              {lines.map(l => (
                <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Shift</Label>
          <Select value={filterShift} onValueChange={onShiftChange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Shifts</SelectItem>
              {shifts.map(s => (
                <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button variant="outline" className="w-full" onClick={onClear}>
            Clear Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
