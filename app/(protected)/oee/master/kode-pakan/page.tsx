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
import { getFeedCodes, createFeedCode, updateFeedCode, deleteFeedCode } from '@/services/masterService'
import { toast } from 'sonner'
import { Loader2, Plus, Pencil, Trash2, AlertCircle, Package } from 'lucide-react'
import { ApiError } from '@/lib/api-client'

type FeedRow = { id: number; code: string; remarks: string }
const EMPTY = { code: '', remarks: '' }

export default function MasterKodePakanPage() {
  const [rows, setRows] = useState<FeedRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<FeedRow | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [formError, setFormError] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setIsLoading(true)
      const data = await getFeedCodes()
      setRows(data.map(f => ({ id: f.id, code: f.code, remarks: f.remarks ?? '' })))
    } catch { toast.error('Gagal memuat data kode pakan') }
    finally { setIsLoading(false) }
  }

  function openAdd() { setEditing(null); setForm(EMPTY); setFormError(''); setDialogOpen(true) }
  function openEdit(r: FeedRow) { setEditing(r); setForm({ code: r.code, remarks: r.remarks }); setFormError(''); setDialogOpen(true) }

  async function handleSave() {
    setFormError('')
    if (!form.code.trim()) { setFormError('Kode pakan wajib diisi.'); return }
    setIsSaving(true)
    try {
      const payload = { code: form.code.trim().toUpperCase(), remarks: form.remarks }
      if (editing) {
        const u = await updateFeedCode(editing.id, payload)
        setRows(prev => prev.map(r => r.id === editing.id ? { id: r.id, code: u.code, remarks: u.remarks ?? '' } : r))
        toast.success('Kode pakan berhasil diperbarui')
      } else {
        // Cek duplikat lokal
        if (rows.some(r => r.code.toUpperCase() === payload.code)) { setFormError('Kode pakan sudah ada.'); setIsSaving(false); return }
        const c = await createFeedCode(payload)
        setRows(prev => [...prev, { id: c.id, code: c.code, remarks: c.remarks ?? '' }])
        toast.success('Kode pakan berhasil ditambahkan')
      }
      setDialogOpen(false)
    } catch (err) {
      if (err instanceof ApiError) setFormError(err.detail)
      else toast.error('Gagal menyimpan kode pakan')
    } finally { setIsSaving(false) }
  }

  async function handleDelete() {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await deleteFeedCode(deleteId)
      setRows(prev => prev.filter(r => r.id !== deleteId))
      toast.success('Kode pakan berhasil dihapus')
    } catch { toast.error('Gagal menghapus kode pakan') }
    finally { setIsDeleting(false); setDeleteId(null) }
  }

  return (
    
<OeeGuard section="master">
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50/30">
        <div className="relative overflow-hidden bg-gradient-to-r from-cyan-700 to-teal-600 px-8 py-10">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="relative flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Package className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">Master Data</p>
              <h2 className="text-3xl font-bold text-white tracking-tight">Kode Pakan</h2>
              <p className="text-white/70 text-sm mt-1">Master data kode pakan produksi</p>
            </div>
          </div>
        </div>
        <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-emerald-900">Master Kode Pakan</h1>
            <p className="text-emerald-600 text-sm mt-1">Kelola kode pakan untuk kalkulasi OEE</p>
          </div>
          <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" /> Tambah Kode Pakan</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Daftar Kode Pakan {!isLoading && <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">{rows.length} data</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode Pakan</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead className="text-center w-24">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-12 text-emerald-600">Belum ada data kode pakan</TableCell></TableRow>
                  ) : rows.map(r => (
                    <TableRow key={r.id}>
                      <TableCell><Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 font-mono text-sm">{r.code}</Badge></TableCell>
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
          <DialogContent className="sm:max-w-[380px]">
            <DialogHeader><DialogTitle>{editing ? 'Edit Kode Pakan' : 'Tambah Kode Pakan'}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Kode Pakan <span className="text-destructive">*</span></Label>
                <Input placeholder="Contoh: 771-2S" value={form.code}
                  onChange={e => setForm(f => ({...f, code: e.target.value.toUpperCase()}))}
                  className="font-mono" />
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
          title="Hapus Kode Pakan" description="Kode pakan akan dinonaktifkan. Lanjutkan?"
          confirmText="Hapus" isLoading={isDeleting} />
          </div>
      </div>
    </OeeGuard>
  )
}
