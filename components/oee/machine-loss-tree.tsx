"use client"

/**
 * MachineLossTree
 * ───────────────
 * L1 → not draggable (fixed)
 * L2 → not draggable, but IS a drop target for L3 nodes
 * L3 → draggable, can be dropped onto any L2 to change parent
 */

import { useState, useCallback } from "react"
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  DragOverEvent, rectIntersection, PointerSensor,
  useSensor, useSensors,
} from "@dnd-kit/core"
import { useDraggable, useDroppable } from "@dnd-kit/core"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  GripVertical, Plus, Pencil, Trash2, Check, X,
  Loader2, ChevronDown, ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ──────────────────────────────────────────────────────────────────
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

const LEVEL_STYLE: Record<number, { badge: string; indent: number }> = {
  1: { badge: "bg-blue-100 text-blue-700 border-blue-200",          indent: 0  },
  2: { badge: "bg-violet-100 text-violet-700 border-violet-200",    indent: 24 },
  3: { badge: "bg-emerald-100 text-emerald-700 border-emerald-200", indent: 48 },
}

// ─── L3 draggable row ─────────────────────────────────────────────────────────
function L3Row({
  node, isDragActive,
  onUpdate, onDelete,
}: {
  node: LossNode
  isDragActive: boolean
  onUpdate: TreeProps["onUpdate"]
  onDelete: TreeProps["onDelete"]
}) {
  const [editing, setEditing] = useState(false)
  const [editVal, setEditVal] = useState(node.name)
  const [busy, setBusy]       = useState(false)

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `l3-${node.id}`,
    data: { node },
  })

  async function saveEdit() {
    if (!editVal.trim() || editVal === node.name) { setEditing(false); return }
    setBusy(true)
    await onUpdate(node.id, editVal.trim())
    setBusy(false); setEditing(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={{ paddingLeft: LEVEL_STYLE[3].indent + 4, opacity: isDragging ? 0.3 : 1 }}
      className="flex items-center gap-2 rounded-md py-1.5 pr-2 group hover:bg-muted/40 transition-colors"
    >
      {/* Drag handle */}
      <button
        {...attributes} {...listeners}
        className="h-6 w-5 flex items-center justify-center text-muted-foreground/40 hover:text-emerald-500 cursor-grab active:cursor-grabbing shrink-0 transition-colors"
        title="Drag to move under a different Sub Category"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Spacer for expand toggle alignment */}
      <span className="h-5 w-5 shrink-0" />

      <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0", LEVEL_STYLE[3].badge)}>
        L3
      </span>

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

      {!editing && !isDragActive && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button size="icon" variant="ghost" className="h-7 w-7"
            onClick={() => { setEditVal(node.name); setEditing(true) }} disabled={busy}>
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={async () => { setBusy(true); await onDelete(node.id, false); setBusy(false) }} disabled={busy}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── L1/L2 non-draggable row (with drop zone for L2) ─────────────────────────
function L12Row({
  node, isDragActive, activeL3Node,
  onAddChild, onUpdate, onDelete,
}: {
  node: LossNode
  isDragActive: boolean
  activeL3Node: LossNode | null
  onAddChild: TreeProps["onAddChild"]
  onUpdate:   TreeProps["onUpdate"]
  onDelete:   TreeProps["onDelete"]
}) {
  const [open, setOpen]       = useState(true)
  const [editing, setEditing] = useState(false)
  const [editVal, setEditVal] = useState(node.name)
  const [adding, setAdding]   = useState(false)
  const [newName, setNewName] = useState("")
  const [busy, setBusy]       = useState(false)

  const hasChildren = node.children.length > 0
  const { badge, indent } = LEVEL_STYLE[node.level]

  // L2 nodes are droppable targets
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-l2-${node.id}`,
    data: { node },
    disabled: node.level !== 2,
  })

  // Is the dragged L3 already under this L2?
  const isSameParent = activeL3Node?.parent_id === node.id

  const isDropHighlighted = node.level === 2 && isDragActive && isOver && !isSameParent

  async function saveEdit() {
    if (!editVal.trim() || editVal === node.name) { setEditing(false); return }
    setBusy(true)
    await onUpdate(node.id, editVal.trim())
    setBusy(false); setEditing(false)
  }

  async function saveAdd() {
    if (!newName.trim()) return
    setBusy(true)
    await onAddChild(node.id, (node.level + 1) as 2 | 3, newName.trim())
    setBusy(false); setNewName(""); setAdding(false); setOpen(true)
  }

  return (
    <>
      <div
        ref={node.level === 2 ? setDropRef : undefined}
        style={{ paddingLeft: indent + 4 }}
        className={cn(
          "flex items-center gap-2 rounded-md py-1.5 pr-2 group transition-all",
          !isDragActive && "hover:bg-muted/40",
          isDropHighlighted && "ring-2 ring-violet-400 bg-violet-50",
          // Dim L2 that is already parent of dragged node
          node.level === 2 && isDragActive && isSameParent && "opacity-40",
        )}
      >
        {/* Non-draggable spacer where grip would be */}
        <span className="h-6 w-5 shrink-0" />

        {/* Expand toggle */}
        <button
          className="h-5 w-5 flex items-center justify-center shrink-0 text-muted-foreground"
          onClick={() => setOpen(v => !v)}
          disabled={!hasChildren}
        >
          {hasChildren
            ? (open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />)
            : <span className="h-3.5 w-3.5" />}
        </button>

        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0", badge)}>
          L{node.level}
        </span>

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
          <span className="flex-1 text-sm font-medium truncate min-w-0">
            {node.name}
            {/* Drop hint label */}
            {node.level === 2 && isDragActive && !isSameParent && (
              <span className={cn(
                "ml-2 text-[10px] px-1.5 py-0.5 rounded border transition-all",
                isOver
                  ? "bg-violet-100 text-violet-700 border-violet-400 font-bold"
                  : "bg-muted text-muted-foreground border-muted-foreground/20"
              )}>
                {isOver ? "↓ drop here" : "drop target"}
              </span>
            )}
          </span>
        )}

        {!editing && !isDragActive && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            {node.level < 3 && (
              <Button size="icon" variant="ghost" className="h-7 w-7"
                title={`Add Level ${node.level + 1}`}
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
              onClick={hasChildren ? undefined : async () => { setBusy(true); await onDelete(node.id, hasChildren); setBusy(false) }}
              disabled={busy || hasChildren}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </Button>
          </div>
        )}
      </div>

      {/* Inline add */}
      {adding && (
        <div className="flex items-center gap-2 py-1 pr-2" style={{ paddingLeft: indent + 4 + 28 + 24 }}>
          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0",
            LEVEL_STYLE[(node.level + 1) as 1|2|3]?.badge)}>
            L{node.level + 1}
          </span>
          <Input autoFocus placeholder={`New Level ${node.level + 1} name...`}
            value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") saveAdd()
              if (e.key === "Escape") { setAdding(false); setNewName("") }
            }}
            className="h-7 text-sm flex-1" />
          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0"
            onClick={saveAdd} disabled={busy || !newName.trim()}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 text-green-600" />}
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0"
            onClick={() => { setAdding(false); setNewName("") }}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Children */}
      {open && node.children.map(child => (
        child.level === 3
          ? <L3Row key={child.id} node={child} isDragActive={isDragActive}
              onUpdate={onUpdate} onDelete={onDelete} />
          : <L12Row key={child.id} node={child} isDragActive={isDragActive}
              activeL3Node={activeL3Node}
              onAddChild={onAddChild} onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </>
  )
}

// ─── Tree root ────────────────────────────────────────────────────────────────
export function MachineLossTree({ nodes, onAddChild, onUpdate, onDelete, onMove }: TreeProps) {
  const [activeL3, setActiveL3] = useState<LossNode | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function flattenAll(ns: LossNode[]): LossNode[] {
    return ns.flatMap(n => [n, ...flattenAll(n.children)])
  }
  const allFlat = flattenAll(nodes)

  const handleDragStart = useCallback((e: DragStartEvent) => {
    const node = (e.active.data.current as any)?.node as LossNode | undefined
    if (node?.level === 3) setActiveL3(node)
  }, [])

  const handleDragEnd = useCallback(async (e: DragEndEvent) => {
    const dragged = activeL3
    setActiveL3(null)

    if (!e.over || !dragged) return

    // over.id format: "drop-l2-{nodeId}"
    const overId = String(e.over.id)
    if (!overId.startsWith("drop-l2-")) return

    const targetL2Id = Number(overId.replace("drop-l2-", ""))
    if (!targetL2Id || targetL2Id === dragged.parent_id) return

    const targetL2 = allFlat.find(n => n.id === targetL2Id)
    if (!targetL2 || targetL2.level !== 2) return

    const sortOrder = targetL2.children.filter(c => c.id !== dragged.id).length

    await onMove({
      id: dragged.id,
      new_parent_id: targetL2Id,
      new_level: 3,
      new_sort_order: sortOrder,
    })
  }, [activeL3, allFlat, onMove])

  if (nodes.length === 0) {
    return <p className="text-center py-10 text-sm text-muted-foreground">No data. Click &quot;Add Level 1&quot; to start.</p>
  }

  const isDragActive = activeL3 !== null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Hint bar */}
      <div className={cn(
        "flex items-center gap-2 text-[11px] mb-3 px-2 py-1.5 rounded-lg border transition-all",
        isDragActive
          ? "bg-violet-50 border-violet-300 text-violet-700"
          : "bg-emerald-50 border-emerald-200 text-muted-foreground"
      )}>
        <GripVertical className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
        {isDragActive ? (
          <span className="font-medium">
            Dragging <strong>&quot;{activeL3!.name}&quot;</strong> — drop onto an L2 Sub Category to move it there
          </span>
        ) : (
          <span>
            <span className="font-semibold text-emerald-700">L3 (Detail Loss)</span>
            {" "}can be dragged to a different Sub Category (L2). L1 and L2 are fixed.
          </span>
        )}
      </div>

      <div className={cn("space-y-0.5", isDragActive && "select-none")}>
        {nodes.map(node => (
          <L12Row key={node.id} node={node}
            isDragActive={isDragActive}
            activeL3Node={activeL3}
            onAddChild={onAddChild} onUpdate={onUpdate} onDelete={onDelete} />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
        {activeL3 && (
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 shadow-2xl border-2 border-emerald-400 bg-white text-sm font-medium">
            <GripVertical className="h-4 w-4 text-muted-foreground/60 shrink-0" />
            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0", LEVEL_STYLE[3].badge)}>L3</span>
            <span className="truncate max-w-48">{activeL3.name}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}