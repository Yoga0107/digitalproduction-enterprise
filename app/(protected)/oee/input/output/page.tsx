'use client'

import { useState, useEffect, useCallback } from 'react'
import { OeeGuard } from '@/components/oee/oee-guard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import {
  getProductionOutputs, createProductionOutput,
  updateProductionOutput, deleteProductionOutput,
  downloadProductionOutputsExcel, importProductionOutputsExcel,
  getProductionOutputsByType,
} from '@/services/inputService'
import { getLines, getShifts, getFeedCodes } from '@/services/masterService'
import { ApiProductionOutput, ApiProductionOutputItem, ApiLine, ApiShift, ApiFeedCode } from '@/types/api'
import { toast } from 'sonner'
import {
  Loader2, Plus, Pencil, Trash2, Activity, Eye,
  AlertCircle, TrendingUp, Package, Star, RotateCcw, XCircle, CheckCircle2,
  Calendar, Factory, Clock, Tag, FileText,
} from 'lucide-react'
import { ApiError } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'

// ─── Types ────────────────────────────────────────────────────────────────────
type FormState = {
  date:               string
  line_id:            string
  shift_id:           string
  feed_code_id:       string
  finished_goods:     string
  downgraded_product: string
  wip:                string
  remix:              string
  reject_product:     string
  remarks:            string
}

const EMPTY_FORM: FormState = {
  date:               new Date().toISOString().slice(0, 10),
  line_id:            '',
  shift_id:           '',
  feed_code_id:       '',
  finished_goods:     '',
  downgraded_product: '',
  wip:                '',
  remix:              '',
  reject_product:     '',
  remarks:            '',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function n(s: string) { return Number(s) || 0 }
function computeLive(form: FormState) {
  const fg = n(form.finished_goods), dg = n(form.downgraded_product)
  const wip = n(form.wip), rmx = n(form.remix), rej = n(form.reject_product)
  const actual = fg + dg + wip + rmx + rej
  return { actual, quality: actual > 0 ? parseFloat(((fg / actual) * 100).toFixed(2)) : 0 }
}
function fmt(v: number | null | undefined) {
  if (v == null) return '-'
  return v.toLocaleString('id-ID')
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}
function qualityColor(rate: number) {
  if (rate >= 98) return 'text-emerald-600'
  if (rate >= 95) return 'text-yellow-600'
  return 'text-red-600'
}
function qualityBg(rate: number) {
  if (rate >= 98) return 'bg-emerald-500'
  if (rate >= 95) return 'bg-yellow-400'
  return 'bg-red-500'
}

// ─── Output type config ───────────────────────────────────────────────────────
const OUTPUT_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  finished_goods:     { label: 'Finished Goods',     color: 'text-teal-700',    bg: 'bg-teal-50',    dot: 'bg-teal-500'   },
  downgraded_product: { label: 'Downgraded Product', color: 'text-blue-700',    bg: 'bg-blue-50',    dot: 'bg-blue-500'   },
  wip:                { label: 'WIP',                color: 'text-yellow-700',  bg: 'bg-yellow-50',  dot: 'bg-yellow-400' },
  remix:              { label: 'Remix',              color: 'text-orange-700',  bg: 'bg-orange-50',  dot: 'bg-orange-400' },
  reject_product:     { label: 'Reject',             color: 'text-red-700',     bg: 'bg-red-50',     dot: 'bg-red-500'    },
}

