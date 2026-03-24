'use client'

import { useState, useEffect, useCallback } from 'react'
import { OeeGuard } from '@/components/oee/oee-guard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { ExportImportBar } from '@/components/oee/export-import-bar'
import { Wrench, Plus, Calendar, Factory, Clock, Tag, FileText, ChevronRight, Pencil, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'

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
  downloadMachineLossExcel, importMachineLossExcel,
} from '@/services/inputService'
import { getLines, getShifts, getMachineLosses, getFeedCodes } from '@/services/masterService'
import { ApiMachineLossInput, ApiLine, ApiShift, ApiMachineLoss, ApiFeedCode } from '@/types/api'
import { fmtDate, fmtHours } from '@/lib/machine-loss-utils'

// ─── View Detail Dialog ───────────────────────────────────────────────────────
function MachineLossDetailDialog({
  row, onClose, onEdit,
}: {
  row: ApiMachineLossInput | null
  onClose: () => void
  onEdit: (r: ApiMachineLossInput) => void
}) {
  if (!row) return null

  return (
    <Dialog open={!!row} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-teal-600" />
            Detail Machine Loss
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { icon: Calendar, label: 'Tanggal', value: fmtDate(row.date) },
              { icon: Clock,    label: 'Shift',   value: row.shift_name ?? '—' },
              { icon: Factory,  label: 'Line',    value: row.line_name  ?? '—' },
              { icon: Tag,      label: 'Kode Pakan', value: row.feed_code_code ?? '—', mono: true },
            ].map(({ icon: Icon, label, value, mono }) => (
              <div key={label} className="rounded-lg border bg-slate-50 px-3 py-2.5 space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon className="h-3 w-3" />{label}
                </div>
                <p className={cn('font-semibold text-sm', mono && 'font-mono')}>{value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border overflow-hidden">
            <div className="bg-slate-50 px-4 py-2.5 border-b">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-widest">Machine Losses</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold shrink-0 mt-0.5">L1</span>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Kategori Utama</p>
                  {row.loss_l1_name
                    ? <Badge className="bg-red-100 text-red-700 border border-red-200 hover:bg-red-100">{row.loss_l1_name}</Badge>
                    : <span className="text-sm text-muted-foreground">—</span>}
                </div>
              </div>
              {row.loss_l2_name && (
                <div className="flex items-start gap-3 pl-4">
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300 mt-1 shrink-0" />
                  <span className="px-2 py-0.5 rounded bg-violet-100 text-violet-700 text-[10px] font-bold shrink-0 mt-0.5">L2</span>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Sub-Kategori</p>
                    <Badge className="bg-violet-100 text-violet-700 border border-violet-200 hover:bg-violet-100">{row.loss_l2_name}</Badge>
                  </div>
                </div>
              )}
              {row.loss_l3_name && (
                <div className="flex items-start gap-3 pl-8">
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300 mt-1 shrink-0" />
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold shrink-0 mt-0.5">L3</span>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Detail Kerugian</p>
                    <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-100">{row.loss_l3_name}</Badge>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-orange-100 bg-orange-50/40 overflow-hidden">
            <div className="bg-orange-50 px-4 py-2.5 border-b border-orange-100">
              <span className="text-xs font-semibold text-orange-700 uppercase tracking-widest">Waktu & Durasi</span>
            </div>
            <div className="grid grid-cols-3 divide-x divide-orange-100">
              <div className="px-4 py-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Mulai</p>
                <p className="font-mono font-semibold text-sm">{row.time_from ?? '—'}</p>
              </div>
              <div className="px-4 py-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Selesai</p>
                <p className="font-mono font-semibold text-sm">{row.time_to ?? '—'}</p>
              </div>
              <div className="px-4 py-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Durasi</p>
                <p className="font-bold text-orange-600 text-lg">{fmtHours(row.duration_minutes)}</p>
              </div>
            </div>
          </div>

          {row.remarks && (
            <div className="rounded-lg border bg-slate-50 px-4 py-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <FileText className="h-3 w-3" /> Keterangan
              </div>
              <p className="text-sm">{row.remarks}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Tutup</Button>
          <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => { onClose(); onEdit(row) }}>
            <Pencil className="h-4 w-4 mr-2" /> Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MachineLossInputPage() {
  const { user } = useAuth()

  const [lines, setLines]         = useState<ApiLine[]>([])
  const [shifts, setShifts]       = useState<ApiShift[]>([])
  const [allLosses, setAllLosses] = useState<ApiMachineLoss[]>([])
  const [feedCodes, setFeedCodes] = useState<ApiFeedCode[]>([])

  const [rows, setRows]           = useState<ApiMachineLossInput[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  const [filterDate,  setFilterDate]  = useState('')
  const [filterLine,  setFilterLine]  = useState('all')
  const [filterShift, setFilterShift] = useState('all')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing]       = useState<ApiMachineLossInput | null>(null)
  const [form, setForm]             = useState<MachineLossFormState>(EMPTY_LOSS_FORM)
  const [formError, setFormError]   = useState('')
  const [isSaving, setIsSaving]     = useState(false)

  const [viewRow, setViewRow]       = useState<ApiMachineLossInput | null>(null)
  const [deleteId, setDeleteId]     = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const load = useCallback(async () => {
    try {
      setIsLoading(true)
      const [inputData, lineData, shiftData, lossData, fcData] = await Promise.all([
        getMachineLossInputs(), getLines(), getShifts(), getMachineLosses(), getFeedCodes(),
      ])
      setRows(inputData)
      setLines(lineData.filter(l => l.is_active))
      setShifts(shiftData.filter(s => s.is_active))
      setAllLosses(lossData.filter(l => l.is_active))
      setFeedCodes(fcData.filter(f => f.is_active))
    } catch { toast.error('Gagal memuat data') }
    finally { setIsLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function openAdd() { setEditing(null); setForm(EMPTY_LOSS_FORM); setFormError(''); setDialogOpen(true) }

  function openEdit(row: ApiMachineLossInput) {
    setEditing(row)
    setForm({
      date: row.date.slice(0, 10), line_id: String(row.line_id), shift_id: String(row.shift_id),
      feed_code_id: row.feed_code_id ? String(row.feed_code_id) : '',
      loss_l1_id: row.loss_l1_id ? String(row.loss_l1_id) : '',
      loss_l2_id: row.loss_l2_id ? String(row.loss_l2_id) : '',
      loss_l3_id: row.loss_l3_id ? String(row.loss_l3_id) : '',
      time_from: row.time_from ?? '', time_to: row.time_to ?? '',
      duration_hours: String(row.duration_minutes), remarks: row.remarks ?? '',
    })
    setFormError(''); setDialogOpen(true)
  }

  async function handleSave() {
    setFormError('')
    if (!form.date)       { setFormError('Tanggal wajib diisi.'); return }
    if (!form.line_id)    { setFormError('Line wajib dipilih.'); return }
    if (!form.shift_id)   { setFormError('Shift wajib dipilih.'); return }
    if (!form.loss_l1_id) { setFormError('Kategori kerugian (L1) wajib dipilih.'); return }
    const dur = Number(form.duration_hours)
    if (!form.duration_hours || dur <= 0) { setFormError('Durasi harus lebih dari 0.'); return }

    setIsSaving(true)
    try {
      const payload = {
        date: new Date(form.date).toISOString(), line_id: Number(form.line_id), shift_id: Number(form.shift_id),
        feed_code_id: form.feed_code_id ? Number(form.feed_code_id) : null,
        loss_l1_id: form.loss_l1_id ? Number(form.loss_l1_id) : null,
        loss_l2_id: form.loss_l2_id ? Number(form.loss_l2_id) : null,
        loss_l3_id: form.loss_l3_id ? Number(form.loss_l3_id) : null,
        time_from: form.time_from || null, time_to: form.time_to || null,
        duration_minutes: dur, remarks: form.remarks || undefined,
      }
      if (editing) {
        const u = await updateMachineLossInput(editing.id, payload)
        setRows(prev => prev.map(r => r.id === editing.id ? u : r))
        toast.success('Data berhasil diperbarui')
      } else {
        const c = await createMachineLossInput(payload)
        setRows(prev => [c, ...prev])
        toast.success('Data berhasil disimpan')
      }
      setDialogOpen(false)
    } catch (err) {
      if (err instanceof ApiError) setFormError(err.detail)
      else toast.error('Gagal menyimpan data')
    } finally { setIsSaving(false) }
  }

  async function handleDelete() {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await deleteMachineLossInput(deleteId)
      setRows(prev => prev.filter(r => r.id !== deleteId))
      toast.success('Data berhasil dihapus')
    } catch { toast.error('Gagal menghapus data') }
    finally { setIsDeleting(false); setDeleteId(null) }
  }

  async function handleExport() {
    setIsExporting(true)
    try {
      await downloadMachineLossExcel({
        date_from: filterDate || undefined,
        line_id:   filterLine  !== 'all' ? Number(filterLine)  : undefined,
        shift_id:  filterShift !== 'all' ? Number(filterShift) : undefined,
      })
      toast.success('File Excel berhasil diunduh')
    } catch { toast.error('Export gagal. Coba lagi.') }
    finally { setIsExporting(false) }
  }

  async function handleImport(file: File) {
    const result = await importMachineLossExcel(file)
    if (result.imported > 0) await load()
    return result
  }

  const filtered = rows.filter(r => {
    if (filterDate  && !r.date.startsWith(filterDate))               return false
    if (filterLine  !== 'all' && r.line_id  !== Number(filterLine))  return false
    if (filterShift !== 'all' && r.shift_id !== Number(filterShift)) return false
    return true
  })

  const totalMinutes = filtered.reduce((s, r) => s + r.duration_minutes, 0)
  const avgMinutes   = filtered.length > 0 ? totalMinutes / filtered.length : 0
  const byL1: Record<string, number> = {}
  filtered.forEach(r => { const k = r.loss_l1_name ?? 'Unknown'; byL1[k] = (byL1[k] ?? 0) + r.duration_minutes })
  const topL1 = Object.entries(byL1).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''

  return (
    <OeeGuard section="input">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/20">
        {/* Hero header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-teal-700 to-emerald-600 px-8 py-10">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="relative flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Wrench className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">Input Data</p>
              <h2 className="text-3xl font-bold text-white tracking-tight">Machine Loss</h2>
              <p className="text-white/70 text-sm mt-1">Input downtime harian per shift per line</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Title row with Export/Import */}
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Machine Loss Input</h1>
              <p className="text-sm text-slate-500 mt-0.5">Klik baris untuk melihat detail lengkap</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <ExportImportBar
                role={user?.role ?? 'viewer'}
                label="Machine Loss"
                onExport={handleExport}
                onImport={handleImport}
                exportLoading={isExporting}
              />
              <Button
                className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-sm"
                onClick={openAdd}
              >
                <Plus className="h-4 w-4 mr-2" /> Tambah Data
              </Button>
            </div>
          </div>

          <MachineLossFilterBar
            filterDate={filterDate} filterLine={filterLine} filterShift={filterShift}
            lines={lines} shifts={shifts}
            onDateChange={setFilterDate} onLineChange={setFilterLine} onShiftChange={setFilterShift}
            onClear={() => { setFilterDate(''); setFilterLine('all'); setFilterShift('all') }}
          />

          <MachineLossKpiCards totalEvents={filtered.length} totalHours={totalMinutes}
            avgHours={avgMinutes} topLossType={topL1} />

          <MachineLossHistoryTable rows={filtered} isLoading={isLoading}
            onEdit={openEdit} onDelete={setDeleteId} onView={setViewRow} />
        </div>
      </div>

      <MachineLossDetailDialog row={viewRow} onClose={() => setViewRow(null)}
        onEdit={row => { setViewRow(null); openEdit(row) }} />

      <MachineLossEntryDialog
        open={dialogOpen} isEditing={!!editing} isSaving={isSaving}
        form={form} formError={formError}
        lines={lines} shifts={shifts} feedCodes={feedCodes} allLosses={allLosses}
        onFormChange={setForm} onSave={handleSave} onClose={() => setDialogOpen(false)}
      />

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Hapus Data Machine Loss"
        description="Data downtime ini akan dihapus secara permanen. Lanjutkan?"
        confirmText="Hapus" isLoading={isDeleting} />
    </OeeGuard>
  )
}
