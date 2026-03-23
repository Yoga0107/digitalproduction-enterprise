"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { OeeGuard } from "@/components/oee/oee-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MachineLossTree, LossNode, MovePayload } from "@/components/oee/machine-loss-tree"
import {
  getMachineLosses,
  createLossLevel1, updateLossLevel1, deleteLossLevel1,
  createLossLevel2, updateLossLevel2, deleteLossLevel2,
  createLossLevel3, updateLossLevel3, deleteLossLevel3,
  moveMachineLoss,
} from "@/services/masterService"
import { ApiMachineLoss } from "@/types/api"
import { toast } from "sonner"
import { Loader2, Plus, RefreshCw, Check, X, Workflow } from "lucide-react"

// ─── Tree builder ─────────────────────────────────────────────────────────────
function buildTree(flat: ApiMachineLoss[]): LossNode[] {
  const map = new Map<number, LossNode>()
  flat.forEach(n => map.set(n.id, {
    id: n.id, parent_id: n.parent_id,
    level: n.level, name: n.name,
    sort_order: n.sort_order, children: [],
  }))
  const roots: LossNode[] = []
  map.forEach(node => {
    if (node.parent_id === null) roots.push(node)
    else {
      const parent = map.get(node.parent_id)
      if (parent) parent.children.push(node)
      else roots.push(node)
    }
  })
  const sort = (ns: LossNode[]) => {
    ns.sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
    ns.forEach(n => sort(n.children))
  }
  sort(roots)
  return roots
}

// Optimistic update: pindah L3 ke parent baru di flat array tanpa fetch
function applyOptimisticMove(flat: ApiMachineLoss[], nodeId: number, newParentId: number): ApiMachineLoss[] {
  return flat.map(n => n.id === nodeId ? { ...n, parent_id: newParentId } : n)
}

