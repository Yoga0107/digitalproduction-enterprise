"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { canAccessEquipment } from "@/lib/oee-access"
import {
  ShieldOff, TreePine, Search, Plus, Upload, Download, CheckCircle2,
  Clock, ChevronRight, ChevronDown, Pencil, Trash2, ShieldCheck,
  ShieldX, RefreshCw, AlertCircle, Filter, X, ChevronsUpDown,
  ChevronLeft, ChevronsLeft, ChevronsRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { ApiEquipmentTree, EquipmentCreatePayload, EquipmentStats } from "@/types/equipment-types"
import {
  getEquipment, getEquipmentStats,
  updateEquipment, createEquipment, deleteEquipment,
  verifyEquipment, unverifyEquipment, verifyBulk,
  importEquipment, exportEquipment,
} from "@/services/equipmentService"
import { PageSizeOption, PAGE_SIZE_OPTIONS, useEquipmentTable } from "@/hooks/useEquipmentTable"


// ─── Constants ────────────────────────────────────────────────────────────────

const LEVELS = ["sistem","sub_sistem","unit_mesin","bagian_mesin","spare_part"] as const
type Level = typeof LEVELS[number]

const LEVEL_LABELS: Record<Level, string> = {
  sistem: "Sistem", sub_sistem: "Sub Sistem", unit_mesin: "Unit Mesin",
  bagian_mesin: "Bagian Mesin", spare_part: "Spare Part",
}
const LEVEL_COLORS: Record<Level, string> = {
  sistem:       "bg-blue-100 text-blue-800 border-blue-200",
  sub_sistem:   "bg-violet-100 text-violet-800 border-violet-200",
  unit_mesin:   "bg-teal-100 text-teal-800 border-teal-200",
  bagian_mesin: "bg-orange-100 text-orange-800 border-orange-200",
  spare_part:   "bg-emerald-100 text-emerald-800 border-emerald-200",
}

const EMPTY_FORM: EquipmentCreatePayload = {
  sistem: "", sub_sistem: "", unit_mesin: "", bagian_mesin: "",
  spare_part: "", spesifikasi: "", sku: "", bu: "", remarks: "",
}

// ─── Tree builder ─────────────────────────────────────────────────────────────

function buildTree(rows: ApiEquipmentTree[]) {
  type Node = { label: string; children: Map<string, Node>; rows: ApiEquipmentTree[]; level: Level }
  const root = new Map<string, Node>()
  for (const r of rows) {
    const s  = r.sistem       ?? ""
    const ss = r.sub_sistem   ?? ""
    const u  = r.unit_mesin   ?? ""
    const b  = r.bagian_mesin ?? ""
    if (!root.has(s)) root.set(s, { label: s, children: new Map(), rows: [], level: "sistem" })
    const sNode = root.get(s)!
    if (!ss) { sNode.rows.push(r); continue }
    if (!sNode.children.has(ss)) sNode.children.set(ss, { label: ss, children: new Map(), rows: [], level: "sub_sistem" })
    const ssNode = sNode.children.get(ss)!
    if (!u) { ssNode.rows.push(r); continue }
    if (!ssNode.children.has(u)) ssNode.children.set(u, { label: u, children: new Map(), rows: [], level: "unit_mesin" })
    const uNode = ssNode.children.get(u)!
    if (!b) { uNode.rows.push(r); continue }
    if (!uNode.children.has(b)) uNode.children.set(b, { label: b, children: new Map(), rows: [], level: "bagian_mesin" })
    uNode.children.get(b)!.rows.push(r)
  }
  return root
}

// ─── DropdownSearch ───────────────────────────────────────────────────────────

interface DropdownSearchProps {
  value: string; onChange: (val: string) => void
  options: string[]; placeholder?: string
}

function DropdownSearch({ value, onChange, options, placeholder }: DropdownSearchProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false); setQuery("")
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const filtered = useMemo(() =>
    query ? options.filter(o => o.toLowerCase().includes(query.toLowerCase())) : options
  , [options, query])

  const showCreateNew = query.trim() !== "" && !options.some(o => o.toLowerCase() === query.toLowerCase())

  function handleSelect(val: string) { onChange(val); setOpen(false); setQuery("") }
  function handleCreateNew() { onChange(query.trim()); setOpen(false); setQuery("") }
  function handleClear(e: React.MouseEvent) { e.stopPropagation(); onChange(""); setQuery("") }

  return (
    <div ref={containerRef} className="relative">
      <button type="button"
        onClick={() => { setOpen(v => !v); setTimeout(() => inputRef.current?.focus(), 50) }}
        className={cn("w-full flex items-center justify-between gap-2 h-8 px-3 rounded-md border text-sm transition-colors bg-white hover:bg-slate-50 border-input", open && "ring-2 ring-blue-500 border-blue-500")}>
        <span className={cn("truncate text-left flex-1", !value && "text-muted-foreground")}>{value || placeholder || "Pilih atau ketik..."}</span>
        <div className="flex items-center gap-1 shrink-0">
          {value && (<span onClick={handleClear} className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-pointer flex items-center justify-center"><X className="h-3 w-3" /></span>)}
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Cari atau ketik nama baru..."
                className="w-full pl-7 pr-2 py-1.5 text-xs border rounded-md bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              {query && (<button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="h-3 w-3" /></button>)}
            </div>
          </div>
          <div className="max-h-44 overflow-y-auto">
            {filtered.length === 0 && !showCreateNew && (
              <div className="px-3 py-4 text-xs text-center text-muted-foreground">Tidak ada pilihan tersedia</div>
            )}
            {filtered.map(opt => (
              <button key={opt} type="button" onClick={() => handleSelect(opt)}
                className={cn("w-full text-left px-3 py-2 text-xs hover:bg-blue-50 transition-colors", value === opt && "bg-blue-50 text-blue-700 font-medium")}>
                {opt}
              </button>
            ))}
            {showCreateNew && (
              <>
                {filtered.length > 0 && <div className="border-t" />}
                <button type="button" onClick={handleCreateNew}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-50 transition-colors flex items-center gap-2 text-emerald-700 font-medium">
                  <Plus className="h-3 w-3 shrink-0" />Tambah baru: &ldquo;{query.trim()}&rdquo;
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Access Denied ────────────────────────────────────────────────────────────

function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center px-4">
      <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
        <ShieldOff className="h-8 w-8 text-red-400" />
      </div>
      <div>
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Halaman ini hanya untuk <strong>Administrator</strong> dan <strong>Plant Manager</strong>.
        </p>
      </div>
    </div>
  )
}

// ─── TreeNode ─────────────────────────────────────────────────────────────────

function TreeNode({ label, level, children, rows, depth, selected, onSelect, onEdit, onDelete, onVerify }: {
  label: string; level: Level; children: Map<string, any>; rows: ApiEquipmentTree[]
  depth: number; selected: Set<number>
  onSelect: (id: number, checked: boolean) => void
  onEdit: (r: ApiEquipmentTree) => void
  onDelete: (id: number) => void
  onVerify: (r: ApiEquipmentTree, action: "verify"|"unverify") => void
}) {
  const [open, setOpen] = useState(depth < 2)
  const allRows = rows.concat([...children.values()].flatMap(n => n.rows))
  const verifiedCount = allRows.filter(r => r.is_verified).length

  return (
    <div className={cn("border-l-2 ml-4", depth === 0 ? "border-blue-200 ml-0" : "border-slate-200")}>
      <div
        className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors group", depth === 0 && "bg-slate-50/80")}
        onClick={() => setOpen(v => !v)}
      >
        <span className="text-slate-400 shrink-0">
          {(children.size > 0 || rows.length > 0)
            ? (open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />)
            : <span className="w-3.5 inline-block" />}
        </span>
        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 shrink-0 border", LEVEL_COLORS[level])}>
          {LEVEL_LABELS[level]}
        </Badge>
        <span className={cn("font-medium text-sm truncate", depth === 0 ? "text-slate-900" : "text-slate-700")}>
          {label || "—"}
        </span>
        {allRows.length > 0 && (
          <span className="ml-auto text-xs text-slate-400 shrink-0">
            <span className="text-emerald-600 font-medium">{verifiedCount}</span>/{allRows.length}
          </span>
        )}
      </div>
      {open && (
        <div className="ml-4">
          {[...children.entries()].map(([key, node]) => (
            <TreeNode key={key} label={node.label} level={node.level}
              children={node.children} rows={node.rows} depth={depth + 1}
              selected={selected} onSelect={onSelect} onEdit={onEdit}
              onDelete={onDelete} onVerify={onVerify} />
          ))}
          {rows.map(r => (
            <div key={r.id} className={cn(
              "flex items-start gap-2 px-3 py-2 ml-4 rounded-lg border-l-2 mb-0.5 hover:bg-slate-50 transition-colors group",
              r.is_verified ? "border-emerald-300 bg-emerald-50/30" : "border-amber-200 bg-amber-50/20",
            )}>
              <input type="checkbox" checked={selected.has(r.id)}
                onChange={e => onSelect(r.id, e.target.checked)}
                onClick={e => e.stopPropagation()}
                className="mt-1 h-3.5 w-3.5 shrink-0 accent-teal-600" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-slate-800 truncate">{r.spare_part || r.bagian_mesin || "—"}</span>
                  {r.is_verified
                    ? <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] px-1.5 py-0 hover:bg-emerald-100">✓ Verified</Badge>
                    : <Badge className="bg-amber-100 text-amber-700 border border-amber-200 text-[10px] px-1.5 py-0 hover:bg-amber-100">Pending</Badge>}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5">
                  {r.spesifikasi && <span className="text-xs text-slate-500 truncate max-w-[300px]">{r.spesifikasi}</span>}
                  {r.sku && <span className="text-xs font-mono text-blue-600">{r.sku}</span>}
                  {r.bu  && <span className="text-xs text-slate-400">{r.bu}</span>}
                </div>
              </div>
              <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-slate-400 hover:text-blue-600" onClick={() => onEdit(r)} title="Edit"><Pencil className="h-3 w-3" /></Button>
                {r.is_verified
                  ? <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-slate-400 hover:text-amber-600" onClick={() => onVerify(r, "unverify")} title="Batalkan verifikasi"><ShieldX className="h-3 w-3" /></Button>
                  : <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-slate-400 hover:text-emerald-600" onClick={() => onVerify(r, "verify")} title="Verifikasi"><ShieldCheck className="h-3 w-3" /></Button>}
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-slate-400 hover:text-red-600" onClick={() => onDelete(r.id)} title="Hapus"><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Pagination Bar ───────────────────────────────────────────────────────────

function PaginationBar({ page, totalPages, total, pageSize, startItem, endItem, loading, onPage, onPageSize }: {
  page: number; totalPages: number; total: number
  pageSize: PageSizeOption; startItem: number; endItem: number; loading: boolean
  onPage: (p: number) => void; onPageSize: (s: PageSizeOption) => void
}) {
  const pages = useMemo(() => {
    const arr: (number | "…")[] = []
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) arr.push(p)
      else if (arr[arr.length - 1] !== "…") arr.push("…")
    }
    return arr
  }, [page, totalPages])

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 bg-white flex-wrap">
      {/* Info + page size */}
      <div className="flex items-center gap-3">
        <p className="text-xs text-slate-500">
          Menampilkan <span className="font-semibold text-slate-700">{startItem}–{endItem}</span> dari{" "}
          <span className="font-semibold text-slate-700">{total.toLocaleString()}</span> record
        </p>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span>|</span>
          <Select value={String(pageSize)} onValueChange={v => onPageSize(Number(v) as PageSizeOption)}>
            <SelectTrigger className="h-6 w-14 text-xs px-2 border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map(n => (
                <SelectItem key={n} value={String(n)} className="text-xs">{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>/ hal</span>
        </div>
      </div>

      {/* Page buttons */}
      <div className="flex items-center gap-1">
        <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => onPage(1)} disabled={page === 1 || loading} title="Pertama">
          <ChevronsLeft className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => onPage(page - 1)} disabled={page === 1 || loading} title="Sebelumnya">
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        {pages.map((p, i) =>
          p === "…"
            ? <span key={`e${i}`} className="px-1 text-xs text-slate-400">…</span>
            : <Button key={p} size="sm"
                variant={page === p ? "default" : "outline"}
                className={cn("h-7 min-w-[28px] px-2 text-xs", page === p && "bg-blue-600 hover:bg-blue-700 border-blue-600")}
                onClick={() => onPage(p as number)}
                disabled={loading}>
                {p}
              </Button>
        )}
        <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => onPage(page + 1)} disabled={page === totalPages || loading} title="Berikutnya">
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => onPage(totalPages)} disabled={page === totalPages || loading} title="Terakhir">
          <ChevronsRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EquipmentPage() {
  const { user } = useAuth()
  const isAdmin  = user?.role === "admin" || user?.role === "manager"
  if (!canAccessEquipment(user?.role)) return <AccessDenied />

  // ── Shared filter state ──────────────────────────────────────────────────
  const [search,         setSearch]         = useState("")
  const [filterVerified, setFilterVerified] = useState<"all"|"verified"|"pending">("all")
  const [viewMode,       setViewMode]       = useState<"tree"|"table">("tree")
  const [selected,       setSelected]       = useState<Set<number>>(new Set())

  // ── Tree view state (load all — filtered client-side) ────────────────────
  const [treeRows,  setTreeRows]  = useState<ApiEquipmentTree[]>([])
  const [treeLoading, setTreeLoading] = useState(false)
  const [treeError,   setTreeError]   = useState<string | null>(null)

  // ── Stats ────────────────────────────────────────────────────────────────
  const [stats, setStats] = useState<EquipmentStats | null>(null)

  // ── Table view — SERVER-SIDE pagination via hook ─────────────────────────
  const tableFilters = useMemo(() => ({
    search:       search || undefined,
    is_verified:  filterVerified === "all" ? undefined : filterVerified === "verified",
  }), [search, filterVerified])

  const table = useEquipmentTable(tableFilters)

  const tableStartItem = table.total === 0 ? 0 : (table.page - 1) * table.pageSize + 1
  const tableEndItem   = Math.min(table.page * table.pageSize, table.total)

  // ── Form dialog ──────────────────────────────────────────────────────────
  const [formOpen,  setFormOpen]  = useState(false)
  const [editing,   setEditing]   = useState<ApiEquipmentTree | null>(null)
  const [form,      setForm]      = useState<EquipmentCreatePayload>(EMPTY_FORM)
  const [formError, setFormError] = useState("")
  const [isSaving,  setIsSaving]  = useState(false)
  const [deleteId,  setDeleteId]  = useState<number | null>(null)

  // ── Fetch tree data (lazy — only when tree view active) ──────────────────
  const fetchTreeData = useCallback(async () => {
    setTreeLoading(true); setTreeError(null)
    try {
      const [data, s] = await Promise.all([
        getEquipment({ limit: 2000 }),
        getEquipmentStats(),
      ])
      setTreeRows(data); setStats(s)
    } catch (e: any) {
      setTreeError(e.message ?? "Gagal memuat data")
    } finally { setTreeLoading(false) }
  }, [])

  // Fetch stats awal + tree data hanya saat mode tree
  useEffect(() => {
    if (viewMode === "tree") fetchTreeData()
    else getEquipmentStats().then(setStats).catch(() => {})
  }, [viewMode, fetchTreeData])

  // ── Tree filtered + built ────────────────────────────────────────────────
  const treeFiltered = useMemo(() => {
    let r = treeRows
    if (filterVerified === "verified") r = r.filter(x => x.is_verified)
    if (filterVerified === "pending")  r = r.filter(x => !x.is_verified)
    if (search) {
      const q = search.toLowerCase()
      r = r.filter(x => [x.sistem,x.sub_sistem,x.unit_mesin,x.bagian_mesin,x.spare_part,x.spesifikasi,x.sku]
        .some(v => v?.toLowerCase().includes(q)))
    }
    return r
  }, [treeRows, search, filterVerified])

  const tree = useMemo(() => buildTree(treeFiltered), [treeFiltered])

  // ── Unique options for form cascading dropdowns (from tree rows) ─────────
  const sistemOptions = useMemo(() => [...new Set(treeRows.map(r => r.sistem).filter(Boolean))].sort() as string[], [treeRows])
  const subSistemOptions = useMemo(() => {
    const base = treeRows.filter(r => !form.sistem || r.sistem === form.sistem).map(r => r.sub_sistem).filter(Boolean) as string[]
    return [...new Set(base)].sort()
  }, [treeRows, form.sistem])
  const unitMesinOptions = useMemo(() => {
    const base = treeRows.filter(r => {
      if (form.sistem && r.sistem !== form.sistem) return false
      if (form.sub_sistem && r.sub_sistem !== form.sub_sistem) return false
      return true
    }).map(r => r.unit_mesin).filter(Boolean) as string[]
    return [...new Set(base)].sort()
  }, [treeRows, form.sistem, form.sub_sistem])
  const bagianMesinOptions = useMemo(() => {
    const base = treeRows.filter(r => {
      if (form.sistem && r.sistem !== form.sistem) return false
      if (form.sub_sistem && r.sub_sistem !== form.sub_sistem) return false
      if (form.unit_mesin && r.unit_mesin !== form.unit_mesin) return false
      return true
    }).map(r => r.bagian_mesin).filter(Boolean) as string[]
    return [...new Set(base)].sort()
  }, [treeRows, form.sistem, form.sub_sistem, form.unit_mesin])
  const sparePartOptions = useMemo(() => {
    const base = treeRows.filter(r => {
      if (form.sistem && r.sistem !== form.sistem) return false
      if (form.sub_sistem && r.sub_sistem !== form.sub_sistem) return false
      if (form.unit_mesin && r.unit_mesin !== form.unit_mesin) return false
      if (form.bagian_mesin && r.bagian_mesin !== form.bagian_mesin) return false
      return true
    }).map(r => r.spare_part).filter(Boolean) as string[]
    return [...new Set(base)].sort()
  }, [treeRows, form.sistem, form.sub_sistem, form.unit_mesin, form.bagian_mesin])

  // ── Selection helpers ────────────────────────────────────────────────────
  function toggleSelect(id: number, checked: boolean) {
    setSelected(prev => { const s = new Set(prev); checked ? s.add(id) : s.delete(id); return s })
  }
  const activeRows = viewMode === "tree" ? treeFiltered : table.rows
  function selectAll()   { setSelected(new Set(activeRows.map(r => r.id))) }
  function clearSelect() { setSelected(new Set()) }

  // ── Form ─────────────────────────────────────────────────────────────────
  function openAdd()  { setEditing(null); setForm(EMPTY_FORM); setFormError(""); setFormOpen(true) }
  function openEdit(r: ApiEquipmentTree) {
    setEditing(r)
    setForm({ sistem: r.sistem, sub_sistem: r.sub_sistem ?? "", unit_mesin: r.unit_mesin ?? "",
              bagian_mesin: r.bagian_mesin ?? "", spare_part: r.spare_part ?? "",
              spesifikasi: r.spesifikasi ?? "", sku: r.sku ?? "", bu: r.bu ?? "", remarks: r.remarks ?? "" })
    setFormError(""); setFormOpen(true)
  }

  function handleSistemChange(val: string)     { setForm(f => ({ ...f, sistem: val,      sub_sistem: "", unit_mesin: "", bagian_mesin: "", spare_part: "" })) }
  function handleSubSistemChange(val: string)  { setForm(f => ({ ...f, sub_sistem: val,  unit_mesin: "", bagian_mesin: "", spare_part: "" })) }
  function handleUnitMesinChange(val: string)  { setForm(f => ({ ...f, unit_mesin: val,  bagian_mesin: "", spare_part: "" })) }
  function handleBagianMesinChange(val: string){ setForm(f => ({ ...f, bagian_mesin: val, spare_part: "" })) }

  async function handleSave() {
    if (!form.sistem.trim()) { setFormError("Sistem wajib diisi"); return }
    setIsSaving(true); setFormError("")
    try {
      if (editing) {
        await updateEquipment(editing.id, form)
        toast.success("Data berhasil diperbarui")
      } else {
        await createEquipment(form)
        toast.success("Data berhasil ditambahkan")
      }
      setFormOpen(false)
      // Refresh sesuai view aktif
      if (viewMode === "tree") fetchTreeData()
      else { table.refresh(); getEquipmentStats().then(setStats).catch(() => {}) }
    } catch (e: any) { setFormError(e.message ?? "Gagal menyimpan")
    } finally { setIsSaving(false) }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      await deleteEquipment(deleteId)
      toast.success("Data dihapus")
      setDeleteId(null)
      if (viewMode === "tree") fetchTreeData()
      else { table.refresh(); getEquipmentStats().then(setStats).catch(() => {}) }
    } catch { toast.error("Gagal menghapus"); setDeleteId(null) }
  }

  async function handleVerify(r: ApiEquipmentTree, action: "verify"|"unverify") {
    try {
      action === "verify" ? await verifyEquipment(r.id) : await unverifyEquipment(r.id)
      toast.success(action === "verify" ? "Data terverifikasi" : "Verifikasi dibatalkan")
      if (viewMode === "tree") fetchTreeData()
      else { table.refresh(); getEquipmentStats().then(setStats).catch(() => {}) }
    } catch { toast.error("Gagal mengubah status verifikasi") }
  }

  async function handleBulkVerify(action: "verify"|"unverify") {
    if (!selected.size) return
    try {
      const res = await verifyBulk([...selected], action)
      clearSelect()
      toast.success(`${res.updated} data berhasil di-${action === "verify" ? "verifikasi" : "unverify"}`)
      if (viewMode === "tree") fetchTreeData()
      else { table.refresh(); getEquipmentStats().then(setStats).catch(() => {}) }
    } catch { toast.error("Gagal bulk verify") }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    e.target.value = ""
    try {
      const res = await importEquipment(file)
      toast.success(`${res.imported} baris diimport`)
      if (res.errors?.length) toast.warning(`${res.errors.length} baris gagal`)
      if (viewMode === "tree") fetchTreeData()
      else { table.refresh(); getEquipmentStats().then(setStats).catch(() => {}) }
    } catch (err: any) { toast.error(err.message ?? "Import gagal") }
  }

  const isLoading = viewMode === "tree" ? treeLoading : table.loading
  const error     = viewMode === "tree" ? treeError   : table.error

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-600 px-8 py-10">
        <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
            <TreePine className="h-7 w-7 text-white" />
          </div>
          <div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">Master Data</p>
            <h1 className="text-3xl font-bold text-white tracking-tight">Equipment Tree</h1>
            <p className="text-white/70 text-sm mt-1">Hierarki sistem → sub sistem → unit mesin → spare part</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Record", value: stats.total,             icon: TreePine,     color: "text-blue-700",    bg: "bg-blue-50" },
              { label: "Verified",     value: stats.verified,          icon: CheckCircle2, color: "text-emerald-700", bg: "bg-emerald-50" },
              { label: "Pending",      value: stats.unverified,        icon: Clock,        color: "text-amber-700",   bg: "bg-amber-50" },
              { label: "Sistem",       value: stats.by_sistem.length,  icon: Filter,       color: "text-indigo-700",  bg: "bg-indigo-50" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <Card key={label} className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", bg)}>
                    <Icon className={cn("h-5 w-5", color)} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className={cn("text-xl font-bold", color)}>{value.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">

              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Cari sistem, unit, SKU..." value={search}
                  onChange={e => setSearch(e.target.value)} className="pl-9 h-8 text-sm" />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Filter verified */}
              <Select value={filterVerified} onValueChange={v => setFilterVerified(v as any)}>
                <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>

              {/* View toggle */}
              <div className="flex rounded-md border overflow-hidden">
                {(["tree","table"] as const).map(m => (
                  <button key={m} onClick={() => setViewMode(m)}
                    className={cn("px-3 py-1.5 text-xs font-medium transition-colors",
                      viewMode === m ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50")}>
                    {m === "tree" ? "🌳 Tree" : "📋 Table"}
                  </button>
                ))}
              </div>

              {/* Refresh */}
              <Button size="sm" variant="outline" className="h-8 gap-1.5" disabled={isLoading}
                onClick={() => viewMode === "tree" ? fetchTreeData() : table.refresh()}>
                <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
                Refresh
              </Button>

              {/* Bulk actions */}
              {selected.size > 0 && isAdmin && (
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-xs text-blue-700 font-medium">{selected.size} dipilih</span>
                  <Button size="sm" variant="ghost" className="h-6 text-xs text-emerald-700 hover:bg-emerald-100" onClick={() => handleBulkVerify("verify")}>
                    <ShieldCheck className="h-3 w-3 mr-1" />Verify
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 text-xs text-amber-700 hover:bg-amber-100" onClick={() => handleBulkVerify("unverify")}>
                    <ShieldX className="h-3 w-3 mr-1" />Unverify
                  </Button>
                  <button onClick={clearSelect} className="text-slate-400 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>
                </div>
              )}

              <div className="ml-auto flex items-center gap-2">
                {isAdmin && activeRows.length > 0 && (
                  <Button size="sm" variant="outline" className="h-8 text-xs"
                    onClick={selected.size === activeRows.length ? clearSelect : selectAll}>
                    {selected.size === activeRows.length ? "Deselect All" : "Select All"}
                  </Button>
                )}
                <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => exportEquipment()}>
                  <Download className="h-3.5 w-3.5" />Export
                </Button>
                {isAdmin && (
                  <label className="cursor-pointer">
                    <Button size="sm" variant="outline" className="h-8 gap-1.5" asChild>
                      <span><Upload className="h-3.5 w-3.5" />Import</span>
                    </Button>
                    <input type="file" accept=".xlsx" className="hidden" onChange={handleImport} />
                  </label>
                )}
                {isAdmin && (
                  <Button size="sm" onClick={openAdd} className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-3.5 w-3.5" />Tambah
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />{error}
          </div>
        )}

        {/* Content card */}
        <Card className="border border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm flex items-center gap-2">
              <TreePine className="h-4 w-4 text-blue-600" />
              {viewMode === "tree" ? "Hierarki Equipment" : "Daftar Equipment"}
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 ml-1">
                {viewMode === "tree" ? treeFiltered.length : table.total} record
              </Badge>
              {viewMode === "table" && table.loading && (
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-500 ml-1" />
              )}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {/* ── TREE VIEW ── */}
            {viewMode === "tree" && (
              treeLoading ? (
                <div className="flex justify-center py-16"><RefreshCw className="h-6 w-6 animate-spin text-blue-600" /></div>
              ) : treeFiltered.length === 0 ? (
                <div className="text-center py-14 text-muted-foreground text-sm">
                  {search || filterVerified !== "all" ? "Tidak ada data yang cocok." : "Belum ada data equipment."}
                </div>
              ) : (
                <div className="p-4 space-y-1 max-h-[600px] overflow-y-auto">
                  {[...tree.entries()].map(([key, node]) => (
                    <TreeNode key={key} label={node.label} level="sistem"
                      children={node.children} rows={node.rows} depth={0}
                      selected={selected} onSelect={toggleSelect}
                      onEdit={openEdit} onDelete={setDeleteId} onVerify={handleVerify} />
                  ))}
                </div>
              )
            )}

            {/* ── TABLE VIEW (server-side paginated) ── */}
            {viewMode === "table" && (
              <>
                {table.rows.length === 0 && !table.loading ? (
                  <div className="text-center py-14 text-muted-foreground text-sm">
                    {search || filterVerified !== "all" ? "Tidak ada data yang cocok." : "Belum ada data equipment."}
                  </div>
                ) : (
                  <div className="overflow-auto max-h-[520px]">
                    <table className="w-full text-sm min-w-[900px]">
                      <thead className="bg-slate-50 sticky top-0 z-10 border-b">
                        <tr>
                          {isAdmin && <th className="px-3 py-2.5 w-8" />}
                          {["Sistem","Sub Sistem","Unit Mesin","Bagian Mesin","Spare Part","Spesifikasi","SKU","BU","Status"].map(h => (
                            <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">{h}</th>
                          ))}
                          <th className="px-3 py-2.5 text-center text-xs font-semibold">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className={cn(table.loading && "opacity-60 pointer-events-none")}>
                        {table.rows.map((r, i) => (
                          <tr key={r.id} className={cn("border-t hover:bg-blue-50/30 transition-colors", i % 2 === 0 ? "bg-white" : "bg-slate-50/50")}>
                            {isAdmin && (
                              <td className="px-3 py-2 text-center">
                                <input type="checkbox" checked={selected.has(r.id)}
                                  onChange={e => toggleSelect(r.id, e.target.checked)}
                                  className="h-3.5 w-3.5 accent-blue-600" />
                              </td>
                            )}
                            <td className="px-3 py-2 font-medium text-xs">{r.sistem}</td>
                            <td className="px-3 py-2 text-xs text-slate-600">{r.sub_sistem ?? "—"}</td>
                            <td className="px-3 py-2 text-xs text-slate-600">{r.unit_mesin ?? "—"}</td>
                            <td className="px-3 py-2 text-xs text-slate-600">{r.bagian_mesin ?? "—"}</td>
                            <td className="px-3 py-2 text-xs font-medium">{r.spare_part ?? "—"}</td>
                            <td className="px-3 py-2 text-xs text-slate-500 max-w-[200px] truncate">{r.spesifikasi ?? "—"}</td>
                            <td className="px-3 py-2 text-xs font-mono text-blue-600">{r.sku ?? "—"}</td>
                            <td className="px-3 py-2 text-xs text-slate-500">{r.bu ?? "—"}</td>
                            <td className="px-3 py-2">
                              {r.is_verified
                                ? <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] px-1.5 py-0 hover:bg-emerald-100">✓ Verified</Badge>
                                : <Badge className="bg-amber-100 text-amber-700 border border-amber-200 text-[10px] px-1.5 py-0 hover:bg-amber-100">Pending</Badge>}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center justify-center gap-0.5">
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-slate-400 hover:text-blue-600" onClick={() => openEdit(r)}><Pencil className="h-3 w-3" /></Button>
                                {r.is_verified
                                  ? <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-slate-400 hover:text-amber-600" onClick={() => handleVerify(r, "unverify")}><ShieldX className="h-3 w-3" /></Button>
                                  : <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-slate-400 hover:text-emerald-600" onClick={() => handleVerify(r, "verify")}><ShieldCheck className="h-3 w-3" /></Button>}
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-slate-400 hover:text-red-600" onClick={() => setDeleteId(r.id)}><Trash2 className="h-3 w-3" /></Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination bar */}
                {table.total > 0 && (
                  <PaginationBar
                    page={table.page} totalPages={table.totalPages}
                    total={table.total} pageSize={table.pageSize}
                    startItem={tableStartItem} endItem={tableEndItem}
                    loading={table.loading}
                    onPage={table.setPage} onPageSize={table.setPageSize}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Form Dialog ─────────────────────────────────────────────────────── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TreePine className="h-5 w-5 text-blue-600" />
              {editing ? "Edit Equipment" : "Tambah Equipment"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
              <Search className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>Pilih dari daftar yang tersedia, atau ketik nama baru untuk menambahkan entri baru. Memilih level atas akan memfilter pilihan level di bawahnya.</span>
            </div>

            {[
              { label: "Sistem", key: "sistem", onChange: handleSistemChange, options: sistemOptions, required: true, placeholder: "Pilih atau tambah sistem..." },
              { label: "Sub Sistem", key: "sub_sistem", onChange: handleSubSistemChange, options: subSistemOptions, placeholder: "Pilih atau tambah sub sistem..." },
              { label: "Unit Mesin", key: "unit_mesin", onChange: handleUnitMesinChange, options: unitMesinOptions, placeholder: "Pilih atau tambah unit mesin..." },
              { label: "Bagian Mesin", key: "bagian_mesin", onChange: handleBagianMesinChange, options: bagianMesinOptions, placeholder: "Pilih atau tambah bagian mesin..." },
              { label: "Spare Part", key: "spare_part", onChange: (v: string) => setForm(f => ({ ...f, spare_part: v })), options: sparePartOptions, placeholder: "Pilih atau tambah spare part..." },
            ].map(({ label, key, onChange, options, required, placeholder }) => (
              <div key={key}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">
                  {label}{required && <span className="text-red-500 ml-0.5">*</span>}
                </p>
                <DropdownSearch value={(form as any)[key] ?? ""} onChange={onChange} options={options} placeholder={placeholder} />
              </div>
            ))}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">Spesifikasi</p>
              <Input value={form.spesifikasi ?? ""} onChange={e => setForm(f => ({ ...f, spesifikasi: e.target.value }))} placeholder="Spesifikasi teknis" className="h-8 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">SKU</p>
                <Input value={form.sku ?? ""} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="Kode SKU" className="h-8 text-sm font-mono" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">BU</p>
                <Input value={form.bu ?? ""} onChange={e => setForm(f => ({ ...f, bu: e.target.value }))} placeholder="Business Unit" className="h-8 text-sm" />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">Keterangan</p>
              <Textarea value={form.remarks ?? ""} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Catatan tambahan" rows={2} className="text-sm resize-none" />
            </div>
            {editing && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-700">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />Mengubah data akan mereset status verifikasi ke Pending.
              </div>
            )}
            {formError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200 text-xs text-red-700">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />{formError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
              {isSaving && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              {editing ? "Simpan Perubahan" : "Tambah Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ───────────────────────────────────────────────────── */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader><DialogTitle className="text-red-700">Hapus Data?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Data akan dihapus secara permanen dan tidak dapat dikembalikan.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Ya, Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
