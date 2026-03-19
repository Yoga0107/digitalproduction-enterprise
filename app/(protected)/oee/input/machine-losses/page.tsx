'use client'

import { useState, useEffect, useCallback } from 'react'
import { OeeGuard } from '@/components/oee/oee-guard'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Wrench, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api-client'

import { MachineLossFilterBar }    from '@/components/oee/machine-loss-filter-bar'
import { MachineLossKpiCards }     from '@/components/oee/machine-loss-kpi-cards'
import { MachineLossHistoryTable } from '@/components/oee/machine-loss-history-table'
import {
  MachineLossEntryDialog,
  MachineLossFormState,
  EMPTY_LOSS_FORM,
} from '@/components/oee/machine-loss-entry-dialog'

import {
  getMachineLossInputs, createMachineLossInput,
  updateMachineLossInput, deleteMachineLossInput,
} from '@/services/inputService'
import { getLines, getShifts, getMachineLosses } from '@/services/masterService'
import { ApiMachineLossInput, ApiLine, ApiShift, ApiMachineLoss } from '@/types/api'

export default function MachineLossInputPage() {
  // ── Master data ──────────────────────────────────────────────────────────
  const [lines, setLines]       = useState<ApiLine[]>([])
  const [shifts, setShifts]     = useState<ApiShift[]>([])
  const [allLosses, setAllLosses] = useState<ApiMachineLoss[]>([])

  // ── Records ───────────────────────────────────────────────────────────────
  const [rows, setRows]           = useState<ApiMachineLossInput[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // ── Filters ───────────────────────────────────────────────────────────────
  const [filterDate,  setFilterDate]  = useState('')
  const [filterLine,  setFilterLine]  = useState('all')
  const [filterShift, setFilterShift] = useState('all')

  // ── Dialog ────────────────────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing]       = useState<ApiMachineLossInput | null>(null)
  const [form, setForm]             = useState<MachineLossFormState>(EMPTY_LOSS_FORM)
  const [formError, setFormError]   = useState('')
  const [isSaving, setIsSaving]     = useState(false)

  // ── Delete ────────────────────────────────────────────────────────────────
  const [deleteId, setDeleteId]     = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // ── Load ──────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    try {
      setIsLoading(true)
      const [inputData, lineData, shiftData, lossData] = await Promise.all([
        getMachineLossInputs(),
        getLines(),
        getShifts(),
        getMachineLosses(),
      ])
      setRows(inputData)
      setLines(lineData.filter(l => l.is_active))
      setShifts(shiftData.filter(s => s.is_active))
      setAllLosses(lossData.filter(l => l.is_active))
    } catch {
      toast.error('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Dialog handlers ───────────────────────────────────────────────────────

  function openAdd() {
    setEditing(null); setForm(EMPTY_LOSS_FORM); setFormError(''); setDialogOpen(true)
  }

  function openEdit(row: ApiMachineLossInput) {
    setEditing(row)
    setForm({
      date:           row.date.slice(0, 10),
      line_id:        String(row.line_id),
      shift_id:       String(row.shift_id),
      feed_code_id:   row.feed_code_id  ? String(row.feed_code_id)  : '',
      loss_l1_id:     row.loss_l1_id    ? String(row.loss_l1_id)    : '',
      loss_l2_id:     row.loss_l2_id    ? String(row.loss_l2_id)    : '',
      loss_l3_id:     row.loss_l3_id    ? String(row.loss_l3_id)    : '',
      time_from:      row.time_from     ?? '',
      time_to:        row.time_to       ?? '',
      duration_hours: String(row.duration_minutes), // stored as hours in DB field named duration_minutes
      remarks:        row.remarks       ?? '',
    })
    setFormError(''); setDialogOpen(true)
  }

  async function handleSave() {
    setFormError('')
    if (!form.date)           { setFormError('Date is required.');                   return }
    if (!form.line_id)        { setFormError('Line is required.');                   return }
    if (!form.shift_id)       { setFormError('Shift is required.');                  return }
    if (!form.loss_l1_id)     { setFormError('Loss Category (L1) is required.');     return }
    if (!form.duration_hours || Number(form.duration_hours) <= 0) {
      setFormError('Duration must be greater than 0.')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        date:             new Date(form.date).toISOString(),
        line_id:          Number(form.line_id),
        shift_id:         Number(form.shift_id),
        feed_code_id:     form.feed_code_id ? Number(form.feed_code_id) : null,
        loss_l1_id:       form.loss_l1_id   ? Number(form.loss_l1_id)   : null,
        loss_l2_id:       form.loss_l2_id   ? Number(form.loss_l2_id)   : null,
        loss_l3_id:       form.loss_l3_id   ? Number(form.loss_l3_id)   : null,
        time_from:        form.time_from     || null,
        time_to:          form.time_to       || null,
        duration_minutes: Number(form.duration_hours), // field name kept for API compat
        remarks:          form.remarks       || undefined,
      }
      if (editing) {
        const u = await updateMachineLossInput(editing.id, payload)
        setRows(prev => prev.map(r => r.id === editing.id ? u : r))
        toast.success('Record updated')
      } else {
        const c = await createMachineLossInput(payload)
        setRows(prev => [c, ...prev])
        toast.success('Record saved')
      }
      setDialogOpen(false)
    } catch (err) {
      if (err instanceof ApiError) setFormError(err.detail)
      else toast.error('Failed to save record')
    } finally { setIsSaving(false) }
  }

  async function handleDelete() {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await deleteMachineLossInput(deleteId)
      setRows(prev => prev.filter(r => r.id !== deleteId))
      toast.success('Record deleted')
    } catch {
      toast.error('Failed to delete record')
    } finally { setIsDeleting(false); setDeleteId(null) }
  }

  // ── Derived state ─────────────────────────────────────────────────────────

  const filtered = rows.filter(r => {
    if (filterDate  && !r.date.startsWith(filterDate))               return false
    if (filterLine  !== 'all' && r.line_id  !== Number(filterLine))  return false
    if (filterShift !== 'all' && r.shift_id !== Number(filterShift)) return false
    return true
  })

  const totalHours = filtered.reduce((s, r) => s + r.duration_minutes, 0)
  const avgHours   = filtered.length > 0 ? totalHours / filtered.length : 0

  const byL1: Record<string, number> = {}
  filtered.forEach(r => {
    const k = r.loss_l1_name ?? 'Unknown'
    byL1[k] = (byL1[k] ?? 0) + r.duration_minutes
  })
  const topL1 = Object.entries(byL1).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <OeeGuard section="input">
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/20">

      {/* Page header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-teal-700 to-emerald-600 px-8 py-10">
        <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
            <Wrench className="h-7 w-7 text-white" />
          </div>
          <div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">
              Input Data
            </p>
            <h2 className="text-3xl font-bold text-white tracking-tight">Machine Loss</h2>
            <p className="text-white/70 text-sm mt-1">Daily downtime entry per shift per line</p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">

        {/* Toolbar */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Machine Loss Input</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Loss category cascades L1 → L2 → L3. Duration in hours.
            </p>
          </div>
          <Button
            className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-sm"
            onClick={openAdd}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Loss Entry
          </Button>
        </div>

        <MachineLossFilterBar
          filterDate={filterDate}  filterLine={filterLine}  filterShift={filterShift}
          lines={lines}            shifts={shifts}
          onDateChange={setFilterDate}
          onLineChange={setFilterLine}
          onShiftChange={setFilterShift}
          onClear={() => { setFilterDate(''); setFilterLine('all'); setFilterShift('all') }}
        />

        <MachineLossKpiCards
          totalEvents={filtered.length}
          totalHours={totalHours}
          avgHours={avgHours}
          topLossType={topL1}
        />

        <MachineLossHistoryTable
          rows={filtered}
          isLoading={isLoading}
          onEdit={openEdit}
          onDelete={setDeleteId}
        />
      </div>
    </div>

    <MachineLossEntryDialog
      open={dialogOpen}
      isEditing={!!editing}
      isSaving={isSaving}
      form={form}
      formError={formError}
      lines={lines}
      shifts={shifts}
      allLosses={allLosses}
      onFormChange={setForm}
      onSave={handleSave}
      onClose={() => setDialogOpen(false)}
    />

    <ConfirmDialog
      open={!!deleteId}
      onClose={() => setDeleteId(null)}
      onConfirm={handleDelete}
      title="Delete Loss Record"
      description="This downtime record will be permanently removed. Continue?"
      confirmText="Delete"
      isLoading={isDeleting}
    />
  </OeeGuard>
  )
}
