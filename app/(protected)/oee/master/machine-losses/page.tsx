'use client'

import { useState, useEffect, useCallback } from 'react'
import { OeeGuard } from '@/components/oee/oee-guard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ConfirmDialog } from '@/components/confirm-dialog'
import {
  getMachineLossLvl1, createMachineLossLvl1, updateMachineLossLvl1, deleteMachineLossLvl1,
  getMachineLossLvl2, createMachineLossLvl2, updateMachineLossLvl2, deleteMachineLossLvl2,
  getMachineLossLvl3, createMachineLossLvl3, updateMachineLossLvl3, deleteMachineLossLvl3,
  getMasterMachineLosses, createMasterMachineLoss, deleteMasterMachineLoss,
} from '@/services/masterService'
import {
  ApiMachineLossLvl1, ApiMachineLossLvl2, ApiMachineLossLvl3, ApiMasterMachineLoss,
} from '@/types/api'
import { toast } from 'sonner'
import {
  Loader2, Plus, Pencil, Trash2, Workflow, ChevronRight,
  Layers, Database, Check, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Inline editable row ──────────────────────────────────────────────────────
function LevelRow({
  id, name, badgeColor, onEdit, onDelete,
  selected, onClick,
  childCount,
}: {
  id: number; name: string; badgeColor: string
  onEdit: (id: number, name: string) => void
  onDelete: (id: number) => void
  selected?: boolean; onClick?: () => void; childCount?: number
}) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(name)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!val.trim() || val.trim() === name) { setEditing(false); setVal(name); return }
    setSaving(true)
    await onEdit(id, val.trim())
    setSaving(false); setEditing(false)
  }

  return (
    <div
      className={cn(
        'group flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all cursor-pointer',
        selected
          ? 'bg-teal-50 border-teal-300 shadow-sm'
          : 'bg-white border-slate-100 hover:border-teal-200 hover:bg-slate-50',
      )}
      onClick={() => !editing && onClick?.()}
    >
      <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0', badgeColor)}>
        {id}
      </span>

      {editing ? (
        <Input
          autoFocus
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setEditing(false); setVal(name) } }}
          className="h-7 text-sm flex-1"
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <span className="flex-1 text-sm font-medium truncate">{name}</span>
      )}

      {childCount !== undefined && childCount > 0 && !editing && (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
          {childCount}
        </Badge>
      )}

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        onClick={e => e.stopPropagation()}>
        {editing ? (
          <>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-emerald-600 hover:bg-emerald-50"
              onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            </Button>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-slate-400 hover:bg-slate-100"
              onClick={() => { setEditing(false); setVal(name) }}>
              <X className="h-3 w-3" />
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
              onClick={() => setEditing(true)} title="Edit">
              <Pencil className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
              onClick={() => onDelete(id)} title="Hapus">
              <Trash2 className="h-3 w-3" />
            </Button>
          </>
        )}
      </div>

      {selected && onClick && (
        <ChevronRight className="h-4 w-4 text-teal-500 shrink-0 ml-1" />
      )}
    </div>
  )
}

// ─── Add row inline ────────────────────────────────────────────────────────────
function AddRow({ onAdd, placeholder }: { onAdd: (name: string) => Promise<void>; placeholder: string }) {
  const [open, setOpen] = useState(false)
  const [val, setVal] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!val.trim()) return
    setSaving(true)
    await onAdd(val.trim())
    setSaving(false); setVal(''); setOpen(false)
  }

  if (!open) return (
    <Button size="sm" variant="ghost" className="w-full justify-start text-slate-400 hover:text-teal-700 hover:bg-teal-50 gap-1.5 mt-1"
      onClick={() => setOpen(true)}>
      <Plus className="h-3.5 w-3.5" /> Tambah
    </Button>
  )

  return (
    <div className="flex items-center gap-1.5 mt-1">
      <Input
        autoFocus value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setOpen(false); setVal('') } }}
        placeholder={placeholder}
        className="h-7 text-sm flex-1"
      />
      <Button size="sm" className="h-7 px-2 bg-teal-600 hover:bg-teal-700" onClick={save} disabled={saving || !val.trim()}>
        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
      </Button>
      <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => { setOpen(false); setVal('') }}>
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}

