'use client'

import { useState, useEffect, useCallback } from 'react'
import { OeeGuard } from '@/components/oee/oee-guard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/confirm-dialog'

import { ApiProductionOutput, ApiLine, ApiShift } from '@/types/api'
import { toast } from 'sonner'
import { Loader2, Plus, Pencil, Trash2, Activity, AlertCircle, TrendingUp, Package, CheckCircle, XCircle } from 'lucide-react'
import { ApiError } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { getProductionOutputs, updateProductionOutput, createProductionOutput, deleteProductionOutput } from '@/services/inputService'
import { getLines, getShifts } from '@/services/masterService'

// ─── Types ────────────────────────────────────────────────────────────────────
type FormState = {
  date: string
  line_id: string
  shift_id: string
  feed_code_id: string   // auto dari line, tidak bisa diubah user
  production_plan: string
  actual_output: string
  good_product: string
  remarks: string
}

const EMPTY_FORM: FormState = {
  date: new Date().toISOString().slice(0, 10),
  line_id: '',
  shift_id: '',
  feed_code_id: '',
  production_plan: '',
  actual_output: '',
  good_product: '',
  remarks: '',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function computeDerived(actual: number, good: number) {
  const reject = Math.max(0, actual - good)
  const quality = actual > 0 ? parseFloat(((good / actual) * 100).toFixed(2)) : 0
  return { reject, quality }
}

function fmt(n: number | null | undefined) {
  if (n == null) return '-'
  return n.toLocaleString('id-ID')
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function qualityColor(rate: number) {
  if (rate >= 98) return 'text-emerald-600'
  if (rate >= 95) return 'text-yellow-600'
  return 'text-red-600'
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function OutputPage() {
  const [rows, setRows]           = useState<ApiProductionOutput[]>([])
  const [lines, setLines]         = useState<ApiLine[]>([])
  const [shifts, setShifts]       = useState<ApiShift[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving]   = useState(false)

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing]       = useState<ApiProductionOutput | null>(null)
  const [form, setForm]             = useState<FormState>(EMPTY_FORM)
  const [formError, setFormError]   = useState('')

  // Derived (computed from form)
  const actualNum = Number(form.actual_output) || 0
  const goodNum   = Number(form.good_product) || 0
  const { reject: derivedReject, quality: derivedQuality } = computeDerived(actualNum, goodNum)

  // Filter
  const [filterDate, setFilterDate]   = useState('')
  const [filterLine, setFilterLine]   = useState('all')
  const [filterShift, setFilterShift] = useState('all')

  // Delete
  const [deleteId, setDeleteId]     = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // ── Load ─────────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      setIsLoading(true)
      const [outputData, lineData, shiftData] = await Promise.all([
        getProductionOutputs(),
        getLines(),
        getShifts(),
      ])
      setRows(outputData)
      setLines(lineData.filter(l => l.is_active))
      setShifts(shiftData.filter(s => s.is_active))
    } catch {
      toast.error('Gagal memuat data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── When line changes: auto-fill feed_code from line.current_feed_code_id ───
  function handleLineChange(lineId: string) {
    const line = lines.find(l => String(l.id) === lineId)
    setForm(f => ({
      ...f,
      line_id: lineId,
      feed_code_id: line?.current_feed_code_id ? String(line.current_feed_code_id) : '',
    }))
  }

  // ── Open dialogs ─────────────────────────────────────────────────────────────
  function openAdd() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setDialogOpen(true)
  }

  function openEdit(row: ApiProductionOutput) {
    setEditing(row)
    setForm({
      date:            row.date.slice(0, 10),
      line_id:         String(row.line_id),
      shift_id:        String(row.shift_id),
      feed_code_id:    row.feed_code_id ? String(row.feed_code_id) : '',
      production_plan: row.production_plan != null ? String(row.production_plan) : '',
      actual_output:   String(row.actual_output),
      good_product:    String(row.good_product),
      remarks:         row.remarks ?? '',
    })
    setFormError('')
    setDialogOpen(true)
  }

  // ── Save ─────────────────────────────────────────────────────────────────────
  async function handleSave() {
    setFormError('')
    if (!form.date)          { setFormError('Tanggal wajib diisi.'); return }
    if (!form.line_id)       { setFormError('Line wajib dipilih.'); return }
    if (!form.shift_id)      { setFormError('Shift wajib dipilih.'); return }
    if (!form.actual_output) { setFormError('Total Output wajib diisi.'); return }
    if (!form.good_product)  { setFormError('Good Product wajib diisi.'); return }

    const actual = Number(form.actual_output)
    const good   = Number(form.good_product)
    if (good > actual) { setFormError('Good Product tidak boleh lebih dari Total Output.'); return }

    setIsSaving(true)
    try {
      const payload = {
        date:            new Date(form.date).toISOString(),
        line_id:         Number(form.line_id),
        shift_id:        Number(form.shift_id),
        feed_code_id:    form.feed_code_id ? Number(form.feed_code_id) : null,
        production_plan: form.production_plan ? Number(form.production_plan) : null,
        actual_output:   actual,
        good_product:    good,
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
      setDialogOpen(false)
    } catch (err) {
      if (err instanceof ApiError) setFormError(err.detail)
      else toast.error('Gagal menyimpan data')
    } finally { setIsSaving(false) }
  }

  // ── Delete ───────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await deleteProductionOutput(deleteId)
      setRows(prev => prev.filter(r => r.id !== deleteId))
      toast.success('Data berhasil dihapus')
    } catch { toast.error('Gagal menghapus data') }
    finally { setIsDeleting(false); setDeleteId(null) }
  }

  // ── Filtered rows ─────────────────────────────────────────────────────────────
  const filtered = rows.filter(r => {
    if (filterDate && !r.date.startsWith(filterDate)) return false
    if (filterLine !== 'all' && r.line_id !== Number(filterLine)) return false
    if (filterShift !== 'all' && r.shift_id !== Number(filterShift)) return false
    return true
  })

  // ── KPI totals ───────────────────────────────────────────────────────────────
  const totalPlan   = filtered.reduce((s, r) => s + (r.production_plan ?? 0), 0)
  const totalOutput = filtered.reduce((s, r) => s + r.actual_output, 0)
  const totalGood   = filtered.reduce((s, r) => s + r.good_product, 0)
  const totalReject = filtered.reduce((s, r) => s + r.reject_product, 0)
  const avgQuality  = filtered.length > 0
    ? parseFloat((filtered.reduce((s, r) => s + r.quality_rate, 0) / filtered.length).toFixed(2))
    : 0

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
            <h2 className="text-3xl font-bold text-white tracking-tight">Input Output Produksi</h2>
            <p className="text-white/70 text-sm mt-1">Data produksi harian per shift per line</p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">

        {/* Action */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-emerald-900">Production Output</h1>
            <p className="text-sm text-emerald-600 mt-0.5">
              Kode pakan otomatis terisi dari line yang dipilih
            </p>
          </div>
          <Button
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-sm"
            onClick={openAdd}
          >
            <Plus className="h-4 w-4 mr-2" /> Tambah Output
          </Button>
        </div>

        {/* Filter */}
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
              <Button variant="outline" className="w-full" onClick={() => { setFilterDate(''); setFilterLine('all'); setFilterShift('all') }}>
                Reset Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: 'Production Plan', value: fmt(totalPlan), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Total Output',    value: fmt(totalOutput), icon: Package,   color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Good Product',    value: fmt(totalGood),   icon: CheckCircle, color: 'text-teal-600', bg: 'bg-teal-50' },
            { label: 'Reject',          value: fmt(totalReject), icon: XCircle,   color: 'text-red-500', bg: 'bg-red-50' },
            { label: 'Avg Quality',     value: `${avgQuality}%`, icon: Activity,  color: qualityColor(avgQuality), bg: 'bg-violet-50' },
          ].map(k => (
            <Card key={k.label} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', k.bg)}>
                  <k.icon className={cn('h-5 w-5', k.color)} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                  <p className={cn('text-lg font-bold', k.color)}>{k.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              Riwayat Produksi
              {!isLoading && <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">{filtered.length} data</Badge>}
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
                      <TableHead className="text-right">Plan</TableHead>
                      <TableHead className="text-right">Output</TableHead>
                      <TableHead className="text-right">Good</TableHead>
                      <TableHead className="text-right">Reject</TableHead>
                      <TableHead className="text-right">Quality %</TableHead>
                      <TableHead>Remarks</TableHead>
                      <TableHead className="text-center w-20">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-12 text-muted-foreground">
                          Belum ada data. Klik <strong>Tambah Output</strong> untuk memulai.
                        </TableCell>
                      </TableRow>
                    ) : filtered.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="text-sm font-medium">{fmtDate(r.date)}</TableCell>
                        <TableCell>{r.line_name ?? '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{r.shift_name ?? '-'}</Badge>
                        </TableCell>
                        <TableCell>
                          {r.feed_code_code
                            ? <Badge className="bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-100 text-xs">{r.feed_code_code}</Badge>
                            : <span className="text-muted-foreground text-xs">-</span>}
                        </TableCell>
                        <TableCell className="text-right text-sm">{r.production_plan != null ? fmt(r.production_plan) : <span className="text-muted-foreground">-</span>}</TableCell>
                        <TableCell className="text-right text-sm font-medium">{fmt(r.actual_output)}</TableCell>
                        <TableCell className="text-right text-sm text-emerald-700">{fmt(r.good_product)}</TableCell>
                        <TableCell className="text-right text-sm text-red-600">{fmt(r.reject_product)}</TableCell>
                        <TableCell className="text-right">
                          <span className={cn('text-sm font-semibold', qualityColor(r.quality_rate))}>
                            {r.quality_rate.toFixed(2)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-32 truncate">{r.remarks || '-'}</TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-1">
                            <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(r.id)}>
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

    {/* ── Add / Edit Dialog ──────────────────────────────────────────────────── */}
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="sm:max-w-[580px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-600" />
            {editing ? 'Edit Production Output' : 'Tambah Production Output'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">

          {/* Date */}
          <div className="space-y-1.5">
            <Label>Tanggal <span className="text-destructive">*</span></Label>
            <Input type="date" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>

          {/* Shift */}
          <div className="space-y-1.5">
            <Label>Shift <span className="text-destructive">*</span></Label>
            <Select value={form.shift_id} onValueChange={v => setForm(f => ({ ...f, shift_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Pilih shift..." /></SelectTrigger>
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

          {/* Line */}
          <div className="space-y-1.5">
            <Label>Line <span className="text-destructive">*</span></Label>
            <Select value={form.line_id} onValueChange={handleLineChange}>
              <SelectTrigger><SelectValue placeholder="Pilih line..." /></SelectTrigger>
              <SelectContent>
                {lines.map(l => (
                  <SelectItem key={l.id} value={String(l.id)}>
                    {l.name}
                    {l.current_feed_code_code && (
                      <span className="ml-2 text-xs text-blue-600">({l.current_feed_code_code})</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Kode Pakan — auto, grey out */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              Kode Pakan
              <span className="text-xs text-muted-foreground font-normal">(otomatis dari line)</span>
            </Label>
            <Input
              value={
                form.feed_code_id
                  ? (lines.find(l => l.current_feed_code_id === Number(form.feed_code_id))?.current_feed_code_code
                      ?? lines.find(l => String(l.current_feed_code_id) === form.feed_code_id)?.current_feed_code_code
                      ?? `ID: ${form.feed_code_id}`)
                  : '— Tidak ada —'
              }
              readOnly
              className="bg-muted/50 text-muted-foreground cursor-not-allowed"
            />
          </div>

          {/* Production Plan */}
          <div className="space-y-1.5">
            <Label>Production Plan (kg)</Label>
            <Input type="number" min={0} placeholder="Contoh: 10000"
              value={form.production_plan}
              onChange={e => setForm(f => ({ ...f, production_plan: e.target.value }))} />
          </div>

          {/* Total Output */}
          <div className="space-y-1.5">
            <Label>Total Output (kg) <span className="text-destructive">*</span></Label>
            <Input type="number" min={0} placeholder="Contoh: 9500"
              value={form.actual_output}
              onChange={e => setForm(f => ({ ...f, actual_output: e.target.value }))} />
          </div>

          {/* Good Product */}
          <div className="space-y-1.5">
            <Label>Good Product (kg) <span className="text-destructive">*</span></Label>
            <Input type="number" min={0} placeholder="Contoh: 9300"
              value={form.good_product}
              onChange={e => setForm(f => ({ ...f, good_product: e.target.value }))} />
          </div>

          {/* Reject — computed, grey out */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              Reject Product (kg)
              <span className="text-xs text-muted-foreground font-normal">(otomatis)</span>
            </Label>
            <Input
              value={actualNum > 0 ? derivedReject : ''}
              readOnly
              placeholder="—"
              className={cn(
                'bg-muted/50 cursor-not-allowed',
                derivedReject > 0 ? 'text-red-600 font-medium' : 'text-muted-foreground'
              )}
            />
          </div>

          {/* Quality Rate — computed, grey out */}
          <div className="space-y-1.5 col-span-2">
            <Label className="flex items-center gap-1.5">
              Quality Rate (%)
              <span className="text-xs text-muted-foreground font-normal">(otomatis = Good ÷ Output × 100)</span>
            </Label>
            <div className="relative">
              <Input
                value={actualNum > 0 ? `${derivedQuality}%` : ''}
                readOnly
                placeholder="—"
                className={cn(
                  'bg-muted/50 cursor-not-allowed font-semibold',
                  actualNum > 0 ? qualityColor(derivedQuality) : 'text-muted-foreground'
                )}
              />
              {actualNum > 0 && (
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <div className={cn(
                    'h-2 rounded-full',
                    derivedQuality >= 98 ? 'bg-emerald-400' : derivedQuality >= 95 ? 'bg-yellow-400' : 'bg-red-400'
                  )} style={{ width: `${Math.min(derivedQuality, 100)}px` }} />
                </div>
              )}
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-1.5 col-span-2">
            <Label>Remarks</Label>
            <Textarea placeholder="Catatan tambahan (opsional)"
              rows={2} value={form.remarks}
              onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} />
          </div>

        </div>

        {formError && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive -mt-1">
            <AlertCircle className="h-4 w-4 shrink-0" />{formError}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>Batal</Button>
          <Button onClick={handleSave} disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editing ? 'Simpan Perubahan' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <ConfirmDialog
      open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
      title="Hapus Data Output"
      description="Data produksi ini akan dihapus permanen. Lanjutkan?"
      confirmText="Hapus" isLoading={isDeleting}
    />
  </OeeGuard>
  )
}
