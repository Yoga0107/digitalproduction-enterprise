"use client"

import { useState, useEffect, useCallback } from "react"
import { OeeGuard } from "@/components/oee/oee-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MachineLossTree, LossNode, MovePayload } from "@/components/oee/machine-loss-tree"
import {
  getMachineLosses, createMachineLoss, updateMachineLoss,
  deleteMachineLoss, moveMachineLoss,
} from "@/services/masterService"
import { ApiMachineLoss } from "@/types/api"
import { toast } from "sonner"
import { Loader2, Plus, RefreshCw, Check, X } from "lucide-react"

// ─── Flat list → tree ────────────────────────────────────────────────────────
function buildTree(flat: ApiMachineLoss[]): LossNode[] {
  const map = new Map<number, LossNode>()
  flat.forEach(n => map.set(n.id, { id: n.id, parent_id: n.parent_id, level: n.level, name: n.name, sort_order: n.sort_order, children: [] }))
  const roots: LossNode[] = []
  map.forEach(node => {
    if (node.parent_id === null) {
      roots.push(node)
    } else {
      const parent = map.get(node.parent_id)
      if (parent) parent.children.push(node)
    }
  })
  // Sort by sort_order then id
  const sort = (ns: LossNode[]) => {
    ns.sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
    ns.forEach(n => sort(n.children))
  }
  sort(roots)
  return roots
}

function countAll(ns: LossNode[]): number {
  return ns.reduce((acc, n) => acc + 1 + countAll(n.children), 0)
}

export default function MachineLossPage() {
  const [flat, setFlat]           = useState<ApiMachineLoss[]>([])
  const [tree, setTree]           = useState<LossNode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [addingL1, setAddingL1]   = useState(false)
  const [newL1, setNewL1]         = useState("")
  const [savingL1, setSavingL1]   = useState(false)

  const load = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await getMachineLosses()
      setFlat(data)
      setTree(buildTree(data))
    } catch { toast.error("Gagal memuat data machine losses") }
    finally { setIsLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Add Level 1 ─────────────────────────────────────────────────────────
  async function saveL1() {
    if (!newL1.trim()) return
    setSavingL1(true)
    try {
      const created = await createMachineLoss({ parent_id: null, level: 1, name: newL1.trim(), sort_order: flat.filter(n => n.level === 1).length })
      const newNode: ApiMachineLoss = created
      setFlat(prev => [...prev, newNode])
      setTree(prev => [...prev, { id: created.id, parent_id: null, level: 1, name: created.name, sort_order: created.sort_order, children: [] }])
      setNewL1(""); setAddingL1(false)
      toast.success("Level 1 berhasil ditambahkan")
    } catch { toast.error("Gagal menambah Level 1") }
    finally { setSavingL1(false) }
  }

  // ── Add child ────────────────────────────────────────────────────────────
  async function handleAddChild(parentId: number, level: 2 | 3, name: string) {
    try {
      const sortOrder = flat.filter(n => n.parent_id === parentId).length
      await createMachineLoss({ parent_id: parentId, level, name, sort_order: sortOrder })
      await load()
      toast.success(`Level ${level} berhasil ditambahkan`)
    } catch { toast.error("Gagal menambah child") }
  }

  // ── Update name ──────────────────────────────────────────────────────────
  async function handleUpdate(id: number, name: string) {
    try {
      await updateMachineLoss(id, { name })
      setFlat(prev => prev.map(n => n.id === id ? { ...n, name } : n))
      setTree(buildTree(flat.map(n => n.id === id ? { ...n, name } : n)))
      toast.success("Nama berhasil diperbarui")
    } catch { toast.error("Gagal memperbarui nama") }
  }

  // ── Delete ───────────────────────────────────────────────────────────────
  async function handleDelete(id: number, hasChildren: boolean) {
    if (hasChildren) { toast.error("Hapus child terlebih dahulu sebelum menghapus parent"); return }
    try {
      await deleteMachineLoss(id)
      const newFlat = flat.filter(n => n.id !== id)
      setFlat(newFlat)
      setTree(buildTree(newFlat))
      toast.success("Data berhasil dihapus")
    } catch { toast.error("Gagal menghapus data") }
  }

  // ── Move (drag & drop) ───────────────────────────────────────────────────
  async function handleMove(payload: MovePayload) {
    try {
      const updated = await moveMachineLoss(payload.id, {
        new_parent_id: payload.new_parent_id,
        new_level: payload.new_level,
        new_sort_order: payload.new_sort_order,
      })
      const newFlat = flat.map(n => n.id === payload.id
        ? { ...n, parent_id: updated.parent_id, level: updated.level, sort_order: updated.sort_order }
        : n
      )
      setFlat(newFlat)
      setTree(buildTree(newFlat))
      toast.success("Node berhasil dipindah")
    } catch (err: any) {
      toast.error(err?.detail ?? "Gagal memindah node")
      await load() // reload jika ada error untuk sinkron
    }
  }

  return (
    <OeeGuard section="master">
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Master Machine Losses</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={() => setAddingL1(true)} disabled={addingL1}>
              <Plus className="h-4 w-4 mr-2" /> Tambah Level 1
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {[
            { label: "L1", style: "bg-blue-100 text-blue-700 border-blue-200", desc: "Loss Category" },
            { label: "L2", style: "bg-violet-100 text-violet-700 border-violet-200", desc: "Sub Category" },
            { label: "L3", style: "bg-emerald-100 text-emerald-700 border-emerald-200", desc: "Detail Loss" },
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
              Struktur Machine Losses
              {!isLoading && <Badge variant="secondary">{countAll(tree)} item</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Add Level 1 inline */}
            {addingL1 && (
              <div className="flex items-center gap-2 mb-3 p-2.5 rounded-md bg-blue-50 border border-blue-200">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-blue-100 text-blue-700 border-blue-200 shrink-0">L1</span>
                <Input autoFocus placeholder="Nama Loss Category baru..."
                  value={newL1} onChange={e => setNewL1(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") saveL1(); if (e.key === "Escape") { setAddingL1(false); setNewL1("") } }}
                  className="h-8 text-sm flex-1" />
                <Button size="sm" onClick={saveL1} disabled={savingL1 || !newL1.trim()}>
                  {savingL1 ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setAddingL1(false); setNewL1("") }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
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
    </OeeGuard>
  )
}
