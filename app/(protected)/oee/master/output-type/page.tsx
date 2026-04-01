'use client'

import { useState, useEffect, useCallback } from 'react'
import { OeeGuard } from '@/components/oee/oee-guard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/confirm-dialog'
import {
  getOutputTypes, createOutputType, updateOutputType, deleteOutputType,
} from '@/services/masterService'
import { ApiOutputType } from '@/types/api'
import { toast } from 'sonner'
import {
  Loader2, Plus, Pencil, Trash2, Layers, AlertCircle,
  GripVertical, Star, Package,
} from 'lucide-react'
import { ApiError } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'

// ─── Types ────────────────────────────────────────────────────────────────────
type FormState = {
  code:            string
  name:            string
  category:        string
  is_good_product: boolean
  sort_order:      string
  remarks:         string
}

const EMPTY_FORM: FormState = {
  code:            '',
  name:            '',
  category:        '',
  is_good_product: false,
  sort_order:      '0',
  remarks:         '',
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OutputTypePage() {
  const { user } = useAuth()
  // user.role is UserRole: 'admin' | 'manager' | 'user' | 'viewer'
  const canEdit = user?.is_superuser || user?.role === 'admin' || user?.role === 'manager'

  const [rows, setRows]           = useState<ApiOutputType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving]   = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing]       = useState<ApiOutputType | null>(null)
  const [form, setForm]             = useState<FormState>(EMPTY_FORM)
  const [formError, setFormError]   = useState('')

  const [deleteId, setDeleteId]     = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const load = useCallback(async () => {
    try {
      setIsLoading(true)
      setRows(await getOutputTypes())
    } catch { toast.error('Gagal memuat data output type') }
    finally { setIsLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function openAdd() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setDialogOpen(true)
  }

  function openEdit(row: ApiOutputType) {
    setEditing(row)
    setForm({
      code:            row.code,
      name:            row.name,
      category:        row.category,
      is_good_product: row.is_good_product,
      sort_order:      String(row.sort_order),
      remarks:         row.remarks ?? '',
    })
    setFormError('')
    setDialogOpen(true)
  }

  async function handleSave() {
    setFormError('')
    if (!form.code.trim())     { setFormError('Kode wajib diisi.'); return }
    if (!form.name.trim())     { setFormError('Nama wajib diisi.'); return }
    if (!form.category.trim()) { setFormError('Kategori wajib diisi.'); return }

    setIsSaving(true)
    try {
      if (editing) {
        const updated = await updateOutputType(editing.id, {
          name:            form.name.trim(),
          category:        form.category.trim().toUpperCase(),
          is_good_product: form.is_good_product,
          sort_order:      Number(form.sort_order) || 0,
          remarks:         form.remarks || undefined,
        })
        setRows(prev => prev.map(r => r.id === editing.id ? updated : r))
        toast.success('Output type berhasil diperbarui')
      } else {
        const created = await createOutputType({
          code:            form.code.trim().toLowerCase().replace(/\s+/g, '_'),
          name:            form.name.trim(),
          category:        form.category.trim().toUpperCase(),
          is_good_product: form.is_good_product,
          sort_order:      Number(form.sort_order) || 0,
          remarks:         form.remarks || undefined,
        })
        setRows(prev => [...prev, created].sort((a, b) => a.sort_order - b.sort_order))
        toast.success('Output type berhasil ditambahkan')
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
      await deleteOutputType(deleteId)
      setRows(prev => prev.map(r => r.id === deleteId ? { ...r, is_active: false } : r))
      toast.success('Output type berhasil dinonaktifkan')
      setDeleteId(null)
    } catch { toast.error('Gagal menonaktifkan output type') }
    finally { setIsDeleting(false) }
  }

  const activeCount   = rows.filter(r => r.is_active).length
  const goodProdCount = rows.filter(r => r.is_good_product && r.is_active).length

  return (
    <OeeGuard section="master">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Layers className="h-6 w-6 text-violet-600" />
            Master Output Type
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kelola tipe output produksi — akan digunakan sebagai field input pada form Production Output.
          </p>
        </div>
        {canEdit && (
          <Button onClick={openAdd} className="bg-violet-600 hover:bg-violet-700">
            <Plus className="h-4 w-4 mr-2" />Tambah Output Type
          </Button>
        )}
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Output Type', value: rows.length,    icon: Layers,  color: 'text-violet-600',  bg: 'bg-violet-50'  },
          { label: 'Aktif',             value: activeCount,    icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Good Product',      value: goodProdCount,  icon: Star,    color: 'text-amber-600',   bg: 'bg-amber-50'   },
        ].map(s => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn('p-2.5 rounded-lg', s.bg)}>
                <s.icon className={cn('h-5 w-5', s.color)} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Table ── */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Layers className="h-4 w-4 text-violet-600" />
            Daftar Output Type
            <Badge variant="secondary" className="ml-1">{rows.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
              <span className="ml-2 text-sm text-muted-foreground">Memuat data...</span>
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Layers className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Belum ada output type.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-10 text-center">#</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-center">Good Product</TableHead>
                  <TableHead className="text-center">Sort</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  {canEdit && <TableHead className="text-center">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, idx) => (
                  <TableRow key={row.id} className={cn(!row.is_active && 'opacity-50 bg-slate-50/50')}>
                    <TableCell className="text-center text-xs text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell>
                      <code className="bg-slate-100 text-slate-700 text-xs px-1.5 py-0.5 rounded font-mono">
                        {row.code}
                      </code>
                    </TableCell>
                    <TableCell className="font-medium text-sm">{row.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-mono">{row.category}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {row.is_good_product ? (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                          <Star className="h-3 w-3 mr-1" />Good Product
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <GripVertical className="h-3 w-3" />{row.sort_order}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">
                      {row.remarks || '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={row.is_active ? 'default' : 'secondary'}
                        className={cn('text-xs', row.is_active
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500')}>
                        {row.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-500 hover:text-violet-600"
                            onClick={() => openEdit(row)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-500 hover:text-red-600"
                            onClick={() => setDeleteId(row.id)} disabled={!row.is_active}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Form Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-violet-600" />
              {editing ? 'Edit Output Type' : 'Tambah Output Type'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Kode <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="mis. finished_goods"
                  value={form.code}
                  onChange={e => setField('code', e.target.value)}
                  disabled={!!editing}
                  className={cn(editing && 'bg-slate-50 text-muted-foreground')}
                />
                {!editing && (
                  <p className="text-xs text-muted-foreground">Kode tidak bisa diubah setelah dibuat.</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Kategori <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="mis. FG"
                  value={form.category}
                  onChange={e => setField('category', e.target.value.toUpperCase())}
                  className="font-mono uppercase"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Nama <span className="text-red-500">*</span></Label>
              <Input
                placeholder="mis. Finished Goods"
                value={form.name}
                onChange={e => setField('name', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Urutan Tampil</Label>
                <Input
                  type="number" min={0} placeholder="0"
                  value={form.sort_order}
                  onChange={e => setField('sort_order', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="block mb-2">Good Product?</Label>
                <div className="flex items-center gap-2 pt-1">
                  <Switch
                    checked={form.is_good_product}
                    onCheckedChange={v => setField('is_good_product', v)}
                  />
                  <span className="text-sm text-muted-foreground">
                    {form.is_good_product ? (
                      <span className="text-amber-600 font-medium flex items-center gap-1">
                        <Star className="h-3.5 w-3.5" />Dihitung sebagai good product
                      </span>
                    ) : 'Tidak dihitung sbg good product'}
                  </span>
                </div>
              </div>
            </div>
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
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />{formError}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>Batal</Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-violet-600 hover:bg-violet-700">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? 'Simpan Perubahan' : 'Tambah'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Nonaktifkan Output Type"
        description="Output type ini akan dinonaktifkan dan tidak akan muncul di form input. Data yang sudah ada tidak dihapus. Lanjutkan?"
        confirmText="Nonaktifkan"
        isLoading={isDeleting}
      />
    </OeeGuard>
  )
}