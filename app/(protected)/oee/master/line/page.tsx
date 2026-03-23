'use client'

import { useState, useEffect } from 'react'
import { OeeGuard } from '@/components/oee/oee-guard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { ConfirmDialog } from '@/components/confirm-dialog'
import {
  getLines, createLine, updateLine, deleteLine,
  getMergedLines, createMergedLine, updateMergedLine, deleteMergedLine,
} from '@/services/masterService'
import { ApiLine, ApiMergedLine } from '@/types/api'
import { toast } from 'sonner'
import {
  Loader2, Plus, Pencil, Trash2, AlertCircle,
  Factory, GitMerge, Layers,
} from 'lucide-react'
import { ApiError } from '@/lib/api-client'

// ─── Types ───────────────────────────────────────────────────────────────────
type LineRow = {
  id: number
  name: string
  code: string
  remarks: string
}

type MergedRow = {
  id: number
  name: string
  code: string
  remarks: string
  members: { line_id: number; line_name: string; line_code: string | null }[]
}

const EMPTY_LINE_FORM   = { name: '', code: '', remarks: '' }
const EMPTY_MERGED_FORM = { name: '', code: '', remarks: '' }

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MasterLinePage() {

  // ── Master Line state ──────────────────────────────────────────────────────
  const [rows, setRows]             = useState<LineRow[]>([])
  const [isLoading, setIsLoading]   = useState(true)
  const [isSaving, setIsSaving]     = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing]       = useState<LineRow | null>(null)
  const [form, setForm]             = useState(EMPTY_LINE_FORM)
  const [formError, setFormError]   = useState('')
  const [deleteId, setDeleteId]     = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // ── Merged Line state ──────────────────────────────────────────────────────
  const [mergedRows, setMergedRows]               = useState<MergedRow[]>([])
  const [mergedLoading, setMergedLoading]         = useState(true)
  const [mergedDialogOpen, setMergedDialogOpen]   = useState(false)
  const [editingMerged, setEditingMerged]         = useState<MergedRow | null>(null)
  const [mergedForm, setMergedForm]               = useState(EMPTY_MERGED_FORM)
  const [mergedSelectedIds, setMergedSelectedIds] = useState<number[]>([])
  const [mergedFormError, setMergedFormError]     = useState('')
  const [mergedSaving, setMergedSaving]           = useState(false)
  const [deleteMergedId, setDeleteMergedId]       = useState<number | null>(null)
  const [isDeletingMerged, setIsDeletingMerged]   = useState(false)

  // ── Load ───────────────────────────────────────────────────────────────────
  useEffect(() => { load() }, [])

  async function load() {
    try {
      setIsLoading(true); setMergedLoading(true)
      const [lineData, mergedData] = await Promise.all([getLines(), getMergedLines()])
      setRows(lineData.map(toRow))
      setMergedRows(mergedData.map(toMergedRow))
    } catch {
      toast.error('Gagal memuat data')
    } finally {
      setIsLoading(false); setMergedLoading(false)
    }
  }

  function toRow(l: ApiLine): LineRow {
    return { id: l.id, name: l.name, code: l.code ?? '', remarks: l.remarks ?? '' }
  }

  function toMergedRow(m: ApiMergedLine): MergedRow {
    return { id: m.id, name: m.name, code: m.code ?? '', remarks: m.remarks ?? '', members: m.members }
  }

  // ── Master Line handlers ───────────────────────────────────────────────────
  function openAdd() {
    setEditing(null); setForm(EMPTY_LINE_FORM); setFormError(''); setDialogOpen(true)
  }

  function openEdit(r: LineRow) {
    setEditing(r)
    setForm({ name: r.name, code: r.code, remarks: r.remarks })
    setFormError('')
    setDialogOpen(true)
  }

  async function handleSave() {
    setFormError('')
    if (!form.name.trim()) { setFormError('Nama line wajib diisi.'); return }
    setIsSaving(true)
    try {
      const payload = { name: form.name.trim(), code: form.code.trim() || undefined, remarks: form.remarks || undefined }
      if (editing) {
        const u = await updateLine(editing.id, payload)
        setRows(prev => prev.map(r => r.id === editing.id ? toRow(u) : r))
        toast.success('Line berhasil diperbarui')
      } else {
        const c = await createLine(payload)
        setRows(prev => [...prev, toRow(c)])
        toast.success('Line berhasil ditambahkan')
      }
      setDialogOpen(false)
    } catch (err) {
      if (err instanceof ApiError) setFormError(err.detail)
      else toast.error('Gagal menyimpan line')
    } finally { setIsSaving(false) }
  }

  async function handleDelete() {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await deleteLine(deleteId)
      setRows(prev => prev.filter(r => r.id !== deleteId))
      toast.success('Line berhasil dihapus')
    } catch { toast.error('Gagal menghapus line') }
    finally { setIsDeleting(false); setDeleteId(null) }
  }

  // ── Merged Line handlers ───────────────────────────────────────────────────
  function openAddMerged() {
    setEditingMerged(null); setMergedForm(EMPTY_MERGED_FORM)
    setMergedSelectedIds([]); setMergedFormError(''); setMergedDialogOpen(true)
  }

  function openEditMerged(r: MergedRow) {
    setEditingMerged(r)
    setMergedForm({ name: r.name, code: r.code, remarks: r.remarks })
    setMergedSelectedIds(r.members.map(m => m.line_id))
    setMergedFormError('')
    setMergedDialogOpen(true)
  }

  function toggleMergedLine(id: number) {
    setMergedSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  async function handleSaveMerged() {
    setMergedFormError('')
    if (!mergedForm.name.trim()) { setMergedFormError('Nama merged line wajib diisi.'); return }
    if (mergedSelectedIds.length < 2) { setMergedFormError('Pilih minimal 2 line untuk digabungkan.'); return }
    setMergedSaving(true)
    try {
      const payload = {
        name: mergedForm.name.trim(),
        code: mergedForm.code.trim() || undefined,
        remarks: mergedForm.remarks || undefined,
        line_ids: mergedSelectedIds,
      }
      if (editingMerged) {
        const u = await updateMergedLine(editingMerged.id, payload)
        setMergedRows(prev => prev.map(r => r.id === editingMerged.id ? toMergedRow(u) : r))
        toast.success('Merged line berhasil diperbarui')
      } else {
        const c = await createMergedLine(payload)
        setMergedRows(prev => [...prev, toMergedRow(c)])
        toast.success('Merged line berhasil dibuat')
      }
      setMergedDialogOpen(false)
    } catch (err) {
      if (err instanceof ApiError) setMergedFormError(err.detail)
      else toast.error('Gagal menyimpan merged line')
    } finally { setMergedSaving(false) }
  }

  async function handleDeleteMerged() {
    if (!deleteMergedId) return
    setIsDeletingMerged(true)
    try {
      await deleteMergedLine(deleteMergedId)
      setMergedRows(prev => prev.filter(r => r.id !== deleteMergedId))
      toast.success('Merged line berhasil dihapus')
    } catch { toast.error('Gagal menghapus merged line') }
    finally { setIsDeletingMerged(false); setDeleteMergedId(null) }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <OeeGuard section="master">
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50/30">

        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-teal-700 to-cyan-600 px-8 py-10">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="relative flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Factory className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">Master Data</p>
              <h2 className="text-3xl font-bold text-white tracking-tight">Master Line</h2>
              <p className="text-white/70 text-sm mt-1">Konfigurasi line produksi</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-10">

          {/* ═══════════════════════ SECTION 1 — MASTER LINE ═══════════════════════ */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Layers className="h-5 w-5 text-emerald-700" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-emerald-900">Master Line</h1>
                  <p className="text-emerald-600 text-sm">Daftar line produksi yang tersedia di plant ini.</p>
                </div>
              </div>
              <Button onClick={openAdd}>
                <Plus className="h-4 w-4 mr-2" /> Tambah Line
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  Daftar Line
                  {!isLoading && (
                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">{rows.length} data</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Line</TableHead>
                        <TableHead>Kode Line</TableHead>
                        <TableHead>Remarks</TableHead>
                        <TableHead className="text-center w-28">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-12 text-emerald-600">
                            Belum ada data line
                          </TableCell>
                        </TableRow>
                      ) : rows.map(r => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.name}</TableCell>
                          <TableCell>
                            {r.code
                              ? <Badge variant="outline" className="border-emerald-200 text-emerald-700">{r.code}</Badge>
                              : <span className="text-muted-foreground text-sm">-</span>}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{r.remarks || '-'}</TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-1">
                              <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm" variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeleteId(r.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ═══════════════════════ SECTION 2 — MERGED LINE ═══════════════════════ */}
          <div className="space-y-4">
            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-200 to-transparent" />
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-200">
                <GitMerge className="h-3.5 w-3.5 text-violet-500" />
                <span className="text-xs font-semibold uppercase tracking-widest text-violet-500">Line Gabungan</span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-200 to-transparent" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-violet-100 flex items-center justify-center">
                  <GitMerge className="h-5 w-5 text-violet-700" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-violet-900">Merged Line</h2>
                  <p className="text-violet-600 text-sm">Data line gabungan</p>
                </div>
              </div>
              <Button
                onClick={openAddMerged}
                className="bg-violet-600 hover:bg-violet-700 text-white"
                disabled={rows.length < 2}
              >
                <Plus className="h-4 w-4 mr-2" /> Tambah Merged Line
              </Button>
            </div>

            <Card className="border-violet-100">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  Daftar Merged Line
                  {!mergedLoading && (
                    <Badge className="bg-violet-100 text-violet-800 hover:bg-violet-100">{mergedRows.length} data</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mergedLoading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Merged Line</TableHead>
                        <TableHead>Kode</TableHead>
                        <TableHead>Line yang Digabung</TableHead>
                        <TableHead>Remarks</TableHead>
                        <TableHead className="text-center w-28">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mergedRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12 text-violet-500">
                            Belum ada merged line. Klik <strong>Tambah Merged Line</strong> untuk membuat.
                          </TableCell>
                        </TableRow>
                      ) : mergedRows.map(r => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.name}</TableCell>
                          <TableCell>
                            {r.code
                              ? <Badge variant="outline" className="border-violet-200 text-violet-700">{r.code}</Badge>
                              : <span className="text-muted-foreground text-sm">-</span>}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1.5">
                              {r.members.map(m => (
                                <Badge
                                  key={m.line_id}
                                  className="bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-50 text-xs"
                                >
                                  {m.line_code ? `${m.line_code} – ` : ''}{m.line_name}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{r.remarks || '-'}</TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-1">
                              <Button size="sm" variant="ghost" onClick={() => openEditMerged(r)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm" variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeleteMergedId(r.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ── Dialog: Tambah / Edit Master Line ─────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Line' : 'Tambah Line'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nama Line <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Contoh: Line 1"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Kode Line</Label>
              <Input
                placeholder="Contoh: L1"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Remarks</Label>
              <Input
                placeholder="Keterangan opsional"
                value={form.remarks}
                onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
              />
            </div>
            {formError && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />{formError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>Batal</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? 'Simpan' : 'Tambah'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Tambah / Edit Merged Line ─────────────────────────────────── */}
      <Dialog open={mergedDialogOpen} onOpenChange={setMergedDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitMerge className="h-4 w-4 text-violet-600" />
              {editingMerged ? 'Edit Merged Line' : 'Tambah Merged Line'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nama Merged Line <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Contoh: Line Gabungan A"
                value={mergedForm.name}
                onChange={e => setMergedForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Kode</Label>
              <Input
                placeholder="Contoh: LG-A"
                value={mergedForm.code}
                onChange={e => setMergedForm(f => ({ ...f, code: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Remarks</Label>
              <Input
                placeholder="Keterangan opsional"
                value={mergedForm.remarks}
                onChange={e => setMergedForm(f => ({ ...f, remarks: e.target.value }))}
              />
            </div>

            {/* Line checklist */}
            <div className="space-y-2">
              <Label>
                Pilih Line yang Digabung <span className="text-destructive">*</span>
                <span className="ml-1 text-xs text-muted-foreground font-normal">(minimal 2)</span>
              </Label>
              <div className="rounded-lg border divide-y max-h-52 overflow-y-auto">
                {rows.length === 0 ? (
                  <p className="text-sm text-center text-muted-foreground py-4">
                    Belum ada master line.
                  </p>
                ) : rows.map(r => {
                  const checked = mergedSelectedIds.includes(r.id)
                  return (
                    <div
                      key={r.id}
                      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                        checked ? 'bg-violet-50' : 'hover:bg-slate-50'
                      }`}
                      onClick={() => toggleMergedLine(r.id)}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleMergedLine(r.id)}
                        className="data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm font-medium">{r.name}</span>
                        {r.code && (
                          <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700">
                            {r.code}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              {mergedSelectedIds.length > 0 && (
                <p className="text-xs text-violet-600">{mergedSelectedIds.length} line dipilih</p>
              )}
            </div>

            {mergedFormError && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />{mergedFormError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMergedDialogOpen(false)} disabled={mergedSaving}>Batal</Button>
            <Button
              onClick={handleSaveMerged}
              disabled={mergedSaving}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {mergedSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingMerged ? 'Simpan' : 'Tambah'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirm Dialogs ────────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Hapus Line"
        description="Line akan dinonaktifkan. Data line individu tidak terpengaruh pada merged line yang sudah ada. Lanjutkan?"
        confirmText="Hapus" isLoading={isDeleting}
      />
      <ConfirmDialog
        open={!!deleteMergedId} onClose={() => setDeleteMergedId(null)} onConfirm={handleDeleteMerged}
        title="Hapus Merged Line"
        description="Merged line ini akan dihapus. Data line individu tidak terpengaruh. Lanjutkan?"
        confirmText="Hapus" isLoading={isDeletingMerged}
      />
    </OeeGuard>
  )
}