// ─── Katalog Dialog ────────────────────────────────────────────────────────────
// CATATAN: Lvl2 & Lvl3 adalah tabel FLAT di backend.
// Semua item dari semua level selalu ditampilkan — tidak difilter per parent.
// Hierarki hanya ada di tabel master_machine_losses (kombinasi L1+L2+L3).
function KatalogDialog({
  open, onClose, onSave,
  lvl1List, lvl2List, lvl3List,
  isSaving,
}: {
  open: boolean; onClose: () => void
  onSave: (lvl1_id: number, lvl2_id: number | null, lvl3_id: number | null, remarks?: string) => Promise<void>
  lvl1List: ApiMachineLossLvl1[]; lvl2List: ApiMachineLossLvl2[]; lvl3List: ApiMachineLossLvl3[]
  isSaving: boolean
}) {
  const [selL1, setSelL1] = useState('')
  const [selL2, setSelL2] = useState('')
  const [selL3, setSelL3] = useState('')
  const [remarks, setRemarks] = useState('')

  function reset() { setSelL1(''); setSelL2(''); setSelL3(''); setRemarks('') }

  async function handleSave() {
    if (!selL1) return
    await onSave(
      Number(selL1),
      selL2 && selL2 !== 'none' ? Number(selL2) : null,
      selL3 && selL3 !== 'none' ? Number(selL3) : null,
      remarks.trim() || undefined,
    )
    reset()
  }

  return (
    <Dialog open={open} onOpenChange={() => { onClose(); reset() }}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-teal-600" />
            Tambah Kombinasi Loss
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          {/* L1 — wajib */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">L1</span>
              Loss Category <span className="text-red-500">*</span>
            </label>
            <Select value={selL1} onValueChange={v => { setSelL1(v); setSelL2(''); setSelL3('') }}>
              <SelectTrigger className={cn(selL1 && 'border-red-200 bg-red-50/40')}>
                <SelectValue placeholder="Pilih L1…" />
              </SelectTrigger>
              <SelectContent>
                {lvl1List.map(l => (
                  <SelectItem key={l.machine_losses_lvl_1_id} value={String(l.machine_losses_lvl_1_id)}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* L2 — opsional, tampil semua (flat table) */}
          <div className="space-y-1.5 pl-3 border-l-2 border-red-100">
            <label className="text-xs font-semibold flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 text-[10px] font-bold">L2</span>
              Sub Category <span className="text-xs font-normal text-slate-400">(opsional)</span>
            </label>
            <Select value={selL2} onValueChange={v => { setSelL2(v); setSelL3('') }}>
              <SelectTrigger className={cn(selL2 && selL2 !== 'none' && 'border-violet-200 bg-violet-50/40')}>
                <SelectValue placeholder="Pilih L2 (opsional)…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none"><span className="text-muted-foreground italic">— Tidak ada —</span></SelectItem>
                {lvl2List.map(l => (
                  <SelectItem key={l.machine_losses_lvl_2_id} value={String(l.machine_losses_lvl_2_id)}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* L3 — opsional, tampil semua (flat table) */}
          <div className="space-y-1.5 pl-6 border-l-2 border-violet-100">
            <label className="text-xs font-semibold flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold">L3</span>
              Detail Loss <span className="text-xs font-normal text-slate-400">(opsional)</span>
            </label>
            <Select value={selL3} onValueChange={setSelL3}>
              <SelectTrigger className={cn(selL3 && selL3 !== 'none' && 'border-emerald-200 bg-emerald-50/40')}>
                <SelectValue placeholder="Pilih L3 (opsional)…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none"><span className="text-muted-foreground italic">— Tidak ada —</span></SelectItem>
                {lvl3List.map(l => (
                  <SelectItem key={l.machine_losses_lvl_3_id} value={String(l.machine_losses_lvl_3_id)}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Remarks */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Remarks <span className="font-normal text-slate-400">(opsional)</span></label>
            <Input
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Keterangan tambahan…"
              className="h-8 text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { onClose(); reset() }}>Batal</Button>
          <Button onClick={handleSave} disabled={isSaving || !selL1} className="bg-teal-600 hover:bg-teal-700">
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function MachineLossPage() {
  const [lvl1List, setLvl1List] = useState<ApiMachineLossLvl1[]>([])
  const [lvl2List, setLvl2List] = useState<ApiMachineLossLvl2[]>([])
  const [lvl3List, setLvl3List] = useState<ApiMachineLossLvl3[]>([])
  const [katalog, setKatalog]   = useState<ApiMasterMachineLoss[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filter katalog berdasarkan L1/L2 yang dipilih
  const [filterL1, setFilterL1] = useState<number | null>(null)
  const [filterL2, setFilterL2] = useState<number | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<{ type: 'lvl1'|'lvl2'|'lvl3'|'katalog'; id: number } | null>(null)
  const [isDeleting, setIsDeleting]     = useState(false)
  const [katalogOpen, setKatalogOpen]   = useState(false)
  const [isSavingKatalog, setIsSavingKatalog] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const [l1, l2, l3, kat] = await Promise.all([
        getMachineLossLvl1(), getMachineLossLvl2(), getMachineLossLvl3(), getMasterMachineLosses(),
      ])
      setLvl1List(l1); setLvl2List(l2); setLvl3List(l3); setKatalog(kat)
    } catch { toast.error('Gagal memuat data') }
    finally { setIsLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // ── L1 handlers ─────────────────────────────────────────────────────────
  async function addL1(name: string) {
    try { await createMachineLossLvl1({ name }); await load(); toast.success('Level 1 ditambahkan') }
    catch (e: any) { toast.error(e?.detail ?? 'Gagal menambahkan') }
  }
  async function editL1(id: number, name: string) {
    try { await updateMachineLossLvl1(id, { name }); await load(); toast.success('Berhasil diperbarui') }
    catch (e: any) { toast.error(e?.detail ?? 'Gagal memperbarui') }
  }

  // ── L2 handlers (flat — tidak butuh lvl1_id) ─────────────────────────────
  async function addL2(name: string) {
    try { await createMachineLossLvl2({ name }); await load(); toast.success('Level 2 ditambahkan') }
    catch (e: any) { toast.error(e?.detail ?? 'Gagal menambahkan') }
  }
  async function editL2(id: number, name: string) {
    try { await updateMachineLossLvl2(id, { name }); await load(); toast.success('Berhasil diperbarui') }
    catch (e: any) { toast.error(e?.detail ?? 'Gagal memperbarui') }
  }

  // ── L3 handlers (flat — tidak butuh lvl2_id) ─────────────────────────────
  async function addL3(name: string) {
    try { await createMachineLossLvl3({ name }); await load(); toast.success('Level 3 ditambahkan') }
    catch (e: any) { toast.error(e?.detail ?? 'Gagal menambahkan') }
  }
  async function editL3(id: number, name: string) {
    try { await updateMachineLossLvl3(id, { name }); await load(); toast.success('Berhasil diperbarui') }
    catch (e: any) { toast.error(e?.detail ?? 'Gagal memperbarui') }
  }

  // ── Delete handler ───────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      if (deleteTarget.type === 'lvl1') await deleteMachineLossLvl1(deleteTarget.id)
      else if (deleteTarget.type === 'lvl2') await deleteMachineLossLvl2(deleteTarget.id)
      else if (deleteTarget.type === 'lvl3') await deleteMachineLossLvl3(deleteTarget.id)
      else await deleteMasterMachineLoss(deleteTarget.id)
      toast.success('Berhasil dihapus'); await load()
    } catch (e: any) { toast.error(e?.detail ?? 'Gagal menghapus') }
    finally { setIsDeleting(false); setDeleteTarget(null) }
  }

  // ── Katalog save ─────────────────────────────────────────────────────────
  async function handleKatalogSave(
    lvl1_id: number,
    lvl2_id: number | null,
    lvl3_id: number | null,
    remarks?: string,
  ) {
    setIsSavingKatalog(true)
    try {
      await createMasterMachineLoss({
        machine_losses_lvl_1_id: lvl1_id,
        machine_losses_lvl_2_id: lvl2_id,
        machine_losses_lvl_3_id: lvl3_id,
        remarks,
      })
      toast.success('Kombinasi berhasil ditambahkan')
      setKatalogOpen(false); await load()
    } catch (e: any) { toast.error(e?.detail ?? 'Gagal menyimpan') }
    finally { setIsSavingKatalog(false) }
  }

  // ── Derived — filter katalog berdasarkan pilihan L1/L2 ──────────────────
  const filtKat = katalog.filter(k =>
    (!filterL1 || k.machine_losses_lvl_1_id === filterL1) &&
    (!filterL2 || k.machine_losses_lvl_2_id === filterL2)
  )
  const getL1Name = (id: number | null) =>
  lvl1List.find(l => l.machine_losses_lvl_1_id === id)?.name

const getL2Name = (id: number | null) =>
  lvl2List.find(l => l.machine_losses_lvl_2_id === id)?.name

const getL3Name = (id: number | null) =>
  lvl3List.find(l => l.machine_losses_lvl_3_id === id)?.name

  // Hitung berapa kali setiap L1/L2/L3 dipakai di katalog (untuk badge)
  const l1UsageCount = (l1id: number) =>
    katalog.filter(k => k.machine_losses_lvl_1_id === l1id).length
  const l2UsageCount = (l2id: number) =>
    katalog.filter(k => k.machine_losses_lvl_2_id === l2id).length
  const l3UsageCount = (l3id: number) =>
    katalog.filter(k => k.machine_losses_lvl_3_id === l3id).length

  return (
    <OeeGuard section="master">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/20">

        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-to-r from-teal-800 to-cyan-600 px-8 py-10">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="relative flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Workflow className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">Master Data</p>
              <h2 className="text-3xl font-bold text-white tracking-tight">Machine Losses</h2>
              <p className="text-white/70 text-sm mt-1">Kelola kategori, sub-kategori, dan detail kerugian mesin</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">

          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>
          ) : (
            <>
              {/* Info banner: struktur flat */}
              <div className="rounded-lg border border-blue-200 bg-blue-50/60 px-4 py-3 text-xs text-blue-700 flex items-start gap-2">
                <span className="font-bold mt-0.5">ℹ</span>
                <span>
                  <strong>L1, L2, L3</strong> adalah daftar mandiri (flat). Hubungan antar level dikelola di tabel <strong>Master Machine Losses</strong> sebagai kombinasi.
                  Anda bisa menambah item di level mana pun secara independen.
                </span>
              </div>

              {/* ── 3-column level selector ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* L1 */}
                <Card className="border-red-100 shadow-sm">
                  <CardHeader className="pb-3 border-b border-red-50 bg-red-50/40 rounded-t-xl">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">L1</span>
                      Loss Category
                      <Badge className="ml-auto bg-red-100 text-red-800 hover:bg-red-100 text-[10px]">{lvl1List.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 space-y-1.5 max-h-72 overflow-y-auto">
                    {lvl1List.length === 0
                      ? <p className="text-xs text-center text-slate-400 py-4">Belum ada data</p>
                      : lvl1List.map(l => (
                        <LevelRow
                          key={l.machine_losses_lvl_1_id}
                          id={l.machine_losses_lvl_1_id}
                          name={l.name}
                          badgeColor="bg-red-100 text-red-700"
                          selected={filterL1 === l.machine_losses_lvl_1_id}
                          onClick={() => {
                            setFilterL1(filterL1 === l.machine_losses_lvl_1_id ? null : l.machine_losses_lvl_1_id)
                            setFilterL2(null)
                          }}
                          onEdit={editL1}
                          onDelete={id => setDeleteTarget({ type: 'lvl1', id })}
                          childCount={l1UsageCount(l.machine_losses_lvl_1_id)}
                        />
                      ))
                    }
                    <AddRow onAdd={addL1} placeholder="Nama loss category…" />
                  </CardContent>
                </Card>

                {/* L2 — flat, tidak tergantung L1 */}
                <Card className="border-violet-100 shadow-sm">
                  <CardHeader className="pb-3 border-b border-violet-50 bg-violet-50/40 rounded-t-xl">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-violet-100 text-violet-700 text-[10px] font-bold">L2</span>
                      Sub Category
                      <Badge className="ml-auto bg-violet-100 text-violet-800 hover:bg-violet-100 text-[10px]">{lvl2List.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 space-y-1.5 max-h-72 overflow-y-auto">
                    {lvl2List.length === 0
                      ? <p className="text-xs text-center text-slate-400 py-4">Belum ada sub-kategori</p>
                      : lvl2List.map(l => (
                        <LevelRow
                          key={l.machine_losses_lvl_2_id}
                          id={l.machine_losses_lvl_2_id}
                          name={l.name}
                          badgeColor="bg-violet-100 text-violet-700"
                          selected={filterL2 === l.machine_losses_lvl_2_id}
                          onClick={() => setFilterL2(filterL2 === l.machine_losses_lvl_2_id ? null : l.machine_losses_lvl_2_id)}
                          onEdit={editL2}
                          onDelete={id => setDeleteTarget({ type: 'lvl2', id })}
                          childCount={l2UsageCount(l.machine_losses_lvl_2_id)}
                        />
                      ))
                    }
                    <AddRow onAdd={addL2} placeholder="Nama sub-kategori…" />
                  </CardContent>
                </Card>

                {/* L3 — flat, tidak tergantung L2 */}
                <Card className="border-emerald-100 shadow-sm">
                  <CardHeader className="pb-3 border-b border-emerald-50 bg-emerald-50/40 rounded-t-xl">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold">L3</span>
                      Detail Loss
                      <Badge className="ml-auto bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px]">{lvl3List.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 space-y-1.5 max-h-72 overflow-y-auto">
                    {lvl3List.length === 0
                      ? <p className="text-xs text-center text-slate-400 py-4">Belum ada detail loss</p>
                      : lvl3List.map(l => (
                        <LevelRow
                          key={l.machine_losses_lvl_3_id}
                          id={l.machine_losses_lvl_3_id}
                          name={l.name}
                          badgeColor="bg-emerald-100 text-emerald-700"
                          onEdit={editL3}
                          onDelete={id => setDeleteTarget({ type: 'lvl3', id })}
                          childCount={l3UsageCount(l.machine_losses_lvl_3_id)}
                        />
                      ))
                    }
                    <AddRow onAdd={addL3} placeholder="Nama detail loss…" />
                  </CardContent>
                </Card>
              </div>

              {/* ── Katalog kombinasi ── */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60 rounded-t-xl">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Layers className="h-4 w-4 text-teal-600" />
                      Master Machine Losses
                      <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-100 text-[10px]">{filtKat.length}</Badge>
                      {(filterL1 || filterL2) && (
                        <span className="text-xs text-slate-400 font-normal">(difilter)</span>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {(filterL1 || filterL2) && (
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-500 hover:text-slate-700"
                          onClick={() => { setFilterL1(null); setFilterL2(null) }}>
                          <X className="h-3 w-3 mr-1" /> Reset Filter
                        </Button>
                      )}
                      <Button size="sm" className="bg-teal-600 hover:bg-teal-700 h-7 text-xs gap-1"
                        onClick={() => setKatalogOpen(true)}>
                        <Plus className="h-3.5 w-3.5" /> Tambah Kombinasi
                      </Button>
                    </div>
                  </div>
                  {(filterL1 || filterL2) && (
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs text-slate-500">Filter aktif:</span>
                      {filterL1 && (
                        <Badge className="bg-red-100 text-red-700 border border-red-200 text-xs gap-1 cursor-pointer hover:bg-red-200"
                          onClick={() => setFilterL1(null)}>
                          L1: {lvl1List.find(l => l.machine_losses_lvl_1_id === filterL1)?.name}
                          <X className="h-2.5 w-2.5" />
                        </Badge>
                      )}
                      {filterL2 && (
                        <Badge className="bg-violet-100 text-violet-700 border border-violet-200 text-xs gap-1 cursor-pointer hover:bg-violet-200"
                          onClick={() => setFilterL2(null)}>
                          L2: {lvl2List.find(l => l.machine_losses_lvl_2_id === filterL2)?.name}
                          <X className="h-2.5 w-2.5" />
                        </Badge>
                      )}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  {filtKat.length === 0 ? (
                    <div className="text-center py-10 text-sm text-slate-400">
                      {filterL1 || filterL2 ? 'Tidak ada kombinasi sesuai filter.' : 'Belum ada kombinasi machine loss.'}
                    </div>
                  ) : (
                    <div className="overflow-auto max-h-96">
                      <table className="w-full text-sm border-collapse min-w-[600px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 w-10">#</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 min-w-[160px]">
                              <span className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">L1</span>
                                Loss Category
                              </span>
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 min-w-[160px]">
                              <span className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 text-[10px] font-bold">L2</span>
                                Sub Category
                              </span>
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 min-w-[160px]">
                              <span className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold">L3</span>
                                Detail Loss
                              </span>
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Remarks</th>
                            <th className="sticky right-0 bg-slate-50 text-center px-3 py-3 text-xs font-semibold text-slate-600 border-l border-slate-200 w-16">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtKat.map((k, i) => (
                            <tr key={k.machine_losses_id} className={cn('border-b border-slate-100 hover:bg-teal-50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50')}>
                              <td className="px-4 py-3 text-xs text-slate-400">{k.machine_losses_id}</td>
                              <td className="px-4 py-3">
                                <Badge className="bg-red-100 text-red-700 border border-red-200 hover:bg-red-100 text-xs font-medium">
                                  {k.lvl1_name ?? '—'}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                {k.lvl2_name
                                  ? <Badge className="bg-violet-100 text-violet-700 border border-violet-200 hover:bg-violet-100 text-xs font-medium">{k.lvl2_name}</Badge>
                                  : <span className="text-slate-300 text-xs">—</span>}
                              </td>
                              <td className="px-4 py-3">
                                {k.lvl3_name
                                  ? <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-medium">{k.lvl3_name}</Badge>
                                  : <span className="text-slate-300 text-xs">—</span>}
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-500 max-w-[160px] truncate">
                                {k.remarks || <span className="text-slate-300">—</span>}
                              </td>
                              <td className={cn('sticky right-0 border-l border-slate-200 px-3 py-2.5 text-center', i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50')}>
                                <Button size="sm" variant="ghost"
                                  className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => setDeleteTarget({ type: 'katalog', id: k.machine_losses_id })}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <KatalogDialog
        open={katalogOpen}
        onClose={() => setKatalogOpen(false)}
        onSave={handleKatalogSave}
        lvl1List={lvl1List} lvl2List={lvl2List} lvl3List={lvl3List}
        isSaving={isSavingKatalog}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Data"
        description={
          deleteTarget?.type === 'lvl1' ? 'Loss Category ini akan dihapus. Pastikan tidak digunakan di Master Machine Losses. Lanjutkan?' :
          deleteTarget?.type === 'lvl2' ? 'Sub Category ini akan dihapus. Pastikan tidak digunakan di Master Machine Losses. Lanjutkan?' :
          deleteTarget?.type === 'lvl3' ? 'Detail Loss ini akan dihapus. Pastikan tidak digunakan di Master Machine Losses. Lanjutkan?' :
          'Kombinasi machine loss ini akan dihapus. Lanjutkan?'
        }
        confirmText="Hapus"
        isLoading={isDeleting}
      />
    </OeeGuard>
  )
}