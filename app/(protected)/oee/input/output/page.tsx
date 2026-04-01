'use client'

import { useState, useEffect, useCallback } from 'react'
import { OeeGuard } from '@/components/oee/oee-guard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { ExportImportBar } from '@/components/oee/export-import-bar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  getProductionOutputs, createProductionOutput,
  updateProductionOutput, deleteProductionOutput,
  downloadProductionOutputsExcel, importProductionOutputsExcel,
  getProductionOutputsByType,
} from '@/services/inputService'
import { getLines, getShifts, getFeedCodes, getActiveOutputTypes } from '@/services/masterService'
import {
  ApiProductionOutput, ApiProductionOutputItem,
  ApiLine, ApiShift, ApiFeedCode, ApiOutputType,
} from '@/types/api'
import { toast } from 'sonner'
import {
  Loader2, Plus, Pencil, Trash2, Activity, Eye,
  AlertCircle, TrendingUp, Package, RotateCcw,
  Calendar, Factory, Clock, Tag, FileText, Layers,
} from 'lucide-react'
import { ApiError } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'

// ─── Types ────────────────────────────────────────────────────────────────────
type FormState = {
  date:            string
  line_id:         string
  shift_id:        string
  feed_code_id:    string
  production_plan: string
  quantities:      Record<string, string>
  remarks:         string
}

