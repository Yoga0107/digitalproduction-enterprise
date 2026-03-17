"use client"

import { useState, useEffect, useCallback } from "react"
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
    } catch {
      toast.error("Failed to load machine losses")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function findFlat(id: number) {
    return flat.find(n => n.id === id)
  }

  async function saveL1() {
    if (!newL1.trim()) return
    setSavingL1(true)
    try {
      await createLossLevel1({ name: newL1.trim(), sort_order: flat.filter(n => n.level === 1).length })
      await load()
      setNewL1(""); setAddingL1(false)
      toast.success("Level 1 added successfully")
    } catch {
      toast.error("Failed to add Level 1")
    } finally {
      setSavingL1(false)
    }
  }

  async function handleAddChild(parentId: number, level: 2 | 3, name: string) {
    try {
      const sortOrder = flat.filter(n => n.parent_id === parentId).length
      if (level === 2) {
        await createLossLevel2({ level_1_id: parentId, name, sort_order: sortOrder })
      } else {
        await createLossLevel3({ level_2_id: parentId, name, sort_order: sortOrder })
      }
      await load()
      toast.success(`Level ${level} added successfully`)
    } catch (err: any) {
      toast.error(err?.detail ?? `Failed to add Level ${level}`)
    }
  }

  async function handleUpdate(id: number, name: string) {
    const node = findFlat(id)
    if (!node) return
    try {
      if (node.level === 1)      await updateLossLevel1(id, { name })
      else if (node.level === 2) await updateLossLevel2(id, { name })
      else                       await updateLossLevel3(id, { name })
      await load()
      toast.success("Name updated successfully")
    } catch {
      toast.error("Failed to update name")
    }
  }

  async function handleDelete(id: number, hasChildren: boolean) {
    if (hasChildren) { toast.error("Remove child items first"); return }
    const node = findFlat(id)
    if (!node) return
    try {
      if (node.level === 1)      await deleteLossLevel1(id)
      else if (node.level === 2) await deleteLossLevel2(id)
      else                       await deleteLossLevel3(id)
      await load()
      toast.success("Item deleted")
    } catch (err: any) {
      toast.error(err?.detail ?? "Failed to delete item")
    }
  }

  async function handleMove(payload: MovePayload) {
    const node = findFlat(payload.id)
    if (!node) return
    try {
      if (node.level === payload.new_level) {
        // Reorder within the same level
        if (node.level === 1)      await updateLossLevel1(payload.id, { sort_order: payload.new_sort_order })
        else if (node.level === 2) await updateLossLevel2(payload.id, { sort_order: payload.new_sort_order })
        else                       await updateLossLevel3(payload.id, { sort_order: payload.new_sort_order })
        await load()
        toast.success("Order updated")
      } else {
        // Cross-level move (promote / demote)
        await moveMachineLoss(payload.id, {
          new_parent_id:  payload.new_parent_id,
          new_level:      payload.new_level,
          new_sort_order: payload.new_sort_order,
        })
        await load()
        toast.success(
          payload.new_level < node.level
            ? `Promoted to Level ${payload.new_level}`
            : `Demoted to Level ${payload.new_level}`
        )
      }
    } catch (err: any) {
      toast.error(err?.detail ?? "Failed to move node")
      await load()
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
              <p className="text-white/70 text-sm mt-1">Kategori kerugian mesin</p>
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
            <Button variant="outline" size="sm" onClick={load} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setAddingL1(true)} disabled={addingL1}>
              <Plus className="h-4 w-4 mr-2" /> Add Level 1
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-600">
          {[
            { label: "L1", style: "bg-emerald-100 text-emerald-700 border-emerald-200",          desc: "Loss Category"  },
            { label: "L2", style: "bg-violet-100 text-violet-700 border-violet-200",    desc: "Sub Category"   },
            { label: "L3", style: "bg-emerald-100 text-emerald-700 border-emerald-200", desc: "Detail Loss"    },
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
              {!isLoading && <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">{countAll(tree)} items</Badge>}
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