// ─── View Detail Dialog ───────────────────────────────────────────────────────
function OutputDetailDialog({
  row, onClose, onEdit,
}: {
  row: ApiProductionOutput | null
  onClose: () => void
  onEdit: (r: ApiProductionOutput) => void
}) {
  if (!row) return null
  const quality = row.actual_output > 0
    ? parseFloat(((row.finished_goods / row.actual_output) * 100).toFixed(2)) : 0

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
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-widest">Output (kg)</span>
            </div>
            <div className="p-4 grid grid-cols-3 gap-3">
              {[
                { label: 'Finished Goods', value: row.finished_goods,     color: 'text-teal-700',   bg: 'bg-teal-50'   },
                { label: 'Downgraded',     value: row.downgraded_product, color: 'text-blue-700',   bg: 'bg-blue-50'   },
                { label: 'WIP',            value: row.wip,                color: 'text-yellow-700', bg: 'bg-yellow-50' },
                { label: 'Remix',          value: row.remix,              color: 'text-orange-700', bg: 'bg-orange-50' },
                { label: 'Reject',         value: row.reject_product,     color: 'text-red-700',    bg: 'bg-red-50'    },
                { label: 'Total Actual',   value: row.actual_output,      color: 'text-emerald-700',bg: 'bg-emerald-50'},
              ].map(({ label, value, color, bg }) => (
                <div key={label} className={cn('rounded-lg px-3 py-2 space-y-0.5', bg)}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className={cn('font-bold text-sm', color)}>{fmt(value)}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border overflow-hidden bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-200 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-violet-700 uppercase tracking-widest">Quality Rate</p>
              <p className={cn('text-2xl font-black', qualityColor(quality))}>{quality.toFixed(2)}%</p>
            </div>
            <div className="mt-2 h-2.5 w-full bg-white rounded-full overflow-hidden border border-violet-100">
              <div className={cn('h-full rounded-full', qualityBg(quality))} style={{ width: `${Math.min(quality,100)}%` }} />
            </div>
          </div>
          {row.remarks && (
            <div className="rounded-lg border bg-slate-50 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><FileText className="h-3 w-3" />Remarks</div>
              <p className="text-sm">{row.remarks}</p>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Tutup</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => onEdit(row)}>
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

  const [rows, setRows]           = useState<ApiProductionOutput[]>([])
  const [lines, setLines]         = useState<ApiLine[]>([])
  const [shifts, setShifts]       = useState<ApiShift[]>([])
  const [feedCodes, setFeedCodes] = useState<ApiFeedCode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving]   = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing]       = useState<ApiProductionOutput | null>(null)
  const [form, setForm]             = useState<FormState>(EMPTY_FORM)
  const [formError, setFormError]   = useState('')
  const [viewRow, setViewRow]       = useState<ApiProductionOutput | null>(null)

  const [filterDate, setFilterDate]   = useState('')
  const [filterLine, setFilterLine]   = useState('all')
  const [filterShift, setFilterShift] = useState('all')
  const [filterType, setFilterType]   = useState('all')
  const [activeTab, setActiveTab]     = useState<'summary' | 'bytype'>('summary')

  const [deleteId, setDeleteId]       = useState<number | null>(null)
  const [isDeleting, setIsDeleting]   = useState(false)

  const [outputByType, setOutputByType]   = useState<ApiProductionOutputItem[]>([])
  const [isLoadingByType, setIsLoadingByType] = useState(false)

  const { actual: liveActual, quality: liveQuality } = computeLive(form)

  const load = useCallback(async () => {
    try {
      setIsLoading(true)
      const [outputData, lineData, shiftData, fcData] = await Promise.all([
        getProductionOutputs(), getLines(), getShifts(), getFeedCodes(),
      ])
      setRows(outputData)
      setLines(lineData.filter(l => l.is_active))
      setShifts(shiftData.filter(s => s.is_active))
      setFeedCodes(fcData.filter(f => f.is_active))
    } catch { toast.error('Gagal memuat data') }
    finally { setIsLoading(false) }
  }, [])

  const loadByType = useCallback(async () => {
    try {
      setIsLoadingByType(true)
      const data = await getProductionOutputsByType()
      setOutputByType(data)
    } catch { toast.error('Gagal memuat data per type') }
    finally { setIsLoadingByType(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function handleTabChange(tab: string) {
    setActiveTab(tab as 'summary' | 'bytype')
    if (tab === 'bytype' && outputByType.length === 0) loadByType()
  }

  function setField(key: keyof FormState, value: string) { setForm(f => ({ ...f, [key]: value })) }

  function openAdd() { setEditing(null); setForm(EMPTY_FORM); setFormError(''); setDialogOpen(true) }

  function openEdit(row: ApiProductionOutput) {
    setEditing(row)
    setForm({
      date: row.date.slice(0, 10), line_id: String(row.line_id), shift_id: String(row.shift_id),
      feed_code_id: row.feed_code_id ? String(row.feed_code_id) : '',
      finished_goods: String(row.finished_goods), downgraded_product: String(row.downgraded_product),
      wip: String(row.wip), remix: String(row.remix), reject_product: String(row.reject_product),
      remarks: row.remarks ?? '',
    })
    setFormError(''); setDialogOpen(true)
  }

  async function handleSave() {
    setFormError('')
    if (!form.date)     { setFormError('Tanggal wajib diisi.'); return }
    if (!form.line_id)  { setFormError('Line wajib dipilih.'); return }
    if (!form.shift_id) { setFormError('Shift wajib dipilih.'); return }
    setIsSaving(true)
    try {
      const payload = {
        date: new Date(form.date).toISOString(), line_id: Number(form.line_id), shift_id: Number(form.shift_id),
        feed_code_id: form.feed_code_id ? Number(form.feed_code_id) : null,
        finished_goods: n(form.finished_goods), downgraded_product: n(form.downgraded_product),
        wip: n(form.wip), remix: n(form.remix), reject_product: n(form.reject_product),
        remarks: form.remarks || undefined,
      }
      if (editing) {
        const u = await updateProductionOutput(editing.id, payload)
        setRows(prev => prev.map(r => r.id === editing.id ? u : r))
        toast.success('Data berhasil diperbarui')
        setOutputByType(prev => prev.map(i => i.output_id === editing.id
          ? { ...i, quantity: (payload as any)[i.output_type] ?? i.quantity } : i))
      } else {
        const c = await createProductionOutput(payload)
        setRows(prev => [c, ...prev])
        toast.success('Data berhasil disimpan')
        // refresh by-type list to pick up new items
        getProductionOutputsByType().then(setOutputByType).catch(() => {})
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
      setOutputByType(prev => prev.filter(i => i.output_id !== deleteId))
      toast.success('Data berhasil dihapus')
    } catch { toast.error('Gagal menghapus data') }
    finally { setIsDeleting(false); setDeleteId(null) }
  }

  async function handleExport() {
    setIsExporting(true)
    try {
      await downloadProductionOutputsExcel({
        date_from: filterDate || undefined,
        line_id:   filterLine  !== 'all' ? Number(filterLine)  : undefined,
        shift_id:  filterShift !== 'all' ? Number(filterShift) : undefined,
      })
      toast.success('File Excel berhasil diunduh')
    } catch { toast.error('Export gagal. Coba lagi.') }
    finally { setIsExporting(false) }
  }

  async function handleImport(file: File) {
    const result = await importProductionOutputsExcel(file)
    if (result.imported > 0) await load()
    return result
  }

  const filtered = rows.filter(r => {
    if (filterDate  && !r.date.startsWith(filterDate)) return false
    if (filterLine  !== 'all' && r.line_id  !== Number(filterLine))  return false
    if (filterShift !== 'all' && r.shift_id !== Number(filterShift)) return false
    return true
  })

  const totalFG  = filtered.reduce((s, r) => s + r.finished_goods, 0)
  const totalDG  = filtered.reduce((s, r) => s + r.downgraded_product, 0)
  const totalWIP = filtered.reduce((s, r) => s + r.wip, 0)
  const totalRmx = filtered.reduce((s, r) => s + r.remix, 0)
  const totalRej = filtered.reduce((s, r) => s + r.reject_product, 0)
  const totalAct = filtered.reduce((s, r) => s + r.actual_output, 0)

  return (
    <OeeGuard section="input">
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50/30">
        {/* Hero header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-700 to-green-600 px-8 py-10">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="relative flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Activity className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">Input Data</p>
              <h2 className="text-3xl font-bold text-white tracking-tight">Production Output</h2>
              <p className="text-white/70 text-sm mt-1">Input produksi harian per shift per line</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Title row */}
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-emerald-900">Production Output</h1>
              <p className="text-sm text-emerald-600 mt-0.5">Klik baris untuk melihat detail lengkap</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Export / Import bar */}
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
              >
                <Plus className="h-4 w-4 mr-2" /> Tambah Output
              </Button>
            </div>
          </div>

          {/* Filter card */}
          <Card>
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Tanggal</Label>
                <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Line</Label>
                <Select value={filterLine} onValueChange={setFilterLine}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Line</SelectItem>
                    {lines.map(l => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Shift</Label>
                <Select value={filterShift} onValueChange={setFilterShift}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Shift</SelectItem>
                    {shifts.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" className="w-full"
                  onClick={() => { setFilterDate(''); setFilterLine('all'); setFilterShift('all') }}>
                  Reset Filter
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Total Output',   value: fmt(totalAct), icon: Package,      color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Finished Goods', value: fmt(totalFG),  icon: CheckCircle2, color: 'text-teal-600',    bg: 'bg-teal-50'    },
              { label: 'Downgraded',     value: fmt(totalDG),  icon: TrendingUp,   color: 'text-blue-600',    bg: 'bg-blue-50'    },
              { label: 'WIP',            value: fmt(totalWIP), icon: RotateCcw,    color: 'text-yellow-600',  bg: 'bg-yellow-50'  },
              { label: 'Remix',          value: fmt(totalRmx), icon: Star,         color: 'text-orange-600',  bg: 'bg-orange-50'  },
              { label: 'Reject',         value: fmt(totalRej), icon: XCircle,      color: 'text-red-500',     bg: 'bg-red-50'     },
            ].map(k => (
              <Card key={k.label} className="border-0 shadow-sm">
                <CardContent className="p-3 flex items-center gap-2">
                  <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', k.bg)}>
                    <k.icon className={cn('h-4 w-4', k.color)} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{k.label}</p>
                    <p className={cn('text-sm font-bold', k.color)}>{k.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Table + By-Type tabs */}
          <Tabs defaultValue="summary" onValueChange={handleTabChange}>
            <TabsList className="mb-2">
              <TabsTrigger value="summary">Ringkasan</TabsTrigger>
              <TabsTrigger value="bytype">Per Tipe Output</TabsTrigger>
            </TabsList>

            {/* ── Tab 1: Summary (existing table) ── */}
            <TabsContent value="summary">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    Riwayat Production Output
                    {!isLoading && (
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">{filtered.length} record</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Line</TableHead>
                            <TableHead>Shift</TableHead>
                            <TableHead>Kode Pakan</TableHead>
                            <TableHead className="text-right">FG (kg)</TableHead>
                            <TableHead className="text-right">DG (kg)</TableHead>
                            <TableHead className="text-right">WIP (kg)</TableHead>
                            <TableHead className="text-right">Remix (kg)</TableHead>
                            <TableHead className="text-right">Reject (kg)</TableHead>
                            <TableHead className="text-right">Total (kg)</TableHead>
                            <TableHead className="text-center w-28" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filtered.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={11} className="text-center py-12 text-muted-foreground">
                                Belum ada data. Klik <strong>Tambah Output</strong> untuk mulai.
                              </TableCell>
                            </TableRow>
                          ) : filtered.map(r => (
                            <TableRow key={r.id} className="cursor-pointer hover:bg-emerald-50/40"
                              onClick={() => setViewRow(r)}>
                              <TableCell className="text-sm font-medium whitespace-nowrap">{fmtDate(r.date)}</TableCell>
                              <TableCell className="text-sm">{r.line_name ?? '-'}</TableCell>
                              <TableCell><Badge variant="outline" className="text-xs">{r.shift_name ?? '-'}</Badge></TableCell>
                              <TableCell>
                                {r.feed_code_code
                                  ? <Badge className="bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-100 text-xs font-mono">{r.feed_code_code}</Badge>
                                  : <span className="text-muted-foreground text-xs">—</span>}
                              </TableCell>
                              <TableCell className="text-right text-sm font-medium text-teal-700">{fmt(r.finished_goods)}</TableCell>
                              <TableCell className="text-right text-sm text-blue-600">{fmt(r.downgraded_product)}</TableCell>
                              <TableCell className="text-right text-sm text-yellow-600">{fmt(r.wip)}</TableCell>
                              <TableCell className="text-right text-sm text-orange-600">{fmt(r.remix)}</TableCell>
                              <TableCell className="text-right text-sm text-red-600">{fmt(r.reject_product)}</TableCell>
                              <TableCell className="text-right text-sm font-semibold text-emerald-700">{fmt(r.actual_output)}</TableCell>
                              <TableCell onClick={e => e.stopPropagation()}>
                                <div className="flex justify-center gap-1">
                                  <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-emerald-600"
                                    onClick={() => setViewRow(r)}><Eye className="h-3.5 w-3.5" /></Button>
                                  <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"
                                    onClick={() => setDeleteId(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
            </TabsContent>

            {/* ── Tab 2: Per Tipe Output ── */}
            <TabsContent value="bytype">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      Output per Tipe
                      {!isLoadingByType && (
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                          {outputByType.filter(r =>
                            (filterType === 'all' || r.output_type === filterType) &&
                            (!filterDate  || r.date.startsWith(filterDate)) &&
                            (filterLine  === 'all' || r.line_id  === Number(filterLine)) &&
                            (filterShift === 'all' || r.shift_id === Number(filterShift))
                          ).length} record
                        </Badge>
                      )}
                    </CardTitle>
                    {/* Type filter */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Filter tipe:</span>
                      <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-[180px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Tipe</SelectItem>
                          {Object.entries(OUTPUT_TYPE_CONFIG).map(([key, cfg]) => (
                            <SelectItem key={key} value={key}>
                              <span className="flex items-center gap-2">
                                <span className={cn('h-2 w-2 rounded-full shrink-0', cfg.dot)} />
                                {cfg.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingByType ? (
                    <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Line</TableHead>
                            <TableHead>Shift</TableHead>
                            <TableHead>Kode Pakan</TableHead>
                            <TableHead>Tipe Output</TableHead>
                            <TableHead className="text-right">Qty (kg)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(() => {
                            const filtered2 = outputByType.filter(r =>
                              (filterType  === 'all' || r.output_type === filterType) &&
                              (!filterDate  || r.date.startsWith(filterDate)) &&
                              (filterLine  === 'all' || r.line_id  === Number(filterLine)) &&
                              (filterShift === 'all' || r.shift_id === Number(filterShift))
                            )
                            if (filtered2.length === 0) return (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                  {outputByType.length === 0
                                    ? 'Klik tab ini untuk memuat data per tipe.'
                                    : 'Tidak ada data sesuai filter.'}
                                </TableCell>
                              </TableRow>
                            )
                            return filtered2.map(r => {
                              const cfg = OUTPUT_TYPE_CONFIG[r.output_type] ?? {
                                label: r.output_type, color: 'text-slate-700', bg: 'bg-slate-50', dot: 'bg-slate-400'
                              }
                              return (
                                <TableRow key={r.item_id} className="hover:bg-slate-50/60">
                                  <TableCell className="text-sm font-medium whitespace-nowrap">{fmtDate(r.date)}</TableCell>
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
                                    <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full border', cfg.bg, cfg.color)}>
                                      <span className={cn('h-2 w-2 rounded-full shrink-0', cfg.dot)} />
                                      {cfg.label}
                                    </span>
                                  </TableCell>
                                  <TableCell className={cn('text-right text-sm font-bold', cfg.color)}>
                                    {fmt(r.quantity)}
                                  </TableCell>
                                </TableRow>
                              )
                            })
                          })()}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <OutputDetailDialog row={viewRow} onClose={() => setViewRow(null)}
        onEdit={row => { setViewRow(null); openEdit(row) }} />

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-600" />
              {editing ? 'Edit Production Output' : 'Tambah Production Output'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tanggal <span className="text-destructive">*</span></Label>
                <Input type="date" value={form.date} onChange={e => setField('date', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Shift <span className="text-destructive">*</span></Label>
                <Select value={form.shift_id} onValueChange={v => setField('shift_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Pilih shift…" /></SelectTrigger>
                  <SelectContent>
                    {shifts.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}<span className="ml-2 text-xs text-muted-foreground">{s.time_from} – {s.time_to}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Line <span className="text-destructive">*</span></Label>
                <Select value={form.line_id} onValueChange={v => setField('line_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Pilih line…" /></SelectTrigger>
                  <SelectContent>
                    {lines.map(l => <SelectItem key={l.id} value={String(l.id)}>{l.name}{l.code ? ` (${l.code})` : ''}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Kode Pakan</Label>
                <Select value={form.feed_code_id || 'none'} onValueChange={v => setField('feed_code_id', v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Pilih kode pakan…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none"><span className="text-muted-foreground italic">— Tidak ada —</span></SelectItem>
                    {feedCodes.map(fc => (
                      <SelectItem key={fc.id} value={String(fc.id)}>
                        <span className="font-mono font-medium">{fc.code}</span>
                        {fc.remarks && <span className="ml-2 text-xs text-muted-foreground">{fc.remarks}</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-3">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-widest">Output Produksi (kg)</p>
              <div className="grid grid-cols-2 gap-4">
                {([
                  { key: 'finished_goods',     label: 'Finished Goods',     dot: 'bg-teal-500'   },
                  { key: 'downgraded_product', label: 'Downgraded Product', dot: 'bg-blue-500'   },
                  { key: 'wip',                label: 'WIP',                dot: 'bg-yellow-400' },
                  { key: 'remix',              label: 'Remix',              dot: 'bg-orange-400' },
                ] as const).map(f => (
                  <div key={f.key} className="space-y-1.5">
                    <Label className="flex items-center gap-1.5">
                      <span className={cn('h-2 w-2 rounded-full', f.dot)} />{f.label}
                    </Label>
                    <Input type="number" min={0} placeholder="0"
                      value={(form as any)[f.key]}
                      onChange={e => setField(f.key as keyof FormState, e.target.value)} />
                  </div>
                ))}
                <div className="space-y-1.5 col-span-2">
                  <Label className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-red-500" />Reject
                  </Label>
                  <Input type="number" min={0} placeholder="0" value={form.reject_product}
                    onChange={e => setField('reject_product', e.target.value)} />
                </div>
              </div>
            </div>
            {liveActual > 0 && (
              <div className="rounded-xl border bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-violet-600 uppercase tracking-widest">Estimasi Quality Rate</p>
                    <p className="text-xs text-muted-foreground mt-0.5">FG ÷ Total Output × 100 — hanya tampilan</p>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-3xl font-black tabular-nums', qualityColor(liveQuality))}>{liveQuality.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">{fmt(n(form.finished_goods))} / {fmt(liveActual)} kg</p>
                  </div>
                </div>
                <div className="h-3 w-full bg-white rounded-full overflow-hidden border border-violet-100">
                  <div className={cn('h-full rounded-full transition-all duration-500', qualityBg(liveQuality))}
                    style={{ width: `${Math.min(liveQuality, 100)}%` }} />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Remarks</Label>
              <Textarea placeholder="Keterangan opsional" rows={2} value={form.remarks}
                onChange={e => setField('remarks', e.target.value)} />
            </div>
          </div>
          {formError && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive -mt-1">
              <AlertCircle className="h-4 w-4 shrink-0" />{formError}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>Batal</Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? 'Simpan Perubahan' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Hapus Data Output"
        description="Data production output ini akan dihapus secara permanen. Lanjutkan?"
        confirmText="Hapus" isLoading={isDeleting} />
    </OeeGuard>
  )
}