function buildEmptyForm(): FormState {
  return {
    date:            new Date().toISOString().slice(0, 10),
    line_id:         '',
    shift_id:        '',
    feed_code_id:    '',
    production_plan: '',
    quantities:      {},
    remarks:         '',
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function n(s: string) { return Number(s) || 0 }
function computeActual(quantities: Record<string, string>) {
  return Object.values(quantities).reduce((sum, v) => sum + n(v), 0)
}
function fmt(v: number | null | undefined) {
  if (v == null) return '-'
  return v.toLocaleString('id-ID')
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

// ─── Color palettes ───────────────────────────────────────────────────────────
const DOT_COLORS  = ['bg-teal-500','bg-blue-500','bg-yellow-400','bg-orange-400','bg-red-500','bg-purple-500','bg-pink-500','bg-cyan-500']
const TEXT_COLORS = ['text-teal-700','text-blue-700','text-yellow-700','text-orange-700','text-red-700','text-purple-700','text-pink-700','text-cyan-700']
const BG_COLORS   = ['bg-teal-50','bg-blue-50','bg-yellow-50','bg-orange-50','bg-red-50','bg-purple-50','bg-pink-50','bg-cyan-50']
function dotColor(i: number)  { return DOT_COLORS[i  % DOT_COLORS.length] }
function textColor(i: number) { return TEXT_COLORS[i % TEXT_COLORS.length] }
function bgColor(i: number)   { return BG_COLORS[i   % BG_COLORS.length] }

// ─── View Detail Dialog ───────────────────────────────────────────────────────
function OutputDetailDialog({
  row, outputTypes, onClose, onEdit,
}: {
  row: ApiProductionOutput | null
  outputTypes: ApiOutputType[]
  onClose: () => void
  onEdit: (r: ApiProductionOutput) => void
}) {
  if (!row) return null
  return (
    <Dialog open={!!row} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[540px] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-600" />
            Detail Production Output
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { icon: Calendar, label: 'Tanggal',    value: fmtDate(row.date) },
              { icon: Clock,    label: 'Shift',      value: row.shift_name ?? '—' },
              { icon: Factory,  label: 'Line',       value: row.line_name  ?? '—' },
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
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-widest">Output (kg)</span>
            </div>
            <div className="p-4 grid grid-cols-3 gap-3">
              {outputTypes.map((ot, idx) => (
                <div key={ot.code} className={cn('rounded-lg px-3 py-2 space-y-0.5', bgColor(idx))}>
                  <p className="text-xs text-muted-foreground">{ot.name}</p>
                  <p className={cn('font-bold text-sm', textColor(idx))}>{fmt(row.quantities?.[ot.code] ?? 0)}</p>
                </div>
              ))}
              <div className="rounded-lg px-3 py-2 space-y-0.5 bg-emerald-50">
                <p className="text-xs text-muted-foreground">Total Actual</p>
                <p className="font-bold text-sm text-emerald-700">{fmt(row.actual_output)}</p>
              </div>
            </div>
          </div>
          {row.remarks && (
            <div className="rounded-lg border bg-slate-50 px-4 py-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <FileText className="h-3 w-3" />Remarks
              </div>
              <p className="text-sm">{row.remarks}</p>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Tutup</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { onClose(); onEdit(row) }}>
            <Pencil className="h-4 w-4 mr-2" />Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OutputPage() {
  const { user } = useAuth()

  const [rows, setRows]               = useState<ApiProductionOutput[]>([])
  const [lines, setLines]             = useState<ApiLine[]>([])
  const [shifts, setShifts]           = useState<ApiShift[]>([])
  const [feedCodes, setFeedCodes]     = useState<ApiFeedCode[]>([])
  const [outputTypes, setOutputTypes] = useState<ApiOutputType[]>([])
  const [isLoading, setIsLoading]     = useState(true)
  const [isSaving, setIsSaving]       = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing]       = useState<ApiProductionOutput | null>(null)
  const [form, setForm]             = useState<FormState>(buildEmptyForm())
  const [formError, setFormError]   = useState('')
  const [viewRow, setViewRow]       = useState<ApiProductionOutput | null>(null)

  const [filterDate, setFilterDate]   = useState('')
  const [filterLine, setFilterLine]   = useState('all')
  const [filterShift, setFilterShift] = useState('all')
  const [filterType, setFilterType]   = useState('all')
  const [activeTab, setActiveTab]     = useState<'summary' | 'bytype'>('summary')

  const [deleteId, setDeleteId]       = useState<string | null>(null)
  const [isDeleting, setIsDeleting]   = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const [outputByType, setOutputByType]       = useState<ApiProductionOutputItem[]>([])
  const [isLoadingByType, setIsLoadingByType] = useState(false)

  const liveActual = computeActual(form.quantities)

  const load = useCallback(async () => {
    try {
      setIsLoading(true)
      const [outputData, lineData, shiftData, fcData, otData] = await Promise.all([
        getProductionOutputs(),
        getLines(),
        getShifts(),
        getFeedCodes(),
        getActiveOutputTypes(),
      ])
      setRows(outputData)
      setLines(lineData.filter(l => l.is_active))
      setShifts(shiftData.filter(s => s.is_active))
      setFeedCodes(fcData.filter(f => f.is_active))
      setOutputTypes(otData)
    } catch { toast.error('Gagal memuat data') }
    finally { setIsLoading(false) }
  }, [])

  const loadByType = useCallback(async (
    date?: string, lineId?: string, shiftId?: string, outType?: string
  ) => {
    try {
      setIsLoadingByType(true)
      const data = await getProductionOutputsByType({
        date_from:   date || undefined,
        date_to:     date || undefined,
        line_id:     (lineId && lineId !== 'all')    ? Number(lineId)  : undefined,
        shift_id:    (shiftId && shiftId !== 'all')  ? Number(shiftId) : undefined,
        output_type: (outType && outType !== 'all')  ? outType         : undefined,
      })
      setOutputByType(data)
    } catch { toast.error('Gagal memuat data per type') }
    finally { setIsLoadingByType(false) }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (activeTab === 'bytype') {
      loadByType(filterDate, filterLine, filterShift, filterType)
    }
  }, [activeTab, filterDate, filterLine, filterShift, filterType, loadByType])

  function handleTabChange(tab: string) {
    setActiveTab(tab as 'summary' | 'bytype')
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }
  function setQty(code: string, value: string) {
    setForm(f => ({ ...f, quantities: { ...f.quantities, [code]: value } }))
  }

  function openAdd() {
    setEditing(null)
    const emptyQty = outputTypes.reduce<Record<string, string>>((acc, ot) => {
      acc[ot.code] = ''
      return acc
    }, {})
    setForm({ ...buildEmptyForm(), quantities: emptyQty })
    setFormError('')
    setDialogOpen(true)
  }

  function openEdit(row: ApiProductionOutput) {
    setEditing(row)
    const qtyStr = outputTypes.reduce<Record<string, string>>((acc, ot) => {
      acc[ot.code] = String(row.quantities?.[ot.code] ?? '')
      return acc
    }, {})
    setForm({
      date:            row.date.slice(0, 10),
      line_id:         String(row.line_id),
      shift_id:        String(row.shift_id),
      feed_code_id:    row.feed_code_id ? String(row.feed_code_id) : '',
      production_plan: row.production_plan ? String(row.production_plan) : '',
      quantities:      qtyStr,
      remarks:         row.remarks ?? '',
    })
    setFormError('')
    setDialogOpen(true)
  }

  async function handleSave() {
    setFormError('')
    if (!form.date)     { setFormError('Tanggal wajib diisi.'); return }
    if (!form.line_id)  { setFormError('Line wajib dipilih.'); return }
    if (!form.shift_id) { setFormError('Shift wajib dipilih.'); return }
    setIsSaving(true)
    try {
      const quantities = outputTypes.reduce<Record<string, number>>((acc, ot) => {
        acc[ot.code] = n(form.quantities[ot.code] ?? '')
        return acc
      }, {})
      const payload = {
        date:            new Date(form.date).toISOString(),
        line_id:         Number(form.line_id),
        shift_id:        Number(form.shift_id),
        feed_code_id:    form.feed_code_id ? Number(form.feed_code_id) : null,
        production_plan: form.production_plan ? Number(form.production_plan) : null,
        quantities,
        remarks:         form.remarks || undefined,
      }
      if (editing) {
        const u = await updateProductionOutput(editing.id, payload)
        setRows(prev => prev.map(r => r.id === editing.id ? u : r))
        toast.success('Data berhasil diperbarui')
      } else {
        const c = await createProductionOutput(payload)
        setRows(prev => [c, ...prev])
        toast.success('Data berhasil disimpan')
      }
      if (activeTab === 'bytype') {
        loadByType(filterDate, filterLine, filterShift, filterType)
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
      await deleteProductionOutput(deleteId)
      setRows(prev => prev.filter(r => r.id !== deleteId))
      setOutputByType(prev => prev.filter(i => i.group_id !== deleteId))
      toast.success('Data berhasil dihapus')
      setDeleteId(null)
    } catch { toast.error('Gagal menghapus data') }
    finally { setIsDeleting(false) }
  }

  async function handleExport(): Promise<void> {
    setIsExporting(true)
    try {
      await downloadProductionOutputsExcel({
        date_from: filterDate || undefined,
        date_to:   filterDate || undefined,
        line_id:   (filterLine  !== 'all') ? Number(filterLine)  : undefined,
        shift_id:  (filterShift !== 'all') ? Number(filterShift) : undefined,
      })
      toast.success('File Excel berhasil diunduh')
    } catch { toast.error('Export gagal. Coba lagi.') }
    finally { setIsExporting(false) }
  }

  async function handleImport(file: File) {
    const result = await importProductionOutputsExcel(file)
    toast.success(result.message)
    await load()
    if (activeTab === 'bytype') {
      loadByType(filterDate, filterLine, filterShift, filterType)
    }
    return result
  }

  function resetFilters() {
    setFilterDate('')
    setFilterLine('all')
    setFilterShift('all')
    setFilterType('all')
  }

  const filtered = rows.filter(r => {
    if (filterDate  && !r.date.startsWith(filterDate))               return false
    if (filterLine  !== 'all' && r.line_id  !== Number(filterLine))  return false
    if (filterShift !== 'all' && r.shift_id !== Number(filterShift)) return false
    return true
  })

  const totalActual = filtered.reduce((s, r) => s + r.actual_output, 0)
  const typeTotals  = outputTypes.reduce<Record<string, number>>((acc, ot) => {
    acc[ot.code] = filtered.reduce((s, r) => s + (r.quantities?.[ot.code] ?? 0), 0)
    return acc
  }, {})

  const totalRecords  = filtered.length
  const avgActual     = totalRecords > 0 ? Math.round(totalActual / totalRecords) : 0
  const topOutputType = (() => {
    let max = -1; let name = ''
    outputTypes.forEach(ot => {
      const v = typeTotals[ot.code] ?? 0
      if (v > max) { max = v; name = ot.name }
    })
    return name
  })()

  return (
    <OeeGuard section="input">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">

        {/* ── Hero header ── */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-700 to-teal-600 px-8 py-10">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/5" />
          <div className="relative flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Activity className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">Input Data</p>
              <h2 className="text-3xl font-bold text-white tracking-tight">Production Output</h2>
              <p className="text-white/70 text-sm mt-1">Pencatatan hasil produksi harian per shift &amp; line</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">

          {/* ── Title row ── */}
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Production Output Input</h1>
              <p className="text-sm text-slate-500 mt-0.5">Riwayat hasil produksi harian per shift per line</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <ExportImportBar
                role={user?.role ?? 'viewer'}
                label="Production Output"
                onExport={handleExport}
                onImport={handleImport}
                exportLoading={isExporting}
              />
              <Button
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-sm"
                onClick={openAdd}
                disabled={outputTypes.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" /> Tambah Data
              </Button>
            </div>
          </div>

          {/* ── Warning: no output types ── */}
          {outputTypes.length === 0 && !isLoading && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-2 text-sm text-amber-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Belum ada Output Type aktif. Konfigurasi di{' '}
              <a href="/oee/master/output-type" className="underline font-medium">Master → Output Type</a>.
            </div>
          )}

          {/* ── Filter bar ── */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-600">Tanggal</Label>
                <Input
                  type="date"
                  value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-600">Line</Label>
                <Select value={filterLine} onValueChange={setFilterLine}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Line</SelectItem>
                    {lines.map(l => (
                      <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-600">Shift</Label>
                <Select value={filterShift} onValueChange={setFilterShift}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Shift</SelectItem>
                    {shifts.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-600">Output Type</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Type</SelectItem>
                    {outputTypes.map(ot => (
                      <SelectItem key={ot.code} value={ot.code}>{ot.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline" size="sm" className="h-9 text-xs w-full"
                  onClick={resetFilters}
                >
                  <RotateCcw className="h-3 w-3 mr-1.5" />Reset Filter
                </Button>
              </div>
            </div>
          </div>

          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-4 flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold text-emerald-600 tabular-nums">{totalRecords}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-4 flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Actual (kg)</p>
                <p className="text-2xl font-bold text-blue-600 tabular-nums">{fmt(totalActual)}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-4 flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                <Activity className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rata-rata/Record (kg)</p>
                <p className="text-2xl font-bold text-violet-600 tabular-nums">{fmt(avgActual)}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-4 flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <Layers className="h-5 w-5 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Output Terbanyak</p>
                <p className="text-sm font-bold text-amber-700 truncate">{topOutputType || '—'}</p>
              </div>
            </div>
          </div>

          {/* ── Tabs ── */}
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-2">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="bytype">Per Output Type</TabsTrigger>
            </TabsList>

            {/* ══ SUMMARY TAB ══ */}
            <TabsContent value="summary">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-600" />
                  <span className="text-base font-semibold text-slate-900">Data Production Output</span>
                  <Badge variant="secondary" className="ml-1">{filtered.length}</Badge>
                </div>
                {isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                    <span className="ml-2 text-sm text-muted-foreground">Memuat data...</span>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Belum ada data production output.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="whitespace-nowrap">Tanggal</TableHead>
                          <TableHead>Line</TableHead>
                          <TableHead>Shift</TableHead>
                          <TableHead>Kode Pakan</TableHead>
                          {outputTypes.map(ot => (
                            <TableHead key={ot.code} className="text-right whitespace-nowrap">
                              {ot.name} (kg)
                            </TableHead>
                          ))}
                          <TableHead className="text-right whitespace-nowrap">Actual (kg)</TableHead>
                          <TableHead className="text-center">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map(r => (
                          <TableRow key={r.id} className="hover:bg-slate-50/60">
                            <TableCell className="text-sm whitespace-nowrap">{fmtDate(r.date)}</TableCell>
                            <TableCell className="text-sm">{r.line_name ?? '—'}</TableCell>
                            <TableCell className="text-sm">{r.shift_name ?? '—'}</TableCell>
                            <TableCell>
                              {r.feed_code_code
                                ? <code className="bg-slate-100 text-slate-700 text-xs px-1.5 py-0.5 rounded">{r.feed_code_code}</code>
                                : <span className="text-muted-foreground text-xs">—</span>}
                            </TableCell>
                            {outputTypes.map((ot, idx) => (
                              <TableCell key={ot.code} className={cn('text-right text-sm', textColor(idx))}>
                                {fmt(r.quantities?.[ot.code] ?? 0)}
                              </TableCell>
                            ))}
                            <TableCell className="text-right text-sm font-semibold text-emerald-700">
                              {fmt(r.actual_output)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-1">
                                <Button size="icon" variant="ghost"
                                  className="h-7 w-7 text-slate-500 hover:text-emerald-600"
                                  onClick={() => setViewRow(r)}>
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost"
                                  className="h-7 w-7 text-slate-500 hover:text-blue-600"
                                  onClick={() => openEdit(r)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost"
                                  className="h-7 w-7 text-slate-500 hover:text-red-600"
                                  onClick={() => setDeleteId(r.id)}>
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
              </div>
            </TabsContent>

            {/* ══ BY-TYPE TAB ══ */}
            <TabsContent value="bytype">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-violet-600" />
                  <span className="text-base font-semibold text-slate-900">Data Per Output Type</span>
                  <Badge variant="secondary" className="ml-1">{outputByType.length}</Badge>
                </div>
                {isLoadingByType ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                    <span className="ml-2 text-sm text-muted-foreground">Memuat data...</span>
                  </div>
                ) : outputByType.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <Layers className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Tidak ada data untuk filter ini.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="whitespace-nowrap">Tanggal</TableHead>
                          <TableHead>Line</TableHead>
                          <TableHead>Shift</TableHead>
                          <TableHead>Kode Pakan</TableHead>
                          <TableHead>Output Type</TableHead>
                          <TableHead>Kategori</TableHead>
                          <TableHead className="text-right">Qty (kg)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {outputByType.map(r => {
                          const otIdx = outputTypes.findIndex(ot => ot.code === r.output_type)
                          return (
                            <TableRow key={r.item_id} className="hover:bg-slate-50/60">
                              <TableCell className="text-sm whitespace-nowrap">{fmtDate(r.date)}</TableCell>
                              <TableCell className="text-sm">{r.line_name ?? '—'}</TableCell>
                              <TableCell className="text-sm">{r.shift_name ?? '—'}</TableCell>
                              <TableCell>
                                {r.feed_code_code
                                  ? <code className="bg-slate-100 text-slate-700 text-xs px-1.5 py-0.5 rounded">{r.feed_code_code}</code>
                                  : <span className="text-muted-foreground text-xs">—</span>}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  <span className={cn('h-2 w-2 rounded-full shrink-0', dotColor(otIdx >= 0 ? otIdx : 0))} />
                                  <span className="text-sm font-medium">{r.output_type}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs font-mono">{r.category}</Badge>
                              </TableCell>
                              <TableCell className={cn('text-right text-sm font-medium', textColor(otIdx >= 0 ? otIdx : 0))}>
                                {fmt(r.quantity)}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                      <tfoot>
                        <tr className="bg-slate-50 border-t-2 font-semibold">
                          <td colSpan={6} className="px-4 py-2 text-xs text-slate-600 uppercase tracking-wide">
                            Total
                          </td>
                          <td className="px-4 py-2 text-right text-sm text-emerald-700">
                            {fmt(outputByType.reduce((s, r) => s + r.quantity, 0))}
                          </td>
                        </tr>
                      </tfoot>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* ── Form Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[540px] max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-600" />
              {editing ? 'Edit Production Output' : 'Tambah Production Output'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tanggal <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={e => setField('date', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Production Plan (kg)</Label>
                <Input
                  type="number" min={0} placeholder="0"
                  value={form.production_plan}
                  onChange={e => setField('production_plan', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Line <span className="text-red-500">*</span></Label>
                <Select value={form.line_id} onValueChange={v => setField('line_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Pilih line..." /></SelectTrigger>
                  <SelectContent>
                    {lines.map(l => (
                      <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Shift <span className="text-red-500">*</span></Label>
                <Select value={form.shift_id} onValueChange={v => setField('shift_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Pilih shift..." /></SelectTrigger>
                  <SelectContent>
                    {shifts.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Kode Pakan</Label>
              <Select
                value={form.feed_code_id || 'none'}
                onValueChange={v => setField('feed_code_id', v === 'none' ? '' : v)}
              >
                <SelectTrigger><SelectValue placeholder="Pilih kode pakan..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground italic">— Tidak ada —</span>
                  </SelectItem>
                  {feedCodes.map(fc => (
                    <SelectItem key={fc.id} value={String(fc.id)}>
                      <span className="font-mono font-medium">{fc.code}</span>
                      {fc.remarks && (
                        <span className="ml-2 text-xs text-muted-foreground">{fc.remarks}</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-3">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-widest">
                Output Produksi (kg)
              </p>
              {outputTypes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Tidak ada output type aktif.</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {outputTypes.map((ot, idx) => (
                    <div key={ot.code} className="space-y-1.5">
                      <Label className="flex items-center gap-1.5 text-sm">
                        <span className={cn('h-2 w-2 rounded-full shrink-0', dotColor(idx))} />
                        {ot.name}
                        {ot.is_good_product && (
                          <span className="text-xs text-amber-600 font-normal ml-1">(good product)</span>
                        )}
                      </Label>
                      <Input
                        type="number" min={0} placeholder="0"
                        value={form.quantities[ot.code] ?? ''}
                        onChange={e => setQty(ot.code, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {liveActual > 0 && (
              <div className="rounded-xl border bg-emerald-50 border-emerald-200 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-widest">
                    Total Actual Output
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Jumlah semua output type</p>
                </div>
                <p className="text-3xl font-black text-emerald-700 tabular-nums">
                  {fmt(liveActual)}{' '}
                  <span className="text-base font-medium">kg</span>
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Remarks</Label>
              <Textarea
                placeholder="Keterangan opsional" rows={2}
                value={form.remarks}
                onChange={e => setField('remarks', e.target.value)}
              />
            </div>
          </div>

          {formError && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive -mt-1">
              <AlertCircle className="h-4 w-4 shrink-0" />{formError}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? 'Simpan Perubahan' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <OutputDetailDialog
        row={viewRow}
        outputTypes={outputTypes}
        onClose={() => setViewRow(null)}
        onEdit={r => { setViewRow(null); openEdit(r) }}
      />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Data Output"
        description="Data production output ini akan dihapus secara permanen. Lanjutkan?"
        confirmText="Hapus"
        isLoading={isDeleting}
      />
    </OeeGuard>
  )
}