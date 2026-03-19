'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { AlertCircle, Loader2, Wrench } from 'lucide-react'
import { ApiLine, ApiShift, ApiMachineLoss } from '@/types/api'
import { cn } from '@/lib/utils'
import { calcDurationHours, fmtHours } from '@/lib/machine-loss-utils'


// ─── Types ────────────────────────────────────────────────────────────────────

export type MachineLossFormState = {
  date:             string
  line_id:          string
  shift_id:         string
  feed_code_id:     string
  loss_l1_id:       string
  loss_l2_id:       string
  loss_l3_id:       string
  time_from:        string
  time_to:          string
  duration_hours:   string   // stored and displayed in hours
  remarks:          string
}

export const EMPTY_LOSS_FORM: MachineLossFormState = {
  date:           new Date().toISOString().slice(0, 10),
  line_id:        '',
  shift_id:       '',
  feed_code_id:   '',
  loss_l1_id:     '',
  loss_l2_id:     '',
  loss_l3_id:     '',
  time_from:      '',
  time_to:        '',
  duration_hours: '',
  remarks:        '',
}

type Props = {
  open:     boolean
  isEditing: boolean
  isSaving: boolean
  form:     MachineLossFormState
  formError: string
  lines:    ApiLine[]
  shifts:   ApiShift[]
  allLosses: ApiMachineLoss[]
  onFormChange: (f: MachineLossFormState) => void
  onSave:  () => void
  onClose: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MachineLossEntryDialog({
  open, isEditing, isSaving, form, formError,
  lines, shifts, allLosses,
  onFormChange, onSave, onClose,
}: Props) {
  const set = (patch: Partial<MachineLossFormState>) =>
    onFormChange({ ...form, ...patch })

  // Cascading dropdown options
  const lossL1 = allLosses.filter(l => l.level === 1 && l.is_active)
  const lossL2 = allLosses.filter(
    l => l.level === 2 && l.is_active &&
      (!form.loss_l1_id || l.parent_id === Number(form.loss_l1_id))
  )
  const lossL3 = allLosses.filter(
    l => l.level === 3 && l.is_active &&
      (!form.loss_l2_id || l.parent_id === Number(form.loss_l2_id))
  )

  // Auto-compute duration (hours) from time window
  const autoHours = calcDurationHours(form.time_from, form.time_to)
  const hasAutoHours = !!(form.time_from && form.time_to && autoHours > 0)
  const displayHours = hasAutoHours ? autoHours : (Number(form.duration_hours) || 0)

  function handleLineChange(lineId: string) {
    const line = lines.find(l => String(l.id) === lineId)
    set({
      line_id:      lineId,
      feed_code_id: line?.current_feed_code_id ? String(line.current_feed_code_id) : '',
    })
  }

  function handleL1Change(val: string) {
    set({ loss_l1_id: val === 'none' ? '' : val, loss_l2_id: '', loss_l3_id: '' })
  }

  function handleL2Change(val: string) {
    set({ loss_l2_id: val === 'none' ? '' : val, loss_l3_id: '' })
  }

  function handleTimeChange(field: 'time_from' | 'time_to', val: string) {
    const from = field === 'time_from' ? val : form.time_from
    const to   = field === 'time_to'   ? val : form.time_to
    const hrs  = calcDurationHours(from, to)
    set({
      [field]:        val,
      duration_hours: hrs > 0 ? String(hrs) : form.duration_hours,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-teal-600" />
            {isEditing ? 'Edit Loss Entry' : 'Add Loss Entry'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">

          {/* Date */}
          <div className="space-y-1.5">
            <Label>Date <span className="text-destructive">*</span></Label>
            <Input type="date" value={form.date}
              onChange={e => set({ date: e.target.value })} />
          </div>

          {/* Shift */}
          <div className="space-y-1.5">
            <Label>Shift <span className="text-destructive">*</span></Label>
            <Select value={form.shift_id} onValueChange={v => set({ shift_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select shift…" /></SelectTrigger>
              <SelectContent>
                {shifts.map(s => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {s.time_from} – {s.time_to}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Line */}
          <div className="space-y-1.5">
            <Label>Line <span className="text-destructive">*</span></Label>
            <Select value={form.line_id} onValueChange={handleLineChange}>
              <SelectTrigger><SelectValue placeholder="Select line…" /></SelectTrigger>
              <SelectContent>
                {lines.map(l => (
                  <SelectItem key={l.id} value={String(l.id)}>
                    {l.name}
                    {l.current_feed_code_code && (
                      <span className="ml-2 text-xs text-blue-600 font-mono">
                        ({l.current_feed_code_code})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Feed Code — read-only, auto from line */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              Feed Code
              <span className="text-xs text-muted-foreground font-normal">auto from line</span>
            </Label>
            <Input
              value={
                form.feed_code_id
                  ? (lines.find(l => String(l.current_feed_code_id) === form.feed_code_id)
                      ?.current_feed_code_code ?? `ID: ${form.feed_code_id}`)
                  : '— None —'
              }
              readOnly
              className="bg-muted/50 text-muted-foreground cursor-not-allowed font-mono"
            />
          </div>

          {/* L1 — full width */}
          <div className="space-y-1.5 col-span-2">
            <Label>Loss Category — L1 <span className="text-destructive">*</span></Label>
            <Select value={form.loss_l1_id} onValueChange={handleL1Change}>
              <SelectTrigger><SelectValue placeholder="Select loss category…" /></SelectTrigger>
              <SelectContent>
                {lossL1.map(l => (
                  <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* L2 */}
          <div className="space-y-1.5">
            <Label>Sub-Category — L2</Label>
            <Select
              value={form.loss_l2_id}
              onValueChange={handleL2Change}
              disabled={!form.loss_l1_id || lossL2.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  !form.loss_l1_id        ? 'Select L1 first'     :
                  lossL2.length === 0     ? 'No L2 available'     : 'Select sub-category…'
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {lossL2.map(l => (
                  <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* L3 */}
          <div className="space-y-1.5">
            <Label>Detail Loss — L3</Label>
            <Select
              value={form.loss_l3_id}
              onValueChange={v => set({ loss_l3_id: v === 'none' ? '' : v })}
              disabled={!form.loss_l2_id || lossL3.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  !form.loss_l2_id        ? 'Select L2 first'     :
                  lossL3.length === 0     ? 'No L3 available'     : 'Select detail…'
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {lossL3.map(l => (
                  <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time From */}
          <div className="space-y-1.5">
            <Label>Time From</Label>
            <Input
              type="time"
              value={form.time_from}
              onChange={e => handleTimeChange('time_from', e.target.value)}
            />
          </div>

          {/* Time To */}
          <div className="space-y-1.5">
            <Label>Time To</Label>
            <Input
              type="time"
              value={form.time_to}
              onChange={e => handleTimeChange('time_to', e.target.value)}
            />
          </div>

          {/* Duration (hours) */}
          <div className="space-y-1.5 col-span-2">
            <Label className="flex items-center gap-1.5">
              Duration (hours) <span className="text-destructive">*</span>
              {hasAutoHours && (
                <span className="text-xs text-muted-foreground font-normal">
                  — computed from time window
                </span>
              )}
            </Label>
            <div className="relative">
              <Input
                type="number" step="0.01" min="0.01"
                placeholder="e.g. 1.5"
                value={form.duration_hours}
                onChange={e => set({ duration_hours: e.target.value })}
                readOnly={hasAutoHours}
                className={cn(hasAutoHours && 'bg-muted/50 text-muted-foreground cursor-not-allowed')}
              />
              {displayHours > 0 && (
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <span className="text-xs font-semibold text-orange-600">
                    = {fmtHours(displayHours)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-1.5 col-span-2">
            <Label>Remarks</Label>
            <Textarea
              placeholder="Optional notes"
              rows={2}
              value={form.remarks}
              onChange={e => set({ remarks: e.target.value })}
            />
          </div>

        </div>

        {formError && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive -mt-1">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {formError}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isSaving} className="bg-teal-600 hover:bg-teal-700">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
