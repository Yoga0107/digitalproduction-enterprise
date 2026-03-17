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
import { ConfirmDialog } from '@/components/confirm-dialog'
import { getLines, createLine, updateLine, deleteLine } from '@/services/masterService'
import { toast } from 'sonner'
import { Loader2, Plus, Pencil, Trash2, AlertCircle, Factory } from 'lucide-react'
import { ApiError } from '@/lib/api-client'

type LineRow = { id: number; name: string; code: string; remarks: string }
const EMPTY = { name: '', code: '', remarks: '' }

export default function MasterLinePage() {
  const [rows, setRows] = useState<LineRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<LineRow | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [formError, setFormError] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setIsLoading(true)
      const data = await getLines()
      setRows(data.map(l => ({ id: l.id, name: l.name, code: l.code ?? '', remarks: l.remarks ?? '' })))
    } catch { toast.error('Gagal memuat data line') }
    finally { setIsLoading(false) }
  }

  function openAdd() { setEditing(null); setForm(EMPTY); setFormError(''); setDialogOpen(true) }
  function openEdit(r: LineRow) { setEditing(r); setForm({ name: r.name, code: r.code, remarks: r.remarks }); setFormError(''); setDialogOpen(true) }

  async function handleSave() {
    setFormError('')
    if (!form.name.trim()) { setFormError('Nama line wajib diisi.'); return }
    setIsSaving(true)
    try {
      const payload = { name: form.name.trim(), code: form.code.trim() || undefined, remarks: form.remarks }
      if (editing) {
        const u = await updateLine(editing.id, payload)
        setRows(prev => prev.map(r => r.id === editing.id ? { id: r.id, name: u.name, code: u.code ?? '', remarks: u.remarks ?? '' } : r))
        toast.success('Line berhasil diperbarui')
      } else {
        const c = await createLine(payload)
        setRows(prev => [...prev, { id: c.id, name: c.name, code: c.code ?? '', remarks: c.remarks ?? '' }])
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
              <p className="text-white/70 text-sm mt-1">Konfigurasi lini produksi</p>
            </div>
          </div>
        </div>
        <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-emerald-900">Master Line</h1>
            <p className="text-emerald-600 text-sm mt-1">Kelola data line produksi</p>
          </div>
          <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" /> Tambah Line</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Daftar Line {!isLoading && <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">{rows.length} data</Badge>}
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
                    <TableHead>Kode</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead className="text-center w-24">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-12 text-emerald-600">Belum ada data line</TableCell></TableRow>
                  ) : rows.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{r.code ? <Badge variant="outline" className="border-emerald-200 text-emerald-700">{r.code}</Badge> : <span className="text-emerald-600">-</span>}</TableCell>
                      <TableCell className="text-emerald-600 text-sm">{r.remarks || '-'}</TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader><DialogTitle>{editing ? 'Edit Line' : 'Tambah Line'}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Nama Line <span className="text-destructive">*</span></Label>
                <Input placeholder="Contoh: Line 1" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
              </div>
              <div className="space-y-1.5">
                <Label>Kode</Label>
                <Input placeholder="Contoh: L1" value={form.code} onChange={e => setForm(f => ({...f, code: e.target.value}))} />
              </div>
              <div className="space-y-1.5">
                <Label>Remarks</Label>
                <Input placeholder="Keterangan opsional" value={form.remarks} onChange={e => setForm(f => ({...f, remarks: e.target.value}))} />
              </div>
              {formError && <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0" />{formError}</div>}
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

        <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
          title="Hapus Line" description="Line akan dinonaktifkan. Data throughput terkait mungkin terpengaruh. Lanjutkan?"
          confirmText="Hapus" isLoading={isDeleting} />
          </div>
      </div>
    </OeeGuard>
  )
}