function countAll(ns: LossNode[]): number {
  return ns.reduce((acc, n) => acc + 1 + countAll(n.children), 0)
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function MachineLossPage() {
  const [flat, setFlat]           = useState<ApiMachineLoss[]>([])
  const [tree, setTree]           = useState<LossNode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [addingL1, setAddingL1]   = useState(false)
  const [newL1, setNewL1]         = useState("")
  const [savingL1, setSavingL1]   = useState(false)

  // Ref agar callback selalu baca data terbaru tanpa stale closure
  const flatRef = useRef<ApiMachineLoss[]>([])
  flatRef.current = flat

  // Tracking apakah ada full-load yang sedang berjalan (bukan silent sync)
  const loadingRef  = useRef(false)
  const syncingFetchRef = useRef(false)

  // ── load: fetch dari server ─────────────────────────────────────────────────
  // silent=true → update data di background tanpa spinner, tidak block drag
  const load = useCallback(async (silent = false) => {
    if (!silent) {
      // Full load: cegah concurrent, tampilkan spinner
      if (loadingRef.current) return
      loadingRef.current = true
      setIsLoading(true)
    } else {
      // Silent sync: cegah concurrent silent sync, tapi tidak block full load
      if (syncingFetchRef.current) return
      syncingFetchRef.current = true
    }

    try {
      const data = await getMachineLosses()
      setFlat(data)
      setTree(buildTree(data))
    } catch {
      if (!silent) toast.error("Gagal memuat machine losses")
    } finally {
      if (!silent) {
        loadingRef.current = false
        setIsLoading(false)
      } else {
        syncingFetchRef.current = false
      }
    }
  }, [])

  useEffect(() => { load() }, [load])

  function findFlat(id: number) {
    return flatRef.current.find(n => n.id === id)
  }

  // ── Add L1 ──────────────────────────────────────────────────────────────────
  async function saveL1() {
    if (!newL1.trim()) return
    setSavingL1(true)
    try {
      await createLossLevel1({ name: newL1.trim(), sort_order: flatRef.current.filter(n => n.level === 1).length })
      setNewL1(""); setAddingL1(false)
      toast.success("Level 1 berhasil ditambahkan")
      await load()
    } catch {
      toast.error("Gagal menambahkan Level 1")
    } finally {
      setSavingL1(false)
    }
  }

  // ── Add child ───────────────────────────────────────────────────────────────
  async function handleAddChild(parentId: number, level: 2 | 3, name: string) {
    try {
      const sortOrder = flatRef.current.filter(n => n.parent_id === parentId).length
      if (level === 2) await createLossLevel2({ level_1_id: parentId, name, sort_order: sortOrder })
      else             await createLossLevel3({ level_2_id: parentId, name, sort_order: sortOrder })
      toast.success(`Level ${level} berhasil ditambahkan`)
      await load()
    } catch (err: any) {
      toast.error(err?.detail ?? `Gagal menambahkan Level ${level}`)
    }
  }

  // ── Update name ─────────────────────────────────────────────────────────────
  async function handleUpdate(id: number, name: string) {
    const node = findFlat(id)
    if (!node) return
    try {
      if (node.level === 1)      await updateLossLevel1(id, { name })
      else if (node.level === 2) await updateLossLevel2(id, { name })
      else                       await updateLossLevel3(id, { name })
      toast.success("Nama berhasil diperbarui")
      await load()
    } catch {
      toast.error("Gagal memperbarui nama")
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────────
  async function handleDelete(id: number, hasChildren: boolean) {
    if (hasChildren) { toast.error("Hapus item anak terlebih dahulu"); return }
    const node = findFlat(id)
    if (!node) return
    try {
      if (node.level === 1)      await deleteLossLevel1(id)
      else if (node.level === 2) await deleteLossLevel2(id)
      else                       await deleteLossLevel3(id)
      toast.success("Item berhasil dihapus")
      await load()
    } catch (err: any) {
      toast.error(err?.detail ?? "Gagal menghapus item")
    }
  }

  // ── Move (dengan optimistic update) ─────────────────────────────────────────
  async function handleMove(payload: MovePayload) {
    const node = findFlat(payload.id)
    if (!node) return

    const isSameLevel  = node.level === payload.new_level
    const isSameParent = node.parent_id === payload.new_parent_id

    // Sama parent + sama level = tidak ada yang berubah, skip
    if (isSameLevel && isSameParent) return

    // ── Optimistic update: langsung update UI sebelum API selesai ─────────────
    if (payload.new_parent_id !== null) {
      const optimisticFlat = applyOptimisticMove(flatRef.current, payload.id, payload.new_parent_id)
      setFlat(optimisticFlat)
      setTree(buildTree(optimisticFlat))
    }

    setIsSyncing(true)
    try {
      await moveMachineLoss(payload.id, {
        new_parent_id:  payload.new_parent_id,
        new_level:      payload.new_level,
        new_sort_order: payload.new_sort_order,
      })
      toast.success("Berhasil dipindah ke Sub Category baru")
      // Silent reload: sync data dari server tanpa trigger loading spinner
      await load(true)
    } catch (err: any) {
      // Rollback optimistic update jika API gagal
      toast.error(err?.detail ?? "Gagal memindah node")
      await load()
    } finally {
      setIsSyncing(false)
    }
  }

  return (
<OeeGuard section="master">
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50/30">
        <div className="relative overflow-hidden bg-gradient-to-r from-teal-800 to-cyan-600 px-8 py-10">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="relative flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Workflow className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">Master Data</p>
              <h2 className="text-3xl font-bold text-white tracking-tight">Machine Losses</h2>
              <p className="text-white/70 text-sm mt-1">Machine Losses</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-emerald-900">Master Machine Losses</h1>
              <p className="text-sm text-emerald-600 mt-1">
                Saved to <code className="text-xs bg-muted px-1 py-0.5 rounded">loss_level_1/2/3</code> and
                auto-synced to <code className="text-xs bg-muted px-1 py-0.5 rounded">machine_losses</code> via trigger.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isSyncing && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Menyimpan…
                </span>
              )}
              <Button variant="outline" size="sm" onClick={() => load()} disabled={isLoading || isSyncing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button size="sm" onClick={() => setAddingL1(true)} disabled={addingL1 || isSyncing}>
                <Plus className="h-4 w-4 mr-2" /> Add Level 1
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-600">
            {[
              { label: "L1", style: "bg-blue-100 text-blue-700 border-blue-200",          desc: "Loss Category" },
              { label: "L2", style: "bg-violet-100 text-violet-700 border-violet-200",    desc: "Sub Category"  },
              { label: "L3", style: "bg-emerald-100 text-emerald-700 border-emerald-200", desc: "Detail Loss"   },
            ].map(({ label, style, desc }) => (
              <span key={label} className="flex items-center gap-1">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${style}`}>{label}</span>
                {desc}
              </span>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                Machine Loss Structure
                {!isLoading && (
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                    {countAll(tree)} items
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {addingL1 && (
                <div className="flex items-center gap-2 mb-3 p-2.5 rounded-md bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-emerald-100 text-emerald-700 border-emerald-200 shrink-0">L1</span>
                  <Input
                    autoFocus
                    placeholder="New Loss Category name..."
                    value={newL1}
                    onChange={e => setNewL1(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") saveL1()
                      if (e.key === "Escape") { setAddingL1(false); setNewL1("") }
                    }}
                    className="h-8 text-sm flex-1"
                  />
                  <Button size="sm" onClick={saveL1} disabled={savingL1 || !newL1.trim()}>
                    {savingL1 ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setAddingL1(false); setNewL1("") }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {isLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                </div>
              ) : (
                <MachineLossTree
                  nodes={tree}
                  onAddChild={handleAddChild}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onMove={handleMove}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </OeeGuard>
  )
}
