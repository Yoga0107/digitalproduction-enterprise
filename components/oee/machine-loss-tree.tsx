"use client"

import { useState } from "react"
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  closestCenter, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core"
import {
  SortableContext, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { GripVertical, Plus, Pencil, Trash2, Check, X, Loader2, ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ─────────────────────────────────────────────────────────────────
export type LossNode = {
  id: number
  parent_id: number | null
  level: 1 | 2 | 3
  name: string
  sort_order: number
  children: LossNode[]
}

export type MovePayload = {
  id: number
  new_parent_id: number | null
  new_level: 1 | 2 | 3
  new_sort_order: number
}

type TreeProps = {
  nodes: LossNode[]
  onAddChild: (parentId: number, level: 2 | 3, name: string) => Promise<void>
  onUpdate:   (id: number, name: string) => Promise<void>
  onDelete:   (id: number, hasChildren: boolean) => Promise<void>
  onMove:     (payload: MovePayload) => Promise<void>
}

// ─── Level config ───────────────────────────────────────────────────────────
const LEVEL_STYLE: Record<number, { badge: string; indent: number }> = {
  1: { badge: "bg-blue-100 text-blue-700 border-blue-200",     indent: 0  },
  2: { badge: "bg-violet-100 text-violet-700 border-violet-200", indent: 24 },
  3: { badge: "bg-emerald-100 text-emerald-700 border-emerald-200", indent: 48 },
}

// ─── Single draggable node row ──────────────────────────────────────────────
function NodeRow({
  node, onAddChild, onUpdate, onDelete, onMove, allNodes,
}: {
  node: LossNode
  allNodes: LossNode[]
  onAddChild: TreeProps["onAddChild"]
  onUpdate:   TreeProps["onUpdate"]
  onDelete:   TreeProps["onDelete"]
  onMove:     TreeProps["onMove"]
}) {
  const [open, setOpen]       = useState(true)
  const [editing, setEditing] = useState(false)
  const [editVal, setEditVal] = useState(node.name)
  const [adding, setAdding]   = useState(false)
  const [newName, setNewName] = useState("")
  const [busy, setBusy]       = useState(false)

  const hasChildren = node.children.length > 0
  const { badge, indent } = LEVEL_STYLE[node.level]

  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: node.id, data: { node } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  async function saveEdit() {
    if (!editVal.trim() || editVal === node.name) { setEditing(false); return }
    setBusy(true)
    await onUpdate(node.id, editVal.trim())
    setBusy(false)
    setEditing(false)
  }

  async function saveAdd() {
    if (!newName.trim()) return
    setBusy(true)
    await onAddChild(node.id, (node.level + 1) as 2 | 3, newName.trim())
    setBusy(false)
    setNewName("")
    setAdding(false)
    setOpen(true)
  }

  async function handleDelete() {
    setBusy(true)
    await onDelete(node.id, hasChildren)
    setBusy(false)
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={{ ...style, paddingLeft: indent + 4 }}
        className={cn(
          "flex items-center gap-2 rounded-md py-1.5 pr-2 group hover:bg-muted/40 transition-colors",
          isDragging && "ring-2 ring-blue-400 bg-blue-50"
        )}
      >
        {/* Drag handle */}
        <button
          {...attributes} {...listeners}
          className="h-6 w-5 flex items-center justify-center text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing shrink-0"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Expand */}
        <button className="h-5 w-5 flex items-center justify-center shrink-0 text-muted-foreground"
          onClick={() => setOpen(v => !v)} disabled={!hasChildren}>
          {hasChildren
            ? (open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />)
            : <span className="h-3.5 w-3.5" />}
        </button>

        {/* Level badge */}
        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0", badge)}>
          L{node.level}
        </span>

        {/* Name / inline edit */}
        {editing ? (
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <Input autoFocus value={editVal}
              onChange={e => setEditVal(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditing(false) }}
              className="h-7 text-sm flex-1" />
            <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={saveEdit} disabled={busy}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 text-green-600" />}
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setEditing(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <span className="flex-1 text-sm font-medium truncate min-w-0">{node.name}</span>
        )}

        {/* Action buttons */}
        {!editing && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            {node.level < 3 && (
              <Button size="icon" variant="ghost" className="h-7 w-7"
                title={`Tambah Level ${node.level + 1}`}
                onClick={() => { setAdding(true); setOpen(true) }} disabled={busy}>
                <Plus className="h-3.5 w-3.5 text-blue-600" />
              </Button>
            )}
            <Button size="icon" variant="ghost" className="h-7 w-7"
              onClick={() => { setEditVal(node.name); setEditing(true) }} disabled={busy}>
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
            <Button size="icon" variant="ghost"
              className={cn("h-7 w-7", hasChildren ? "opacity-30 cursor-not-allowed" : "text-destructive hover:text-destructive")}
              title={hasChildren ? "Hapus child terlebih dahulu" : "Hapus"}
              onClick={hasChildren ? undefined : handleDelete} disabled={busy || hasChildren}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </Button>
          </div>
        )}
      </div>

      {/* Inline add input */}
      {adding && (
        <div className="flex items-center gap-2 py-1 pr-2" style={{ paddingLeft: indent + 4 + 28 + 24 }}>
          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0", LEVEL_STYLE[(node.level + 1) as 1|2|3]?.badge)}>
            L{node.level + 1}
          </span>
          <Input autoFocus placeholder={`Nama Level ${node.level + 1} baru...`}
            value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") saveAdd(); if (e.key === "Escape") { setAdding(false); setNewName("") } }}
            className="h-7 text-sm flex-1" />
          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={saveAdd} disabled={busy || !newName.trim()}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 text-green-600" />}
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => { setAdding(false); setNewName("") }}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Children */}
      {open && node.children.map(child => (
        <NodeRow key={child.id} node={child} allNodes={allNodes}
          onAddChild={onAddChild} onUpdate={onUpdate} onDelete={onDelete} onMove={onMove} />
      ))}
    </>
  )
}

// ─── Tree root with DnD ────────────────────────────────────────────────────
export function MachineLossTree({ nodes, onAddChild, onUpdate, onDelete, onMove }: TreeProps) {
  const [activeId, setActiveId] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  // Flatten all nodes for sortable ids
  function flatIds(ns: LossNode[]): number[] {
    return ns.flatMap(n => [n.id, ...flatIds(n.children)])
  }

  function findNode(id: number, ns: LossNode[]): LossNode | null {
    for (const n of ns) {
      if (n.id === id) return n
      const found = findNode(id, n.children)
      if (found) return found
    }
    return null
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    if (!over || active.id === over.id) return

    const draggedNode = findNode(Number(active.id), nodes)
    const targetNode  = findNode(Number(over.id), nodes)
    if (!draggedNode || !targetNode) return

    // Same level reorder: move under same parent
    if (draggedNode.parent_id === targetNode.parent_id) {
      await onMove({
        id: draggedNode.id,
        new_parent_id: targetNode.parent_id,
        new_level: draggedNode.level,
        new_sort_order: targetNode.sort_order,
      })
      return
    }

    // Cross-level: move dragged node as child of target (if target.level < 3)
    if (targetNode.level < 3) {
      await onMove({
        id: draggedNode.id,
        new_parent_id: targetNode.id,
        new_level: (targetNode.level + 1) as 1 | 2 | 3,
        new_sort_order: targetNode.children.length,
      })
    }
  }

  const activeNode = activeId ? findNode(activeId, nodes) : null

  if (nodes.length === 0) {
    return <p className="text-center py-10 text-sm text-muted-foreground">Belum ada data. Klik "Tambah Level 1" untuk mulai.</p>
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter}
      onDragStart={(e: DragStartEvent) => setActiveId(Number(e.active.id))}
      onDragEnd={handleDragEnd}>
      <SortableContext items={flatIds(nodes)} strategy={verticalListSortingStrategy}>
        <div className="space-y-0.5">
          {nodes.map(node => (
            <NodeRow key={node.id} node={node} allNodes={nodes}
              onAddChild={onAddChild} onUpdate={onUpdate} onDelete={onDelete} onMove={onMove} />
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeNode && (
          <div className="flex items-center gap-2 rounded-md px-3 py-2 bg-white shadow-lg border text-sm font-medium">
            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border", LEVEL_STYLE[activeNode.level]?.badge)}>L{activeNode.level}</span>
            {activeNode.name}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
