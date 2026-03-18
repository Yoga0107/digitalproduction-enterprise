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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { getLines, createLine, updateLine, deleteLine, getFeedCodes, setLineFeedCode } from '@/services/masterService'
import { ApiLine, ApiFeedCode } from '@/types/api'
import { toast } from 'sonner'
import { Loader2, Plus, Pencil, Trash2, AlertCircle, Factory, Tag, ArrowLeftRight } from 'lucide-react'
import { ApiError } from '@/lib/api-client'

type LineRow = {
  id: number
  name: string
  code: string
  remarks: string
  current_feed_code_id: number | null
  current_feed_code_code: string | null
}

const EMPTY_FORM = { name: '', code: '', remarks: '' }

export default function MasterLinePage() {
  const [rows, setRows]               = useState<LineRow[]>([])
  const [feedCodes, setFeedCodes]     = useState<ApiFeedCode[]>([])
  const [isLoading, setIsLoading]     = useState(true)
  const [isSaving, setIsSaving]       = useState(false)

  // Dialog tambah / edit line
  const [dialogOpen, setDialogOpen]   = useState(false)
  const [editing, setEditing]         = useState<LineRow | null>(null)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [formError, setFormError]     = useState('')

  // Dialog ganti kode pakan
  const [fcDialogOpen, setFcDialogOpen] = useState(false)
  const [fcTarget, setFcTarget]         = useState<LineRow | null>(null)
  const [fcSelected, setFcSelected]     = useState<string>('none')
  const [fcSaving, setFcSaving]         = useState(false)

  // Confirm delete
  const [deleteId, setDeleteId]   = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setIsLoading(true)
      const [lineData, fcData] = await Promise.all([getLines(), getFeedCodes()])
      setFeedCodes(fcData.filter(f => f.is_active))
      setRows(lineData.map(toRow))
    } catch {
      toast.error('Gagal memuat data')
    } finally {
      setIsLoading(false)
    }
  }

  function toRow(l: ApiLine): LineRow {
    return {
      id: l.id,
      name: l.name,
      code: l.code ?? '',
      remarks: l.remarks ?? '',
      current_feed_code_id: l.current_feed_code_id,
      current_feed_code_code: l.current_feed_code_code,
    }
  }

  // ── Add / Edit Line ──────────────────────────────────────────────────────────
  function openAdd() {
    setEditing(null); setForm(EMPTY_FORM); setFormError(''); setDialogOpen(true)
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
      const payload = { name: form.name.trim(), code: form.code.trim() || undefined, remarks: form.remarks }
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

  // ── Ganti Kode Pakan ────────────────────────────────────────────────────────
  function openFeedCodeDialog(r: LineRow) {
    setFcTarget(r)
    setFcSelected(r.current_feed_code_id ? String(r.current_feed_code_id) : 'none')
    setFcDialogOpen(true)
  }

  async function handleSetFeedCode() {
    if (!fcTarget) return
    setFcSaving(true)
    try {
      const newId = fcSelected === 'none' ? null : Number(fcSelected)
      const u = await setLineFeedCode(fcTarget.id, newId)
      setRows(prev => prev.map(r => r.id === fcTarget.id ? toRow(u) : r))
      toast.success(newId ? 'Kode pakan berhasil diganti' : 'Kode pakan berhasil dihapus dari line')
      setFcDialogOpen(false)
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.detail)
      else toast.error('Gagal mengatur kode pakan')
    } finally { setFcSaving(false) }
  }

  // ── Delete ───────────────────────────────────────────────────────────────────
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

  return (
<OeeGuard section="master">
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50/30">
      <div className="relative overflow-hidden bg-gradient-to-r from-teal-700 to-cyan-600 px-8 py-10">
        <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
            <Factory className="h-7 w-7 text-white" />
          </div>
          <div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">Master Data</p>
            <h2 className="text-3xl font-bold text-white tracking-tight">Master Line</h2>
            <p className="text-white/70 text-sm mt-1">Konfigurasi lini produksi &amp; kode pakan</p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-emerald-900">Master Line</h1>
            <p className="text-emerald-600 text-sm mt-1">
              Setiap line memiliki satu kode pakan aktif. Klik <strong>Ganti Kode Pakan</strong> untuk mengubahnya.
            </p>
          </div>
          <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" /> Tambah Line</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Daftar Line
              {!isLoading && <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">{rows.length} data</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Line</TableHead>
                    <TableHead>Kode Line</TableHead>
                    <TableHead>
                      <span className="flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5" /> Kode Pakan Aktif
                      </span>
                    </TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead className="text-center w-36">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-emerald-600">
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
                      <TableCell>
                        {r.current_feed_code_code ? (
                          <div className="flex items-center gap-2">
                            <Badge className="bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-100">
                              {r.current_feed_code_code}
                            </Badge>
                            <Button
                              size="sm" variant="ghost"
                              className="h-6 px-2 text-xs text-muted-foreground hover:text-blue-600"
                              onClick={() => openFeedCodeDialog(r)}
                            >
                              <ArrowLeftRight className="h-3 w-3 mr-1" /> Ganti
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm" variant="outline"
                            className="h-7 text-xs border-dashed border-emerald-300 text-emerald-600 hover:border-emerald-500"
                            onClick={() => openFeedCodeDialog(r)}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Set Kode Pakan
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{r.remarks || '-'}</TableCell>
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>

    {/* ── Dialog Tambah / Edit Line ─────────────────────────────────────────── */}
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader><DialogTitle>{editing ? 'Edit Line' : 'Tambah Line'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Nama Line <span className="text-destructive">*</span></Label>
            <Input placeholder="Contoh: Line 1"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Kode Line</Label>
            <Input placeholder="Contoh: L1"
              value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Remarks</Label>
            <Input placeholder="Keterangan opsional"
              value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} />
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

    {/* ── Dialog Ganti Kode Pakan ───────────────────────────────────────────── */}
    <Dialog open={fcDialogOpen} onOpenChange={setFcDialogOpen}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-blue-600" />
            {fcTarget?.current_feed_code_id ? 'Ganti Kode Pakan' : 'Set Kode Pakan'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Line: <span className="font-medium text-foreground">{fcTarget?.name}</span>
          </p>
          {fcTarget?.current_feed_code_code && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Saat ini:</span>
              <Badge className="bg-blue-100 text-blue-700 border border-blue-200">
                {fcTarget.current_feed_code_code}
              </Badge>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Kode Pakan Baru</Label>
            <Select value={fcSelected} onValueChange={setFcSelected}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih kode pakan..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground italic">— Tidak ada (hapus kode pakan) —</span>
                </SelectItem>
                {feedCodes.map(fc => (
                  <SelectItem key={fc.id} value={String(fc.id)}>
                    <span className="font-mono font-medium">{fc.code}</span>
                    {fc.remarks && <span className="ml-2 text-muted-foreground text-xs">{fc.remarks}</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {feedCodes.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                Belum ada kode pakan. Tambahkan di menu Master → Kode Pakan terlebih dahulu.
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setFcDialogOpen(false)} disabled={fcSaving}>Batal</Button>
          <Button onClick={handleSetFeedCode} disabled={fcSaving || feedCodes.length === 0}>
            {fcSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <ConfirmDialog
      open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
      title="Hapus Line"
      description="Line akan dinonaktifkan. Kode pakan yang terpasang akan dilepas. Lanjutkan?"
      confirmText="Hapus" isLoading={isDeleting}
    />
</OeeGuard>
  )
}
