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
  getStandardThroughputLogs,
} from "@/services/masterService"
import { listUsersBasic } from "@/services/userService"
import { toast } from "sonner"
import { Loader2, Plus, Pencil, Trash2, AlertCircle, Activity, Eye, TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react"
import { ApiError } from "@/lib/api-client"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { ApiStandardThroughputLog } from "@/types/api"

// ─── IMPORT / EXPORT ─────────────────────────────────────────────────────────
// Untuk menonaktifkan fitur ini, comment 2 baris berikut:
import { ImportExportButtons } from "@/components/oee/ImportExportButtons"
const ENABLE_IMPORT_EXPORT = true
// ─────────────────────────────────────────────────────────────────────────────

type Row = { id: number; lineId: number; lineName: string; feedCodeId: number; feedCode: string; throughput: number; remarks: string }
type Opt  = { id: number; label: string }
const EMPTY = { lineId: "", feedCodeId: "", throughput: "", remarks: "", reason: "" }

export default function StandardThroughputPage() {
  const [rows, setRows]           = useState<Row[]>([])
  const [lines, setLines]         = useState<Opt[]>([])
  const [feeds, setFeeds]         = useState<Opt[]>([])
  const [userMap, setUserMap]     = useState<Record<number, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving]   = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing]       = useState<Row | null>(null)
  const [form, setForm]             = useState(EMPTY)
  const [formError, setFormError]   = useState("")
  const [deleteId, setDeleteId]     = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [detailRow, setDetailRow]         = useState<Row | null>(null)
  const [detailLogs, setDetailLogs]       = useState<ApiStandardThroughputLog[]>([])
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)
  const [detailOpen, setDetailOpen]       = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setIsLoading(true)
      const [throughputs, lineList, feedList, users] = await Promise.all([
        getStandardThroughputs(), getLines(), getFeedCodes(), listUsersBasic()
      ])
      const lm = Object.fromEntries(lineList.map(l => [l.id, l.name]))
      const fm = Object.fromEntries(feedList.map(f => [f.id, f.code]))
      const um = Object.fromEntries(users.map(u => [u.id, u.full_name || u.username]))
      setLines(lineList.map(l => ({ id: l.id, label: l.name })))
      setFeeds(feedList.map(f => ({ id: f.id, label: f.code })))
      setUserMap(um)
      setRows(throughputs.map(t => ({
        id: t.id, lineId: t.line_id, lineName: lm[t.line_id] ?? `#${t.line_id}`,
        feedCodeId: t.feed_code_id, feedCode: fm[t.feed_code_id] ?? `#${t.feed_code_id}`,
        throughput: t.standard_throughput, remarks: t.remarks ?? "",
      })))
    } catch { toast.error("Gagal memuat data") }
    finally { setIsLoading(false) }
  }

  function openAdd() {
    setEditing(null)
    setForm(EMPTY)
    setFormError("")
    setDialogOpen(true)
  }

  function openEdit(r: Row) {
    setEditing(r)
    setForm({ lineId: String(r.lineId), feedCodeId: String(r.feedCodeId), throughput: String(r.throughput), remarks: r.remarks, reason: "" })
    setFormError("")
    setDialogOpen(true)
  }

  async function openDetail(r: Row) {
    setDetailRow(r)
    setDetailOpen(true)
    setIsLoadingLogs(true)
    try {
      const logs = await getStandardThroughputLogs(r.id)
      setDetailLogs(logs)
    } catch { toast.error("Gagal memuat log perubahan") }
    finally { setIsLoadingLogs(false) }
  }

  async function handleSave() {
    setFormError("")
    if (!form.lineId || !form.feedCodeId || !form.throughput) { setFormError("Line, Kode Pakan, dan Throughput wajib diisi."); return }
    if (Number(form.throughput) <= 0) { setFormError("Throughput harus lebih dari 0."); return }
    if (editing && !form.reason.trim()) { setFormError("Alasan perubahan wajib diisi."); return }

    // Cek duplikat kombinasi line + kode pakan (kecuali untuk baris yang sedang diedit)
    const isDuplicate = rows.some(r =>
      r.lineId === Number(form.lineId) &&
      r.feedCodeId === Number(form.feedCodeId) &&
      r.id !== editing?.id
    )
    if (isDuplicate) {
      const lineName = lines.find(l => l.id === Number(form.lineId))?.label ?? ''
      const feedCode = feeds.find(f => f.id === Number(form.feedCodeId))?.label ?? ''
      setFormError(`Kombinasi "${lineName} – ${feedCode}" sudah terdaftar.`)
      return
    }

    setIsSaving(true)
    try {
      if (editing) {
        const u = await updateStandardThroughput(editing.id, {
          line_id: Number(form.lineId),
          feed_code_id: Number(form.feedCodeId),
          standard_throughput: Number(form.throughput),
          remarks: form.remarks,
          reason: form.reason,
        })
        const line = lines.find(l => l.id === u.line_id)
        const feed = feeds.find(f => f.id === u.feed_code_id)
        setRows(prev => prev.map(r => r.id === editing.id ? {
          ...r,
          lineId: u.line_id, lineName: line?.label ?? r.lineName,
          feedCodeId: u.feed_code_id, feedCode: feed?.label ?? r.feedCode,
          throughput: u.standard_throughput, remarks: u.remarks ?? "",
        } : r))
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

  // ── Import handler ───────────────────────────────────────────────────────
  async function handleImport(csvRows: Record<string, string>[]) {
    // Deduplikasi dalam CSV sendiri: jika ada kombinasi Line+KodePakan yang sama,
    // pakai baris terakhir (overwrite). Key = "lineName||feedCode"
    const deduped = new Map<string, Record<string, string>>()
    for (const row of csvRows) {
      const lineName = row['Line']?.trim() ?? ''
      const feedCode = row['Kode Pakan']?.trim().toUpperCase() ?? ''
      if (!lineName || !feedCode) continue
      deduped.set(`${lineName}||${feedCode}`, row)
    }

    let created = 0
    let skippedDb = 0

    for (const row of deduped.values()) {
      const lineName   = row['Line']?.trim()
      const feedCode   = row['Kode Pakan']?.trim().toUpperCase()
      const throughput = Number(row['Throughput (kg/jam)']?.trim())
      const remarks    = row['Remarks']?.trim() || ''

      if (!lineName || !feedCode || !throughput || throughput <= 0) continue

      // Cari ID Line
      const lineObj = lines.find(l => l.label.toLowerCase() === lineName.toLowerCase())
      if (!lineObj) {
        toast.warning(`Line "${lineName}" tidak ditemukan, baris dilewati`)
        continue
      }

      // Cari ID Feed Code
      const feedObj = feeds.find(f => f.label.toUpperCase() === feedCode)
      if (!feedObj) {
        toast.warning(`Kode pakan "${feedCode}" tidak ditemukan, baris dilewati`)
        continue
      }

      // Cek duplikat terhadap data yang sudah ada di DB
      const existsInDb = rows.some(r => r.lineId === lineObj.id && r.feedCodeId === feedObj.id)
      if (existsInDb) {
        skippedDb++
        continue
      }

      await createStandardThroughput({
        line_id: lineObj.id,
        feed_code_id: feedObj.id,
        standard_throughput: throughput,
        remarks,
      })
      created++
    }

    if (created === 0 && skippedDb > 0)
      throw new Error(`Semua kombinasi sudah ada di database (${skippedDb} baris dilewati)`)
    if (created === 0)
      throw new Error('Tidak ada baris valid yang dapat diimpor')
    if (skippedDb > 0)
      toast.info(`${skippedDb} kombinasi sudah ada di database, dilewati`)

    await load()
  }

  const lineChanged       = editing ? Number(form.lineId) !== editing.lineId : false
  const feedChanged       = editing ? Number(form.feedCodeId) !== editing.feedCodeId : false
  const throughputChanged = editing ? Number(form.throughput) !== editing.throughput : false
  const remarksChanged    = editing ? form.remarks !== editing.remarks : false
  const delta             = editing ? Number(form.throughput) - editing.throughput : 0

  const chartData = detailLogs.map(log => ({
    name: `#${log.change_number}`,
    throughput: log.new_throughput,
    changeNumber: log.change_number,
    changedBy: log.changed_by_id ? (userMap[log.changed_by_id] ?? `User #${log.changed_by_id}`) : "—",
    changedAt: new Date(log.changed_at).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    reason: log.reason || "—",
    oldThroughput: log.old_throughput,
    newThroughput: log.new_throughput,
  }))

  return (
    <OeeGuard section="master">
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50/30">
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-800 to-emerald-600 px-8 py-10">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="relative flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Activity className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">Master Data</p>
              <h2 className="text-3xl font-bold text-white tracking-tight">Standard Throughput</h2>
              <p className="text-white/70 text-sm mt-1">Standar throughput per line</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-emerald-900">Standard Throughput</h1>
              <p className="text-emerald-600 text-sm mt-1">Throughput standar per kombinasi Line dan Kode Pakan. Satu Line boleh memiliki banyak Kode Pakan berbeda.</p>
            </div>
            <div className="flex items-center gap-2">
              {/* ── IMPORT / EXPORT ── comment blok ini untuk menonaktifkan */}
              {ENABLE_IMPORT_EXPORT && (
                <ImportExportButtons
                  entityName="standard-throughput"
                  columns={[
                    { key: 'lineName',   label: 'Line' },
                    { key: 'feedCode',   label: 'Kode Pakan' },
                    { key: 'throughput', label: 'Throughput (kg/jam)' },
                    { key: 'remarks',    label: 'Remarks' },
                  ]}
                  dataToExport={() => rows.map(r => ({
                    'Line':                  r.lineName,
                    'Kode Pakan':            r.feedCode,
                    'Throughput (kg/jam)':   r.throughput,
                    'Remarks':               r.remarks,
                  }))}
                  onImport={handleImport}
                  disabled={isLoading || lines.length === 0 || feeds.length === 0}
                />
              )}
              {/* ── /IMPORT / EXPORT ── */}
              <Button onClick={openAdd} disabled={lines.length === 0 || feeds.length === 0}>
                <Plus className="h-4 w-4 mr-2" /> Tambah
              </Button>
            </div>
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
                Daftar Standard Throughput
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
                      <TableHead>Line</TableHead>
                      <TableHead>Kode Pakan</TableHead>
                      <TableHead className="text-right">Throughput (kg/jam)</TableHead>
                      <TableHead>Remarks</TableHead>
                      <TableHead className="text-center w-32">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-12 text-emerald-600">Belum ada data</TableCell></TableRow>
                    ) : rows.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.lineName}</TableCell>
                        <TableCell><Badge variant="outline" className="border-emerald-200 text-emerald-700 font-mono">{r.feedCode}</Badge></TableCell>
                        <TableCell className="text-right font-mono font-semibold">{r.throughput.toLocaleString("id-ID")}</TableCell>
                        <TableCell className="text-emerald-600 text-sm">{r.remarks || "-"}</TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-1">
                            <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => openDetail(r)}><Eye className="h-3.5 w-3.5" /></Button>
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

          {/* ── ADD / EDIT DIALOG ── */}
          <Dialog open={dialogOpen} onOpenChange={open => { if (!isSaving) setDialogOpen(open) }}>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Standard Throughput" : "Tambah Standard Throughput"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Line <span className="text-destructive">*</span></Label>
                  <Select value={form.lineId} onValueChange={v => setForm(f => ({...f, lineId: v}))}>
                    <SelectTrigger className={lineChanged ? "border-amber-400 bg-amber-50" : ""}>
                      <SelectValue placeholder="Pilih Line..." />
                    </SelectTrigger>
                    <SelectContent>{lines.map(l => <SelectItem key={l.id} value={String(l.id)}>{l.label}</SelectItem>)}</SelectContent>
                  </Select>
                  {lineChanged && editing && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Diubah dari: <span className="font-medium">{editing.lineName}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Kode Pakan <span className="text-destructive">*</span></Label>
                  <Select value={form.feedCodeId} onValueChange={v => setForm(f => ({...f, feedCodeId: v}))}>
                    <SelectTrigger className={feedChanged ? "border-amber-400 bg-amber-50" : ""}>
                      <SelectValue placeholder="Pilih Kode Pakan..." />
                    </SelectTrigger>
                    <SelectContent>{feeds.map(f => <SelectItem key={f.id} value={String(f.id)} className="font-mono">{f.label}</SelectItem>)}</SelectContent>
                  </Select>
                  {feedChanged && editing && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Diubah dari: <span className="font-medium font-mono">{editing.feedCode}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Standard Throughput (kg/jam) <span className="text-destructive">*</span></Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number" min={1} placeholder="Contoh: 2495"
                      value={form.throughput}
                      onChange={e => setForm(f => ({...f, throughput: e.target.value}))}
                      className={throughputChanged ? "border-amber-400 bg-amber-50 focus-visible:ring-amber-400" : ""}
                    />
                    {throughputChanged && (
                      <div className={`flex items-center gap-1 text-sm font-mono font-semibold whitespace-nowrap ${delta > 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {delta > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        {delta > 0 ? "+" : ""}{delta.toLocaleString("id-ID")}
                      </div>
                    )}
                  </div>
                  {throughputChanged && editing && (
                    <p className="text-xs text-amber-600">
                      {editing.throughput.toLocaleString("id-ID")} <ArrowRight className="inline h-3 w-3" /> {Number(form.throughput).toLocaleString("id-ID")} kg/jam
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Remarks</Label>
                  <Textarea
                    rows={2} placeholder="Keterangan opsional"
                    value={form.remarks}
                    onChange={e => setForm(f => ({...f, remarks: e.target.value}))}
                    className={remarksChanged ? "border-amber-400 bg-amber-50 focus-visible:ring-amber-400" : ""}
                  />
                </div>

                {editing && (
                  <div className="space-y-1.5">
                    <Label>Alasan Perubahan <span className="text-destructive">*</span></Label>
                    <Textarea
                      rows={2} placeholder="Jelaskan alasan mengubah data ini..."
                      value={form.reason}
                      onChange={e => setForm(f => ({...f, reason: e.target.value}))}
                    />
                    <p className="text-xs text-gray-400">Wajib diisi dan akan tercatat di log perubahan.</p>
                  </div>
                )}

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
                  {editing ? "Simpan Perubahan" : "Tambah"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ── VIEW DETAIL DIALOG ── */}
          <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
            <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-600" />
                  Detail Standard Throughput
                </DialogTitle>
              </DialogHeader>
              {detailRow && (
                <div className="space-y-6 py-2">
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-emerald-50 border border-emerald-100">
                    <div>
                      <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide mb-1">Line</p>
                      <p className="font-semibold text-emerald-900">{detailRow.lineName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide mb-1">Kode Pakan</p>
                      <Badge variant="outline" className="border-emerald-200 text-emerald-700 font-mono">{detailRow.feedCode}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide mb-1">Throughput Saat Ini</p>
                      <p className="font-mono font-bold text-xl text-emerald-900">{detailRow.throughput.toLocaleString("id-ID")} <span className="text-sm font-normal text-emerald-600">kg/jam</span></p>
                    </div>
                    <div>
                      <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide mb-1">Remarks</p>
                      <p className="text-sm text-emerald-700">{detailRow.remarks || "—"}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-emerald-600" />
                      Riwayat Perubahan
                      {!isLoadingLogs && <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">{detailLogs.length} perubahan</Badge>}
                    </h3>

                    {isLoadingLogs ? (
                      <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-emerald-600" /></div>
                    ) : detailLogs.length === 0 ? (
                      <div className="text-center py-10 text-sm text-gray-400">Belum ada riwayat perubahan</div>
                    ) : (
                      <>
                        <div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" />
                              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v.toLocaleString("id-ID")} width={72} />
                              <Tooltip
                                content={({ active, payload }) => {
                                  if (!active || !payload?.length) return null
                                  const d = payload[0].payload
                                  return (
                                    <div className="bg-white border border-emerald-200 rounded-lg shadow-lg p-3 text-xs space-y-1 min-w-[180px]">
                                      <p className="font-semibold text-emerald-800">Perubahan ke-{d.changeNumber}</p>
                                      <p className="text-gray-500">{d.changedAt}</p>
                                      <p className="text-gray-700">Oleh: <span className="font-medium">{d.changedBy}</span></p>
                                      {d.oldThroughput !== null && (
                                        <p className="text-gray-500">Sebelumnya: <span className="font-mono">{d.oldThroughput?.toLocaleString("id-ID")}</span></p>
                                      )}
                                      <p className="text-emerald-700 font-medium">Baru: <span className="font-mono">{d.newThroughput.toLocaleString("id-ID")} kg/jam</span></p>
                                      <p className="text-gray-600">Alasan: {d.reason}</p>
                                    </div>
                                  )
                                }}
                              />
                              <Line
                                type="monotone"
                                dataKey="throughput"
                                stroke="#10b981"
                                strokeWidth={2.5}
                                dot={{ fill: "#10b981", r: 5, strokeWidth: 2, stroke: "#fff" }}
                                activeDot={{ r: 7, fill: "#059669", stroke: "#fff", strokeWidth: 2 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="rounded-lg border border-gray-100 overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Ke-</th>
                                <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Tanggal</th>
                                <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Diubah Oleh</th>
                                <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Sebelumnya</th>
                                <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Sesudahnya</th>
                                <th className="px-3 py-2.5 text-center font-semibold text-gray-600">Δ</th>
                                <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Alasan</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {detailLogs.map(log => {
                                const delta = log.old_throughput !== null ? log.new_throughput - log.old_throughput : null
                                return (
                                  <tr key={log.id} className="hover:bg-gray-50/50">
                                    <td className="px-3 py-2.5">
                                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-xs">#{log.change_number}</Badge>
                                    </td>
                                    <td className="px-3 py-2.5 text-gray-600">
                                      {new Date(log.changed_at).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                    </td>
                                    <td className="px-3 py-2.5 font-medium text-gray-700">
                                      {log.changed_by_id ? (userMap[log.changed_by_id] ?? `User #${log.changed_by_id}`) : "—"}
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-mono text-gray-500">
                                      {log.old_throughput !== null ? log.old_throughput.toLocaleString("id-ID") : "—"}
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-mono font-semibold text-emerald-700">
                                      {log.new_throughput.toLocaleString("id-ID")}
                                    </td>
                                    <td className="px-3 py-2.5 text-center">
                                      {delta === null ? (
                                        <Minus className="h-3 w-3 mx-auto text-gray-400" />
                                      ) : delta > 0 ? (
                                        <span className="flex items-center justify-center gap-0.5 text-emerald-600 font-mono">
                                          <TrendingUp className="h-3 w-3" />+{delta.toLocaleString("id-ID")}
                                        </span>
                                      ) : delta < 0 ? (
                                        <span className="flex items-center justify-center gap-0.5 text-red-500 font-mono">
                                          <TrendingDown className="h-3 w-3" />{delta.toLocaleString("id-ID")}
                                        </span>
                                      ) : (
                                        <Minus className="h-3 w-3 mx-auto text-gray-400" />
                                      )}
                                    </td>
                                    <td className="px-3 py-2.5 text-gray-600 max-w-[160px] truncate" title={log.reason ?? undefined}>
                                      {log.reason || "—"}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailOpen(false)}>Tutup</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <ConfirmDialog
            open={!!deleteId}
            onClose={() => setDeleteId(null)}
            onConfirm={handleDelete}
            title="Hapus Standard Throughput"
            description="Data ini akan dihapus permanen. Lanjutkan?"
            confirmText="Hapus"
            isLoading={isDeleting}
          />
        </div>
      </div>
    </OeeGuard>
  )
}
