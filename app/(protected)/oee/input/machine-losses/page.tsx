'use client'

import { useState, useEffect, useCallback } from 'react'
import { OeeGuard } from '@/components/oee/oee-guard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { ExportImportBar } from '@/components/oee/export-import-bar'
import { Wrench, Plus, Calendar, Factory, Clock, Tag, FileText, ChevronRight, Pencil, Eye, AlertTriangle, SplitSquareHorizontal, Check, ArrowRight } from 'lucide-react'
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
import { getLines, getShifts, getMachineLossLvl1, getMachineLossLvl2, getMachineLossLvl3, getFeedCodes, getMasterMachineLosses } from '@/services/masterService'
import { ApiMachineLossInput, ApiLine, ApiShift, ApiMachineLossLvl1, ApiMachineLossLvl2, ApiMachineLossLvl3, ApiFeedCode, ApiMasterMachineLoss } from '@/types/api'
import { fmtDate, fmtMinutes } from '@/lib/machine-loss-utils'

// ─── Split record type ────────────────────────────────────────────────────────
interface SplitRecord {
  shift_id:         number
  shift_name:       string
  shift_time_range: string
  time_from:        string | null
  time_to:          string | null
  duration_minutes: number
}

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
                <p className="font-bold text-orange-600 text-lg">{fmtMinutes(row.duration_minutes)}</p>
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

