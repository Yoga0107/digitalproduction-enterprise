"use client"

import { useState, useEffect } from "react"
import { OeeGuard } from "@/components/oee/oee-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ConfirmDialog } from "@/components/confirm-dialog"
import {
  getLines, getFeedCodes, getStandardThroughputs,
  createStandardThroughput, updateStandardThroughput, deleteStandardThroughput,
} from "@/services/masterService"
import { toast } from "sonner"
import { Loader2, Plus, Pencil, Trash2, AlertCircle } from "lucide-react"
import { ApiError } from "@/lib/api-client"

type Row = { id: number; lineId: number; lineName: string; feedCodeId: number; feedCode: string; throughput: number; remarks: string }
type Opt  = { id: number; label: string }
const EMPTY = { lineId: "", feedCodeId: "", throughput: "", remarks: "" }

export default function StandardThroughputPage() {
  const [rows, setRows]           = useState<Row[]>([])
  const [lines, setLines]         = useState<Opt[]>([])
  const [feeds, setFeeds]         = useState<Opt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving]   = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing]       = useState<Row | null>(null)
  const [form, setForm]             = useState(EMPTY)
  const [formError, setFormError]   = useState("")
  const [deleteId, setDeleteId]     = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setIsLoading(true)
      const [throughputs, lineList, feedList] = await Promise.all([getStandardThroughputs(), getLines(), getFeedCodes()])
      const lm = Object.fromEntries(lineList.map(l => [l.id, l.name]))
      const fm = Object.fromEntries(feedList.map(f => [f.id, f.code]))
      setLines(lineList.map(l => ({ id: l.id, label: l.name })))
      setFeeds(feedList.map(f => ({ id: f.id, label: f.code })))
      setRows(throughputs.map(t => ({
        id: t.id, lineId: t.line_id, lineName: lm[t.line_id] ?? `#${t.line_id}`,
        feedCodeId: t.feed_code_id, feedCode: fm[t.feed_code_id] ?? `#${t.feed_code_id}`,
        throughput: t.standard_throughput, remarks: t.remarks ?? "",
      })))
    } catch { toast.error("Gagal memuat data") }
    finally { setIsLoading(false) }
  }

  function openAdd() { setEditing(null); setForm(EMPTY); setFormError(""); setDialogOpen(true) }
  function openEdit(r: Row) {
    setEditing(r)
    setForm({ lineId: String(r.lineId), feedCodeId: String(r.feedCodeId), throughput: String(r.throughput), remarks: r.remarks })
    setFormError(""); setDialogOpen(true)
  }

  async function handleSave() {
    setFormError("")
    if (!form.lineId || !form.feedCodeId || !form.throughput) { setFormError("Line, Kode Pakan, dan Throughput wajib diisi."); return }
    if (Number(form.throughput) <= 0) { setFormError("Throughput harus lebih dari 0."); return }
    const dup = rows.some(r => r.lineId === Number(form.lineId) && r.feedCodeId === Number(form.feedCodeId) && r.id !== editing?.id)
    if (dup) { setFormError("Kombinasi Line dan Kode Pakan ini sudah ada."); return }
    setIsSaving(true)
    try {
      if (editing) {
        const u = await updateStandardThroughput(editing.id, { standard_throughput: Number(form.throughput), remarks: form.remarks })
        setRows(prev => prev.map(r => r.id === editing.id ? { ...r, throughput: u.standard_throughput, remarks: u.remarks ?? "" } : r))
        toast.success("Throughput berhasil diperbarui")
      } else {
        const c = await createStandardThroughput({ line_id: Number(form.lineId), feed_code_id: Number(form.feedCodeId), standard_throughput: Number(form.throughput), remarks: form.remarks })
        const line = lines.find(l => l.id === Number(form.lineId))
        const feed = feeds.find(f => f.id === Number(form.feedCodeId))
        setRows(prev => [...prev, { id: c.id, lineId: c.line_id, lineName: line?.label ?? "", feedCodeId: c.feed_code_id, feedCode: feed?.label ?? "", throughput: c.standard_throughput, remarks: c.remarks ?? "" }])
        toast.success("Throughput berhasil ditambahkan")
      }
      setDialogOpen(false)
    } catch (err) {
      if (err instanceof ApiError) setFormError(err.detail)
      else toast.error("Gagal menyimpan data")
    } finally { setIsSaving(false) }
  }

  async function handleDelete() {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await deleteStandardThroughput(deleteId)
      setRows(prev => prev.filter(r => r.id !== deleteId))
      toast.success("Throughput berhasil dihapus")
    } catch { toast.error("Gagal menghapus data") }
    finally { setIsDeleting(false); setDeleteId(null) }
  }

  return (
    <OeeGuard section="master">
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Standard Throughput</h1>
            <p className="text-muted-foreground text-sm mt-1">Throughput standar per kombinasi Line dan Kode Pakan</p>
          </div>
          <Button onClick={openAdd} disabled={lines.length === 0 || feeds.length === 0}>
            <Plus className="h-4 w-4 mr-2" /> Tambah
          </Button>
        </div>

        {!isLoading && (lines.length === 0 || feeds.length === 0) && (
          <div className="flex items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {lines.length === 0 ? "Belum ada Master Line." : "Belum ada Kode Pakan."} Tambahkan terlebih dahulu.
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Daftar Standard Throughput {!isLoading && <Badge variant="secondary">{rows.length} data</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Line</TableHead>
                    <TableHead>Kode Pakan</TableHead>
                    <TableHead className="text-right">Throughput (kg/jam)</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead className="text-center w-24">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Belum ada data</TableCell></TableRow>
                  ) : rows.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.lineName}</TableCell>
                      <TableCell><Badge variant="outline" className="font-mono">{r.feedCode}</Badge></TableCell>
                      <TableCell className="text-right font-mono font-semibold">{r.throughput.toLocaleString("id-ID")}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{r.remarks || "-"}</TableCell>
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
          <DialogContent className="sm:max-w-[460px]">
            <DialogHeader><DialogTitle>{editing ? "Edit Standard Throughput" : "Tambah Standard Throughput"}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Line <span className="text-destructive">*</span></Label>
                <Select value={form.lineId} onValueChange={v => setForm(f => ({...f, lineId: v}))} disabled={!!editing}>
                  <SelectTrigger><SelectValue placeholder="Pilih Line..." /></SelectTrigger>
                  <SelectContent>{lines.map(l => <SelectItem key={l.id} value={String(l.id)}>{l.label}</SelectItem>)}</SelectContent>
                </Select>
                {editing && <p className="text-xs text-muted-foreground">Line tidak dapat diubah setelah disimpan.</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Kode Pakan <span className="text-destructive">*</span></Label>
                <Select value={form.feedCodeId} onValueChange={v => setForm(f => ({...f, feedCodeId: v}))} disabled={!!editing}>
                  <SelectTrigger><SelectValue placeholder="Pilih Kode Pakan..." /></SelectTrigger>
                  <SelectContent>{feeds.map(f => <SelectItem key={f.id} value={String(f.id)} className="font-mono">{f.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Standard Throughput (kg/jam) <span className="text-destructive">*</span></Label>
                <Input type="number" min={1} placeholder="Contoh: 2495" value={form.throughput} onChange={e => setForm(f => ({...f, throughput: e.target.value}))} />
              </div>
              <div className="space-y-1.5">
                <Label>Remarks</Label>
                <Textarea rows={2} placeholder="Keterangan opsional" value={form.remarks} onChange={e => setForm(f => ({...f, remarks: e.target.value}))} />
              </div>
              {formError && <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0" />{formError}</div>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>Batal</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Simpan Perubahan" : "Tambah"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
          title="Hapus Standard Throughput" description="Data ini akan dihapus permanen. Lanjutkan?"
          confirmText="Hapus" isLoading={isDeleting} />
      </div>
    </OeeGuard>
  )
}
