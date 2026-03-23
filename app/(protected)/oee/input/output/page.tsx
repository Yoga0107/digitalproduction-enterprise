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
import {
  getProductionOutputs, createProductionOutput,
  updateProductionOutput, deleteProductionOutput,
} from '@/services/inputService'
import { getLines, getShifts, getFeedCodes } from '@/services/masterService'
import { ApiProductionOutput, ApiLine, ApiShift, ApiFeedCode } from '@/types/api'
import { toast } from 'sonner'
import {
  Loader2, Plus, Pencil, Trash2, Activity,
  AlertCircle, TrendingUp, Package, Star, RotateCcw, XCircle, CheckCircle2,
} from 'lucide-react'
import { ApiError } from '@/lib/api-client'
import { cn } from '@/lib/utils'

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
  const fg  = n(form.finished_goods)
  const dg  = n(form.downgraded_product)
  const wip = n(form.wip)
  const rmx = n(form.remix)
  const rej = n(form.reject_product)
  const actual  = fg + dg + wip + rmx + rej
  const quality = actual > 0 ? parseFloat(((fg / actual) * 100).toFixed(2)) : 0
  return { actual, quality }
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

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function OutputPage() {
  const [rows, setRows]           = useState<ApiProductionOutput[]>([])
  const [lines, setLines]         = useState<ApiLine[]>([])
  const [shifts, setShifts]       = useState<ApiShift[]>([])
  const [feedCodes, setFeedCodes] = useState<ApiFeedCode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving]   = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing]       = useState<ApiProductionOutput | null>(null)
  const [form, setForm]             = useState<FormState>(EMPTY_FORM)
  const [formError, setFormError]   = useState('')

  const [filterDate, setFilterDate]   = useState('')
  const [filterLine, setFilterLine]   = useState('all')
  const [filterShift, setFilterShift] = useState('all')

  const [deleteId, setDeleteId]     = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Live quality gimmick
  const { actual: liveActual, quality: liveQuality } = computeLive(form)

  // ── Data load ─────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      setIsLoading(true)
      const [outputData, lineData, shiftData, fcData] = await Promise.all([
        getProductionOutputs(),
        getLines(),
        getShifts(),
        getFeedCodes(),
      ])
      setRows(outputData)
      setLines(lineData.filter(l => l.is_active))
      setShifts(shiftData.filter(s => s.is_active))
      setFeedCodes(fcData.filter(f => f.is_active))
    } catch {
      toast.error('Gagal memuat data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Form helpers ──────────────────────────────────────────────────────────
  function setField(key: keyof FormState, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function openAdd() {
    setEditing(null); setForm(EMPTY_FORM); setFormError(''); setDialogOpen(true)
  }

  function openEdit(row: ApiProductionOutput) {
    setEditing(row)
    setForm({
      date:               row.date.slice(0, 10),
      line_id:            String(row.line_id),
      shift_id:           String(row.shift_id),
      feed_code_id:       row.feed_code_id ? String(row.feed_code_id) : '',
      finished_goods:     String(row.finished_goods),
      downgraded_product: String(row.downgraded_product),
      wip:                String(row.wip),
      remix:              String(row.remix),
      reject_product:     String(row.reject_product),
      remarks:            row.remarks ?? '',
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
      const payload = {
        date:               new Date(form.date).toISOString(),
        line_id:            Number(form.line_id),
        shift_id:           Number(form.shift_id),
        feed_code_id:       form.feed_code_id ? Number(form.feed_code_id) : null,
        finished_goods:     n(form.finished_goods),
        downgraded_product: n(form.downgraded_product),
        wip:                n(form.wip),
        remix:              n(form.remix),
        reject_product:     n(form.reject_product),
        remarks:            form.remarks || undefined,
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
      setDialogOpen(false)
    } catch (err) {
      if (err instanceof ApiError) setFormError(err.detail)
      else toast.error('Gagal menyimpan data')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await deleteProductionOutput(deleteId)
      setRows(prev => prev.filter(r => r.id !== deleteId))
      toast.success('Data berhasil dihapus')
    } catch {
      toast.error('Gagal menghapus data')
    } finally {
      setIsDeleting(false); setDeleteId(null)
    }
  }

  // ── Filtered + summary ────────────────────────────────────────────────────
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <OeeGuard section="input">
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50/30">

        {/* Header */}
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

          {/* Toolbar */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-emerald-900">Production Output</h1>
              <p className="text-sm text-emerald-600 mt-0.5">
                Kode pakan dipilih bebas dari master kode pakan
              </p>
            </div>
            <Button
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-sm"
              onClick={openAdd}
            >
              <Plus className="h-4 w-4 mr-2" /> Tambah Output
            </Button>
          </div>

          {/* Filters */}
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

          {/* KPI Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Total Output',  value: fmt(totalAct), icon: Package,      color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Finished Goods', value: fmt(totalFG),  icon: CheckCircle2, color: 'text-teal-600',    bg: 'bg-teal-50'    },
              { label: 'Downgraded',    value: fmt(totalDG),  icon: TrendingUp,   color: 'text-blue-600',    bg: 'bg-blue-50'    },
              { label: 'WIP',           value: fmt(totalWIP), icon: RotateCcw,    color: 'text-yellow-600',  bg: 'bg-yellow-50'  },
              { label: 'Remix',         value: fmt(totalRmx), icon: Star,         color: 'text-orange-600',  bg: 'bg-orange-50'  },
              { label: 'Reject',        value: fmt(totalRej), icon: XCircle,      color: 'text-red-500',     bg: 'bg-red-50'     },
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

          {/* Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                Riwayat Production Output
                {!isLoading && (
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                    {filtered.length} record
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                </div>
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
                        <TableHead className="text-center w-20" />
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
                        <TableRow key={r.id}>
                          <TableCell className="text-sm font-medium whitespace-nowrap">{fmtDate(r.date)}</TableCell>
                          <TableCell className="text-sm">{r.line_name ?? '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{r.shift_name ?? '-'}</Badge>
                          </TableCell>
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
                          <TableCell>
                            <div className="flex justify-center gap-1">
                              <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost"
                                className="text-destructive hover:text-destructive"
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
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Entry Dialog ──────────────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-600" />
              {editing ? 'Edit Production Output' : 'Tambah Production Output'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">

            {/* ── Row 1: Date + Shift ── */}
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
                        {s.name}
                        <span className="ml-2 text-xs text-muted-foreground">{s.time_from} – {s.time_to}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ── Row 2: Line + Feed Code ── */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Line <span className="text-destructive">*</span></Label>
                <Select value={form.line_id} onValueChange={v => setField('line_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Pilih line…" /></SelectTrigger>
                  <SelectContent>
                    {lines.map(l => (
                      <SelectItem key={l.id} value={String(l.id)}>{l.name}{l.code ? ` (${l.code})` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>
                  Kode Pakan
                  <span className="ml-1 text-xs text-muted-foreground font-normal">dari master</span>
                </Label>
                <Select value={form.feed_code_id || 'none'} onValueChange={v => setField('feed_code_id', v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Pilih kode pakan…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-muted-foreground italic">— Tidak ada —</span>
                    </SelectItem>
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

            {/* ── 5 Output Fields ── */}
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-3">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-widest">
                Output Produksi (kg)
              </p>
              <div className="grid grid-cols-2 gap-4">

                {/* Finished Goods */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-teal-500" />
                    Finished Goods
                  </Label>
                  <Input
                    type="number" min={0} placeholder="0"
                    value={form.finished_goods}
                    onChange={e => setField('finished_goods', e.target.value)}
                  />
                </div>

                {/* Downgraded */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    Downgraded Product
                  </Label>
                  <Input
                    type="number" min={0} placeholder="0"
                    value={form.downgraded_product}
                    onChange={e => setField('downgraded_product', e.target.value)}
                  />
                </div>

                {/* WIP */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-yellow-500" />
                    WIP
                  </Label>
                  <Input
                    type="number" min={0} placeholder="0"
                    value={form.wip}
                    onChange={e => setField('wip', e.target.value)}
                  />
                </div>

                {/* Remix */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                    Remix
                  </Label>
                  <Input
                    type="number" min={0} placeholder="0"
                    value={form.remix}
                    onChange={e => setField('remix', e.target.value)}
                  />
                </div>

                {/* Reject */}
                <div className="space-y-1.5 col-span-2">
                  <Label className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    Reject
                  </Label>
                  <Input
                    type="number" min={0} placeholder="0"
                    value={form.reject_product}
                    onChange={e => setField('reject_product', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* ── Live Quality Gimmick ── */}
            {liveActual > 0 && (
              <div className="rounded-xl border bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-violet-600 uppercase tracking-widest">
                      Estimasi Quality Rate
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      FG ÷ Total Output × 100 — hanya tampilan
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-3xl font-black tabular-nums', qualityColor(liveQuality))}>
                      {liveQuality.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {fmt(n(form.finished_goods))} / {fmt(liveActual)} kg
                    </p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-3 w-full bg-white rounded-full overflow-hidden border border-violet-100">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', qualityBg(liveQuality))}
                    style={{ width: `${Math.min(liveQuality, 100)}%` }}
                  />
                </div>
                {/* Breakdown chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    { label: 'FG',  val: n(form.finished_goods),     color: 'bg-teal-100 text-teal-700'    },
                    { label: 'DG',  val: n(form.downgraded_product),  color: 'bg-blue-100 text-blue-700'    },
                    { label: 'WIP', val: n(form.wip),                 color: 'bg-yellow-100 text-yellow-700'},
                    { label: 'Rmx', val: n(form.remix),               color: 'bg-orange-100 text-orange-700'},
                    { label: 'Rej', val: n(form.reject_product),      color: 'bg-red-100 text-red-700'      },
                  ].filter(x => x.val > 0).map(x => (
                    <span key={x.label} className={cn('text-xs px-2 py-0.5 rounded-full font-medium', x.color)}>
                      {x.label}: {fmt(x.val)} kg
                      <span className="ml-1 opacity-60">
                        ({liveActual > 0 ? ((x.val / liveActual) * 100).toFixed(1) : 0}%)
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Remarks */}
            <div className="space-y-1.5">
              <Label>Remarks</Label>
              <Textarea
                placeholder="Keterangan opsional"
                rows={2}
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>Batal</Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? 'Simpan Perubahan' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
