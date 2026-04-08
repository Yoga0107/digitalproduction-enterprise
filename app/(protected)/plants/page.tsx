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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import { ConfirmDialog } from '@/components/confirm-dialog'

import { ApiPlant } from '@/types/api'
import { toast } from 'sonner'
import {
  Factory, Plus, Pencil, Power, PowerOff, RefreshCw,
  AlertCircle, Loader2, Database, CheckCircle2, XCircle,
} from 'lucide-react'
import { ApiError } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { listAllPlants, updatePlant, createPlant, togglePlantActive, migratePlantSchema } from '@/services/plantService'

// ─── Types ────────────────────────────────────────────────────────────────────
type FormState = {
  name:        string
  code:        string
  description: string
}

const EMPTY_FORM: FormState = { name: '', code: '', description: '' }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PlantsPage() {
  const [plants, setPlants]     = useState<ApiPlant[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing]       = useState<ApiPlant | null>(null)
  const [form, setForm]             = useState<FormState>(EMPTY_FORM)
  const [formError, setFormError]   = useState('')
  const [isSaving, setIsSaving]     = useState(false)

  const [toggleTarget, setToggleTarget] = useState<ApiPlant | null>(null)
  const [isToggling, setIsToggling]     = useState(false)

  const [migratingId, setMigratingId] = useState<number | null>(null)

  // ── Load ───────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      setIsLoading(true)
      setPlants(await listAllPlants())
    } catch {
      toast.error('Gagal memuat data plant')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Form handlers ──────────────────────────────────────────────────────────
  function openAdd() {
    setEditing(null); setForm(EMPTY_FORM); setFormError(''); setDialogOpen(true)
  }

  function openEdit(plant: ApiPlant) {
    setEditing(plant)
    setForm({ name: plant.name, code: plant.code, description: plant.description ?? '' })
    setFormError('')
    setDialogOpen(true)
  }

  async function handleSave() {
    setFormError('')
    if (!form.name.trim()) { setFormError('Nama plant wajib diisi.'); return }
    if (!form.code.trim()) { setFormError('Kode plant wajib diisi.'); return }
    if (!/^[A-Za-z0-9_-]+$/.test(form.code.trim())) {
      setFormError('Kode hanya boleh mengandung huruf, angka, tanda hubung, dan underscore.')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        name:        form.name.trim(),
        code:        form.code.trim().toUpperCase(),
        description: form.description.trim() || null,
      }
      if (editing) {
        const u = await updatePlant(editing.id, payload)
        setPlants(prev => prev.map(p => p.id === editing.id ? u : p))
        toast.success('Plant berhasil diperbarui')
      } else {
        const c = await createPlant(payload)
        setPlants(prev => [...prev, c])
        toast.success(`Plant "${c.name}" berhasil dibuat — schema database "${c.schema_name}" telah diinisialisasi`)
      }
      setDialogOpen(false)
    } catch (err) {
      if (err instanceof ApiError) setFormError(err.detail)
      else toast.error('Gagal menyimpan plant')
    } finally { setIsSaving(false) }
  }

  // ── Toggle active ──────────────────────────────────────────────────────────
  async function handleToggleConfirm() {
    if (!toggleTarget) return
    setIsToggling(true)
    try {
      const u = await togglePlantActive(toggleTarget.id)
      setPlants(prev => prev.map(p => p.id === toggleTarget.id ? u : p))
      toast.success(u.is_active ? 'Plant diaktifkan' : 'Plant dinonaktifkan')
      setToggleTarget(null)
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.detail)
      else toast.error('Gagal mengubah status plant')
    } finally { setIsToggling(false) }
  }

  // ── Migrate schema ─────────────────────────────────────────────────────────
  async function handleMigrate(plant: ApiPlant) {
    setMigratingId(plant.id)
    try {
      const res = await migratePlantSchema(plant.id)
      toast.success(res.message)
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.detail)
      else toast.error('Migrasi gagal')
    } finally { setMigratingId(null) }
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const totalActive   = plants.filter(p => p.is_active).length
  const totalInactive = plants.filter(p => !p.is_active).length

  return (
    <OeeGuard section="users">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">

        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 via-emerald-900 to-teal-800 px-8 py-10">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
                <Factory className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-emerald-300 text-xs font-semibold uppercase tracking-widest mb-1">Administration</p>
                <h1 className="text-3xl font-bold text-white tracking-tight">Plant Management</h1>
                <p className="text-emerald-200 text-sm mt-1">Kelola plant produksi &amp; inisialisasi schema database</p>
              </div>
            </div>
            <Badge className="bg-amber-500/80 text-white border-0 px-3 py-1.5 text-xs">Admin Only</Badge>
          </div>
        </div>

        <div className="p-8 space-y-6">

          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>{totalActive} aktif</span>
              </div>
              {totalInactive > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-slate-300" />
                  <span>{totalInactive} nonaktif</span>
                </div>
              )}
            </div>
            <Button
              onClick={openAdd}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" /> Tambah Plant
            </Button>
          </div>

          {/* Info banner */}
          <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <Database className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-800 space-y-0.5">
              <p className="font-semibold">Pembuatan Plant Otomatis Membuat Schema Database</p>
              <p className="text-blue-700 text-xs">
                Setiap plant baru akan dibuatkan schema PostgreSQL tersendiri dengan seluruh tabel OEE yang diperlukan
                (master data, production output, machine loss, dll). Proses ini berjalan otomatis saat plant dibuat.
              </p>
            </div>
          </div>

          {/* Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                Daftar Plant
                {!isLoading && (
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                    {plants.length} total
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
                <TooltipProvider>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama Plant</TableHead>
                          <TableHead>Kode</TableHead>
                          <TableHead>Schema Database</TableHead>
                          <TableHead>Deskripsi</TableHead>
                          <TableHead>Dibuat</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-center w-40">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {plants.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                              Belum ada plant. Klik <strong>Tambah Plant</strong> untuk membuat.
                            </TableCell>
                          </TableRow>
                        ) : plants.map(p => (
                          <TableRow key={p.id} className={cn(!p.is_active && 'opacity-50')}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
                                  p.is_active ? 'bg-emerald-100' : 'bg-slate-100',
                                )}>
                                  <Factory className={cn('h-4 w-4', p.is_active ? 'text-emerald-600' : 'text-slate-400')} />
                                </div>
                                <span className="font-medium text-sm">{p.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-xs border-slate-200">
                                {p.code}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-700">
                                {p.schema_name}
                              </code>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                              {p.description || '—'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {fmtDate(p.created_at)}
                            </TableCell>
                            <TableCell className="text-center">
                              {p.is_active ? (
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-xs gap-1">
                                  <CheckCircle2 className="h-3 w-3" /> Aktif
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs gap-1 text-slate-500">
                                  <XCircle className="h-3 w-3" /> Nonaktif
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-center items-center gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit Plant</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm" variant="ghost"
                                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                      disabled={migratingId === p.id}
                                      onClick={() => handleMigrate(p)}
                                    >
                                      {migratingId === p.id
                                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        : <RefreshCw className="h-3.5 w-3.5" />}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Jalankan Migrasi Schema</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm" variant="ghost"
                                      className={cn(
                                        p.is_active
                                          ? 'text-destructive hover:text-destructive hover:bg-red-50'
                                          : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50',
                                      )}
                                      onClick={() => setToggleTarget(p)}
                                    >
                                      {p.is_active
                                        ? <PowerOff className="h-3.5 w-3.5" />
                                        : <Power className="h-3.5 w-3.5" />}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {p.is_active ? 'Nonaktifkan Plant' : 'Aktifkan Plant'}
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TooltipProvider>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Dialog Tambah / Edit Plant ─────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5 text-emerald-600" />
              {editing ? 'Edit Plant' : 'Tambah Plant Baru'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label>Nama Plant <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="Contoh: PT. Maju Jaya Pakan"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Kode Plant <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="Contoh: MJP"
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  className="font-mono uppercase"
                  maxLength={20}
                />
                <p className="text-xs text-muted-foreground">
                  Huruf, angka, tanda hubung. Akan dipakai sebagai nama schema.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  Schema Database
                  <span className="text-xs text-muted-foreground font-normal">(otomatis)</span>
                </Label>
                <Input
                  value={form.code
                    ? `plant_${form.code.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')}`
                    : '—'}
                  readOnly
                  className="bg-muted/50 text-muted-foreground cursor-not-allowed font-mono text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Deskripsi</Label>
              <Textarea
                placeholder="Keterangan opsional tentang plant ini"
                rows={2}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            {!editing && (
              <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3">
                <Database className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-xs text-amber-800 space-y-0.5">
                  <p className="font-semibold">Schema Database Akan Dibuat Otomatis</p>
                  <p>
                    Sistem akan membuat schema PostgreSQL baru dan menginisialisasi semua tabel yang diperlukan.
                    Proses ini mungkin memerlukan beberapa detik.
                  </p>
                </div>
              </div>
            )}

            {formError && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />{formError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSaving
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{editing ? 'Menyimpan…' : 'Membuat Plant…'}</>
                : editing ? 'Simpan Perubahan' : 'Buat Plant'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirm Toggle Active ─────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleToggleConfirm}
        title={toggleTarget?.is_active ? 'Nonaktifkan Plant' : 'Aktifkan Plant'}
        description={
          toggleTarget?.is_active
            ? `Plant "${toggleTarget?.name}" akan dinonaktifkan. User tidak dapat lagi mengakses data plant ini. Schema database tidak dihapus.`
            : `Plant "${toggleTarget?.name}" akan diaktifkan kembali dan dapat diakses oleh user yang memiliki akses.`
        }
        confirmText={toggleTarget?.is_active ? 'Nonaktifkan' : 'Aktifkan'}
        isLoading={isToggling}
      />
    </OeeGuard>
  )
}