// ─── Split Shift Preview Dialog ───────────────────────────────────────────────
function SplitShiftPreviewDialog({
  open,
  splits,
  form,
  shifts,
  allLvl1,
  allLvl2,
  allLvl3,
  isSaving,
  onConfirm,
  onBack,
}: {
  open:      boolean
  splits:    SplitRecord[]
  form:      MachineLossFormState
  shifts:    ApiShift[]
  allLvl1:   ApiMachineLossLvl1[]
  allLvl2:   ApiMachineLossLvl2[]
  allLvl3:   ApiMachineLossLvl3[]
  isSaving:  boolean
  onConfirm: () => void
  onBack:    () => void
}) {
  if (!open) return null

  const l1 = allLvl1.find(l => String(l.machine_losses_lvl_1_id) === form.loss_l1_id)
  const l2 = allLvl2.find(l => String(l.machine_losses_lvl_2_id) === form.loss_l2_id)
  const l3 = allLvl3.find(l => String(l.machine_losses_lvl_3_id) === form.loss_l3_id)
  const totalMin = splits.reduce((s, r) => s + r.duration_minutes, 0)

  return (
    <Dialog open={open} onOpenChange={onBack}>
      <DialogContent className="sm:max-w-[540px] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SplitSquareHorizontal className="h-5 w-5 text-amber-600" />
            Preview Split Downtime
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Alert info */}
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-800">
              <p className="font-semibold mb-0.5">Downtime melewati batas shift</p>
              <p>Sistem akan menyimpan <strong>{splits.length} record terpisah</strong> sesuai shift yang terlewati. Periksa data di bawah sebelum konfirmasi.</p>
            </div>
          </div>

          {/* Context: what's being recorded */}
          <div className="rounded-lg border bg-slate-50 px-4 py-3 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Data Downtime</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs font-mono">{form.date}</Badge>
              {form.time_from && form.time_to && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />{form.time_from} → {form.time_to}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                Total: {fmtMinutes(totalMin)}
              </Badge>
            </div>
            {l1 && (
              <div className="flex items-center gap-1.5 text-xs flex-wrap mt-1">
                <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold">L1</span>
                <span className="font-medium">{l1.name}</span>
                {l2 && <><ArrowRight className="h-3 w-3 text-slate-400" /><span className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 font-bold">L2</span><span className="font-medium">{l2.name}</span></>}
                {l3 && <><ArrowRight className="h-3 w-3 text-slate-400" /><span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">L3</span><span className="font-medium">{l3.name}</span></>}
              </div>
            )}
          </div>

          {/* Split records preview */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Record yang akan disimpan</p>
            {splits.map((rec, i) => (
              <div key={i} className={cn(
                'rounded-xl border-2 px-4 py-3 space-y-2',
                i === 0 ? 'border-blue-200 bg-blue-50/60' : 'border-indigo-200 bg-indigo-50/60'
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white',
                      i === 0 ? 'bg-blue-500' : 'bg-indigo-500'
                    )}>
                      {i + 1}
                    </div>
                    <span className="font-semibold text-sm">{rec.shift_name}</span>
                    <Badge variant="outline" className="text-[10px]">{rec.shift_time_range}</Badge>
                  </div>
                  <span className={cn(
                    'text-sm font-bold',
                    i === 0 ? 'text-blue-700' : 'text-indigo-700'
                  )}>
                    {fmtMinutes(rec.duration_minutes)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  {rec.time_from && rec.time_to && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {rec.time_from} – {rec.time_to}
                    </span>
                  )}
                  <span className="text-slate-400">{rec.duration_minutes} menit</span>
                </div>
              </div>
            ))}
          </div>

          {/* Summary bar */}
          <div className="rounded-lg bg-slate-800 text-white px-4 py-2.5 flex items-center justify-between text-sm">
            <span className="text-slate-400 text-xs">Total downtime</span>
            <span className="font-bold">{fmtMinutes(totalMin)}</span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onBack} disabled={isSaving}>
            ← Kembali Edit
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSaving}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isSaving
              ? <><span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent inline-block" />Menyimpan…</>
              : <><Check className="mr-2 h-4 w-4" />Konfirmasi & Simpan {splits.length} Record</>
            }
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
  const [allLvl1, setAllLvl1]     = useState<ApiMachineLossLvl1[]>([])
  const [allLvl2, setAllLvl2]     = useState<ApiMachineLossLvl2[]>([])
  const [allLvl3, setAllLvl3]     = useState<ApiMachineLossLvl3[]>([])
  const [masterLosses, setMasterLosses] = useState<ApiMasterMachineLoss[]>([])
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

  // Split-shift preview
  const [splitPreview, setSplitPreview]     = useState<SplitRecord[]>([])
  const [splitPreviewOpen, setSplitPreviewOpen] = useState(false)
  const [pendingForm, setPendingForm]       = useState<MachineLossFormState | null>(null)

  const load = useCallback(async () => {
    try {
      setIsLoading(true)
      const [inputData, lineData, shiftData, l1Data, l2Data, l3Data, fcData, masterData] = await Promise.all([
        getMachineLossInputs(), getLines(), getShifts(),
        getMachineLossLvl1(), getMachineLossLvl2(), getMachineLossLvl3(), getFeedCodes(),
        getMasterMachineLosses(),
      ])
      setRows(inputData)
      setLines(lineData.filter(l => l.is_active))
      setShifts(shiftData.filter(s => s.is_active))
      setAllLvl1(l1Data)
      setAllLvl2(l2Data)
      setAllLvl3(l3Data)
      setMasterLosses(masterData)
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
      duration_hours: String(parseFloat((row.duration_minutes / 60).toFixed(4))), remarks: row.remarks ?? '',
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

    // Edit mode: langsung simpan tanpa split
    if (editing) {
      await commitSave(form, null)
      return
    }

    // Create mode: cek apakah perlu split
    const selectedShift = shifts.find(s => String(s.id) === form.shift_id) ?? null
    const splits = buildSplitRecords(form, selectedShift, shifts)

    if (splits.length > 1) {
      // Tampilkan preview & konfirmasi dulu
      setSplitPreview(splits)
      setPendingForm(form)
      setDialogOpen(false)
      setSplitPreviewOpen(true)
    } else {
      // Tidak ada split — simpan langsung
      await commitSave(form, null)
    }
  }

  async function commitSave(f: MachineLossFormState, splits: SplitRecord[] | null) {
    setIsSaving(true)
    const durHours = Number(f.duration_hours)
    const durMinutes = Math.round(durHours * 60)  // convert jam → menit
    const basePayload = {
      date: new Date(f.date).toISOString(),
      line_id:      Number(f.line_id),
      feed_code_id: f.feed_code_id ? Number(f.feed_code_id) : null,
      loss_l1_id:   f.loss_l1_id   ? Number(f.loss_l1_id)   : null,
      loss_l2_id:   f.loss_l2_id   ? Number(f.loss_l2_id)   : null,
      loss_l3_id:   f.loss_l3_id   ? Number(f.loss_l3_id)   : null,
      remarks:      f.remarks || undefined,
    }
    try {
      if (editing) {
        const payload = {
          ...basePayload,
          shift_id: Number(f.shift_id),
          time_from: f.time_from || null,
          time_to:   f.time_to   || null,
          duration_minutes: durMinutes,
        }
        const u = await updateMachineLossInput(editing.id, payload)
        setRows(prev => prev.map(r => r.id === editing.id ? u : r))
        toast.success('Data berhasil diperbarui')
        setDialogOpen(false)
      } else if (splits && splits.length > 1) {
        const created = await Promise.all(
          splits.map(sr => createMachineLossInput({
            ...basePayload,
            shift_id:         sr.shift_id,
            time_from:        sr.time_from,
            time_to:          sr.time_to,
            duration_minutes: sr.duration_minutes,
          }))
        )
        setRows(prev => [...created.reverse(), ...prev])
        toast.success(`${created.length} record berhasil disimpan (split antar shift)`)
        setSplitPreviewOpen(false)
        setPendingForm(null)
      } else {
        const payload = {
          ...basePayload,
          shift_id: Number(f.shift_id),
          time_from: f.time_from || null,
          time_to:   f.time_to   || null,
          duration_minutes: durMinutes,
        }
        const c = await createMachineLossInput(payload)
        setRows(prev => [c, ...prev])
        toast.success('Data berhasil disimpan')
        setDialogOpen(false)
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.detail)
        // Kalau dari preview, kembalikan ke form dialog
        if (splits) {
          setSplitPreviewOpen(false)
          setDialogOpen(true)
        }
      } else {
        toast.error('Gagal menyimpan data')
      }
    } finally { setIsSaving(false) }
  }

  /** Build split records. Returns 1 item if no split needed. */
  function buildSplitRecords(
    f: MachineLossFormState,
    selectedShift: ApiShift | null,
    allShifts: ApiShift[],
  ): SplitRecord[] {
    const timeFrom = f.time_from
    const timeTo   = f.time_to
    const dur      = Math.round(Number(f.duration_hours) * 60)  // jam → menit

    if (!timeFrom || !timeTo || !selectedShift) {
      return [{
        shift_id: Number(f.shift_id),
        shift_name: selectedShift?.name ?? '',
        shift_time_range: selectedShift ? `${selectedShift.time_from}–${selectedShift.time_to}` : '',
        time_from: timeFrom || null,
        time_to:   timeTo   || null,
        duration_minutes: dur,
      }]
    }

    const toMin  = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m }
    const toHHMM = (min: number)  => {
      const h = Math.floor(min / 60) % 24
      const m = min % 60
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    }

    const sortedShifts = [...allShifts].sort((a, b) => toMin(a.time_from) - toMin(b.time_from))

    let curFrom     = toMin(timeFrom)
    const rawEnd    = toMin(timeTo)
    const adjustEnd = rawEnd <= curFrom ? rawEnd + 24 * 60 : rawEnd

    const records: SplitRecord[] = []
    let curShiftId = Number(f.shift_id)
    let safety     = 0

    while (curFrom < adjustEnd && safety < 10) {
      safety++
      const curShift = allShifts.find(s => s.id === curShiftId)
      if (!curShift) break

      const shiftEnd = toMin(curShift.time_to)
      const adjShiftEnd = shiftEnd <= toMin(curShift.time_from) ? shiftEnd + 24 * 60 : shiftEnd
      const sliceEnd    = Math.min(adjustEnd, adjShiftEnd)
      const durationMin = sliceEnd - curFrom

      records.push({
        shift_id:         curShift.id,
        shift_name:       curShift.name,
        shift_time_range: `${curShift.time_from}–${curShift.time_to}`,
        time_from: toHHMM(curFrom % (24 * 60)),
        time_to:   toHHMM(sliceEnd % (24 * 60)),
        duration_minutes: Math.round(durationMin),
      })

      if (sliceEnd >= adjustEnd) break

      curFrom = sliceEnd
      const next = sortedShifts.find(s => {
        const ss = toMin(s.time_from)
        return ss === curFrom % (24 * 60)
      }) ?? sortedShifts.find(s => s.id !== curShiftId)
      if (!next) break
      curShiftId = next.id
    }

    return records.length > 0 ? records : [{
      shift_id: Number(f.shift_id),
      shift_name: selectedShift.name,
      shift_time_range: `${selectedShift.time_from}–${selectedShift.time_to}`,
      time_from: timeFrom,
      time_to:   timeTo,
      duration_minutes: dur,
    }]
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

  // ── Cascade filter L2/L3 berdasarkan masterLosses (katalog kombinasi) ──────
  // Hanya tampilkan L2 yang memiliki kombinasi valid dengan L1 yang dipilih
  const filteredLvl2: ApiMachineLossLvl2[] = (() => {
    if (!form.loss_l1_id) return []
    const l1id = Number(form.loss_l1_id)
    const validL2Ids = new Set(
      masterLosses
        .filter(m => m.machine_losses_lvl_1_id === l1id && m.machine_losses_lvl_2_id != null)
        .map(m => m.machine_losses_lvl_2_id!)
    )
    return allLvl2.filter(l => validL2Ids.has(l.machine_losses_lvl_2_id))
  })()

  // Hanya tampilkan L3 yang memiliki kombinasi valid dengan L1+L2 yang dipilih
  const filteredLvl3: ApiMachineLossLvl3[] = (() => {
    if (!form.loss_l1_id || !form.loss_l2_id) return []
    const l1id = Number(form.loss_l1_id)
    const l2id = Number(form.loss_l2_id)
    const validL3Ids = new Set(
      masterLosses
        .filter(m =>
          m.machine_losses_lvl_1_id === l1id &&
          m.machine_losses_lvl_2_id === l2id &&
          m.machine_losses_lvl_3_id != null
        )
        .map(m => m.machine_losses_lvl_3_id!)
    )
    return allLvl3.filter(l => validL3Ids.has(l.machine_losses_lvl_3_id))
  })()

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
              <p className="text-white/70 text-sm mt-1">Pencatatan downtime harian per shift &amp; line</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Title row with Export/Import */}
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Machine Loss Input</h1>
              <p className="text-sm text-slate-500 mt-0.5">Riwayat downtime harian per shift per line</p>
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

          <MachineLossKpiCards totalEvents={filtered.length} totalMinutes={totalMinutes}
            avgMinutes={avgMinutes} topLossType={topL1} />

          <MachineLossHistoryTable rows={filtered} isLoading={isLoading}
            onEdit={openEdit} onDelete={setDeleteId} onView={setViewRow} />
        </div>
      </div>

      <MachineLossDetailDialog row={viewRow} onClose={() => setViewRow(null)}
        onEdit={row => { setViewRow(null); openEdit(row) }} />

      <MachineLossEntryDialog
        open={dialogOpen} isEditing={!!editing} isSaving={isSaving}
        form={form} formError={formError}
        lines={lines} shifts={shifts} feedCodes={feedCodes}
        allLvl1={allLvl1} allLvl2={filteredLvl2} allLvl3={filteredLvl3}
        onFormChange={setForm} onSave={handleSave} onClose={() => setDialogOpen(false)}
      />

      <SplitShiftPreviewDialog
        open={splitPreviewOpen}
        splits={splitPreview}
        form={pendingForm ?? form}
        shifts={shifts}
        allLvl1={allLvl1}
        allLvl2={allLvl2}
        allLvl3={allLvl3}
        isSaving={isSaving}
        onConfirm={() => commitSave(pendingForm ?? form, splitPreview)}
        onBack={() => { setSplitPreviewOpen(false); setDialogOpen(true) }}
      />

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Hapus Data Machine Loss"
        description="Data downtime ini akan dihapus secara permanen. Lanjutkan?"
        confirmText="Hapus" isLoading={isDeleting} />
    </OeeGuard>
  )
}
