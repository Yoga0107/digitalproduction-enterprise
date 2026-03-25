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
import { getShifts, createShift, updateShift, deleteShift } from '@/services/masterService'
import { toast } from 'sonner'
import { Loader2, Plus, Pencil, Trash2, AlertCircle, Clock, Timer } from 'lucide-react'
import { ApiError } from '@/lib/api-client'

const SHIFT_NAMES = [
  'Shift 1', 'Shift 2', 'Shift 3'
]

type ShiftRow = { id: number; name: string; from: string; to: string; remarks: string }
const EMPTY_FORM = { shiftName: '', from: '', to: '', remarks: '' }

export default function MasterShiftPage() {
  const [rows, setRows]             = useState<ShiftRow[]>([])
  const [isLoading, setIsLoading]   = useState(true)
  const [isSaving, setIsSaving]     = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing]       = useState<ShiftRow | null>(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [formError, setFormError]   = useState('')
  const [deleteId, setDeleteId]     = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setIsLoading(true)
      const data = await getShifts()
      setRows(data.map(s => ({
        id: s.id,
        name: s.name,
        from: s.time_from.slice(0, 5),
        to: s.time_to.slice(0, 5),
        remarks: s.remarks ?? '',
      })))
    } catch { toast.error('Gagal memuat data shift') }
    finally { setIsLoading(false) }
  }

  // Nama shift yang belum terdaftar → muncul di dropdown
  const availableNames = SHIFT_NAMES.filter(
    name => !rows.some(r => r.name === name && r.id !== editing?.id)
  )

  function openAdd() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setDialogOpen(true)
  }

  function openEdit(r: ShiftRow) {
    setEditing(r)
    setForm({ shiftName: r.name, from: r.from, to: r.to, remarks: r.remarks })
    setFormError('')
    setDialogOpen(true)
  }

  async function handleSave() {
    setFormError('')
    if (!form.shiftName) { setFormError('Pilih nama shift terlebih dahulu.'); return }
    if (!form.from || !form.to) { setFormError('Waktu mulai dan selesai wajib diisi.'); return }

    setIsSaving(true)
    try {
      const payload = {
        name: form.shiftName,
        time_from: form.from + ':00',
        time_to: form.to + ':00',
        remarks: form.remarks,
      }
      if (editing) {
        const u = await updateShift(editing.id, payload)
        setRows(prev => prev.map(r => r.id === editing.id
          ? { id: r.id, name: u.name, from: u.time_from.slice(0, 5), to: u.time_to.slice(0, 5), remarks: u.remarks ?? '' }
          : r
        ))
        toast.success('Shift berhasil diperbarui')
      } else {
        const c = await createShift(payload)
        setRows(prev => [...prev, {
          id: c.id, name: c.name,
          from: c.time_from.slice(0, 5), to: c.time_to.slice(0, 5),
          remarks: c.remarks ?? '',
        }])
        toast.success('Shift berhasil ditambahkan')
      }
      setDialogOpen(false)
    } catch (err) {
      if (err instanceof ApiError) setFormError(err.detail)
      else toast.error('Gagal menyimpan shift')
    } finally { setIsSaving(false) }
  }

  async function handleDelete() {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await deleteShift(deleteId)
      setRows(prev => prev.filter(r => r.id !== deleteId))
      toast.success('Shift berhasil dihapus')
    } catch { toast.error('Gagal menghapus shift') }
    finally { setIsDeleting(false); setDeleteId(null) }
  }

  const allRegistered = availableNames.length === 0

  return (
    
<OeeGuard section="master">
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50/30">
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-700 to-teal-600 px-8 py-10">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="relative flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Timer className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">Master Data</p>
              <h2 className="text-3xl font-bold text-white tracking-tight">Master Shift</h2>
              <p className="text-white/70 text-sm mt-1">Konfigurasi shift kerja mesin</p>
            </div>
          </div>
        </div>
        <div className="p-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-emerald-900">Master Shift</h1>
            <p className="text-emerald-600 text-sm mt-1">
              Shift Management
            </p>
          </div>
          <Button onClick={openAdd} disabled={allRegistered}>
            <Plus className="h-4 w-4 mr-2" />
            {allRegistered ? 'Semua shift terdaftar' : 'Tambah Shift'}
          </Button>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 text-sm text-emerald-600">
          <Clock className="h-4 w-4" />
          <span>{rows.length} shift terdaftar</span>
          <div className="flex gap-1 ml-2">
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Daftar Shift
              {!isLoading && (
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">{rows.length} / {SHIFT_NAMES.length}</Badge>
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
                    <TableHead>Nama Shift</TableHead>
                    <TableHead>Mulai</TableHead>
                    <TableHead>Selesai</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead className="text-center w-24">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-emerald-600">
                        Belum ada shift. Klik "Tambah Shift" untuk menambahkan.
                      </TableCell>
                    </TableRow>
                  ) : rows
                    // Urutkan berdasarkan nomor shift (Shift 1, Shift 2, ...)
                    .sort((a, b) => {
                      const na = SHIFT_NAMES.indexOf(a.name)
                      const nb = SHIFT_NAMES.indexOf(b.name)
                      return (na === -1 ? 99 : na) - (nb === -1 ? 99 : nb)
                    })
                    .map(r => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <span className="font-semibold">{r.name}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-emerald-200 text-emerald-700 font-mono">{r.from}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-emerald-200 text-emerald-700 font-mono">{r.to}</Badge>
                        </TableCell>
                        <TableCell className="text-emerald-600 text-sm">
                          {r.remarks || '-'}
                        </TableCell>
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
                    ))
                  }
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Form Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Shift' : 'Tambah Shift'}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">

              {/* Dropdown nama shift — hardcode Shift 1–10 */}
              <div className="space-y-1.5">
                <Label>
                  Nama Shift <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.shiftName}
                  onValueChange={v => setForm(f => ({ ...f, shiftName: v }))}
                  disabled={!!editing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih nama shift..." />
                  </SelectTrigger>
                  <SelectContent>
                    {editing
                   
                      ? SHIFT_NAMES.map(name => {
                          const takenByOther = rows.some(r => r.name === name && r.id !== editing.id)
                          return (
                            <SelectItem key={name} value={name} disabled={takenByOther}>
                              <div className="flex items-center gap-2">
                                <span>{name}</span>
                                {takenByOther && (
                                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-xs">Sudah ada</Badge>
                                )}
                              </div>
                            </SelectItem>
                          )
                        })
                      // Saat tambah: hanya tampilkan yang belum terdaftar
                      : availableNames.map(name => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))
                    }
                  </SelectContent>
                </Select>
                {editing && (
                  <p className="text-xs text-emerald-600">
                    Nama shift tidak dapat diubah setelah disimpan.
                  </p>
                )}
              </div>

              {/* Waktu — diisi manual */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Mulai <span className="text-destructive">*</span></Label>
                  <Input
                    type="time"
                    value={form.from}
                    onChange={e => setForm(f => ({ ...f, from: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Selesai <span className="text-destructive">*</span></Label>
                  <Input
                    type="time"
                    value={form.to}
                    onChange={e => setForm(f => ({ ...f, to: e.target.value }))}
                  />
                </div>
              </div>

              {/* Remarks */}
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
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {formError}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
                Batal
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? 'Simpan' : 'Tambah'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirm delete */}
        <ConfirmDialog
          open={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title="Hapus Shift"
          description="Shift akan dinonaktifkan dan tidak akan muncul lagi. Lanjutkan?"
          confirmText="Hapus"
          isLoading={isDeleting}
        />
          </div>
      </div>
    </OeeGuard>
  )
}
