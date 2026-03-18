"use client"

/**
 * MachineLossTree — Fixed drag & drop untuk L3
 * ─────────────────────────────────────────────
 * L1 → tidak bisa drag (fixed)
 * L2 → tidak bisa drag, tapi SELALU tampil sebagai drop target saat drag aktif
 * L3 → bisa drag ke L2 mana saja (lintas L1)
 *
 * Fix utama:
 * 1. Gunakan closestCenter + custom collision agar deteksi drop lebih akurat
 * 2. Saat drag aktif, semua L2 di-expand + tampil highlight panel drop
 * 3. DragOver handler update overId realtime → visual feedback langsung
 * 4. L2 drop zone diperluas dengan padding agar mudah di-drop
 */

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  DragOverEvent, closestCenter, PointerSensor,
  useSensor, useSensors, UniqueIdentifier,
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
  node, isDragActive, isBeingDragged,
  onUpdate, onDelete,
}: {
  node: LossNode
  isDragActive: boolean
  isBeingDragged: boolean
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
      className={cn(
        "flex items-center gap-2 rounded-md py-1.5 pr-2 group transition-colors",
        isDragActive && !isDragging && "hover:bg-muted/20",
        !isDragActive && "hover:bg-muted/40",
        isBeingDragged && "bg-emerald-50 border border-dashed border-emerald-300",
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes} {...listeners}
        className="h-6 w-5 flex items-center justify-center text-muted-foreground/40 hover:text-emerald-500 cursor-grab active:cursor-grabbing shrink-0 transition-colors"
        title="Drag untuk pindah ke Sub Category lain"
      >
        <GripVertical className="h-4 w-4" />
      </button>

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

// ─── L2 droppable row ─────────────────────────────────────────────────────────
function L2Row({
  node, isDragActive, activeL3Node, overL2Id,
  forceOpen,
  onAddChild, onUpdate, onDelete,
}: {
  node: LossNode
  isDragActive: boolean
  activeL3Node: LossNode | null
  overL2Id: number | null
  forceOpen: boolean
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
  const { badge, indent } = LEVEL_STYLE[2]

  // L2 selalu droppable
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-l2-${node.id}`,
    data: { node },
  })

  const isSameParent = activeL3Node?.parent_id === node.id
  const isDropTarget = isDragActive && !isSameParent
  const isHovered    = overL2Id === node.id

  // Expand saat drag aktif agar children terlihat
  const effectiveOpen = forceOpen || open

  async function saveEdit() {
    if (!editVal.trim() || editVal === node.name) { setEditing(false); return }
    setBusy(true)
    await onUpdate(node.id, editVal.trim())
    setBusy(false); setEditing(false)
  }

  async function saveAdd() {
    if (!newName.trim()) return
    setBusy(true)
    await onAddChild(node.id, 3, newName.trim())
    setBusy(false); setNewName(""); setAdding(false); setOpen(true)
  }

  return (
    <>
      {/* Drop zone header — L2 row */}
      <div
        ref={setDropRef}
        style={{ paddingLeft: indent + 4 }}
        className={cn(
          "flex items-center gap-2 rounded-md py-1.5 pr-2 group transition-all",
          !isDragActive && "hover:bg-muted/40",
          // Drop target highlight
          isDropTarget && isHovered && "ring-2 ring-violet-400 bg-violet-50 shadow-sm",
          isDropTarget && !isHovered && !isSameParent && "ring-1 ring-violet-200 bg-violet-50/40",
          // Same parent dimmed
          isDragActive && isSameParent && "opacity-40",
        )}
      >
        {/* Non-draggable spacer */}
        <span className="h-6 w-5 shrink-0" />

        {/* Expand toggle */}
        <button
          className="h-5 w-5 flex items-center justify-center shrink-0 text-muted-foreground"
          onClick={() => setOpen(v => !v)}
          disabled={!hasChildren}
        >
          {hasChildren
            ? (effectiveOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />)
            : <span className="h-3.5 w-3.5" />}
        </button>

        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0", badge)}>
          L2
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
          <span className="flex-1 text-sm font-medium truncate min-w-0 flex items-center gap-2">
            {node.name}
            {/* Drop hint */}
            {isDropTarget && (
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded border transition-all font-semibold",
                isHovered
                  ? "bg-violet-100 text-violet-700 border-violet-400 animate-pulse"
                  : "bg-muted text-muted-foreground border-muted-foreground/20"
              )}>
                {isHovered ? "↓ lepas di sini" : "drop target"}
              </span>
            )}
          </span>
        )}

        {!editing && !isDragActive && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Button size="icon" variant="ghost" className="h-7 w-7"
              title="Add Level 3"
              onClick={() => { setAdding(true); setOpen(true) }} disabled={busy}>
              <Plus className="h-3.5 w-3.5 text-blue-600" />
            </Button>
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
          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0", LEVEL_STYLE[3].badge)}>
            L3
          </span>
          <Input autoFocus placeholder="New Level 3 name..."
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

      {/* Children — selalu tampil saat drag aktif */}
      {effectiveOpen && node.children.map(child => (
        <L3Row key={child.id} node={child}
          isDragActive={isDragActive}
          isBeingDragged={activeL3Node?.id === child.id}
          onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </>
  )
}

// ─── L1 row (non-draggable, bisa collapse) ────────────────────────────────────
function L1Row({
  node, isDragActive, activeL3Node, overL2Id,
  onAddChild, onUpdate, onDelete,
}: {
  node: LossNode
  isDragActive: boolean
  activeL3Node: LossNode | null
  overL2Id: number | null
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

  // Saat drag aktif, paksa expand semua L1 agar L2 terlihat
  const effectiveOpen = isDragActive || open

  async function saveEdit() {
    if (!editVal.trim() || editVal === node.name) { setEditing(false); return }
    setBusy(true)
    await onUpdate(node.id, editVal.trim())
    setBusy(false); setEditing(false)
  }

  async function saveAdd() {
    if (!newName.trim()) return
    setBusy(true)
    await onAddChild(node.id, 2, newName.trim())
    setBusy(false); setNewName(""); setAdding(false); setOpen(true)
  }

  return (
    <>
      <div
        style={{ paddingLeft: LEVEL_STYLE[1].indent + 4 }}
        className={cn(
          "flex items-center gap-2 rounded-md py-1.5 pr-2 group transition-colors",
          !isDragActive && "hover:bg-muted/40",
        )}
      >
        <span className="h-6 w-5 shrink-0" />

        <button
          className="h-5 w-5 flex items-center justify-center shrink-0 text-muted-foreground"
          onClick={() => setOpen(v => !v)}
          disabled={!hasChildren}
        >
          {hasChildren
            ? (effectiveOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />)
            : <span className="h-3.5 w-3.5" />}
        </button>

        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0", LEVEL_STYLE[1].badge)}>
          L1
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
          <span className="flex-1 text-sm font-semibold truncate min-w-0">{node.name}</span>
        )}

        {!editing && !isDragActive && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Button size="icon" variant="ghost" className="h-7 w-7"
              title="Add Level 2"
              onClick={() => { setAdding(true); setOpen(true) }} disabled={busy}>
              <Plus className="h-3.5 w-3.5 text-blue-600" />
            </Button>
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

      {/* Inline add L2 */}
      {adding && (
        <div className="flex items-center gap-2 py-1 pr-2" style={{ paddingLeft: LEVEL_STYLE[1].indent + 4 + 28 + 24 }}>
          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0", LEVEL_STYLE[2].badge)}>
            L2
          </span>
          <Input autoFocus placeholder="New Level 2 name..."
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

      {/* L2 children */}
      {effectiveOpen && node.children.map(child => (
        <L2Row key={child.id} node={child}
          isDragActive={isDragActive}
          activeL3Node={activeL3Node}
          overL2Id={overL2Id}
          forceOpen={isDragActive}
          onAddChild={onAddChild} onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </>
  )
}

// ─── Tree root ────────────────────────────────────────────────────────────────
export function MachineLossTree({ nodes, onAddChild, onUpdate, onDelete, onMove }: TreeProps) {
  const [activeL3, setActiveL3] = useState<LossNode | null>(null)
  const [overL2Id, setOverL2Id] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  // Gunakan ref agar handleDragEnd selalu punya data terbaru tanpa closure stale
  function flattenAll(ns: LossNode[]): LossNode[] {
    return ns.flatMap(n => [n, ...flattenAll(n.children)])
  }
  const allFlatRef = useRef<LossNode[]>([])
  allFlatRef.current = flattenAll(nodes)

  const activeL3Ref = useRef<LossNode | null>(null)
  activeL3Ref.current = activeL3

  const onMoveRef = useRef(onMove)
  useEffect(() => { onMoveRef.current = onMove }, [onMove])

  const handleDragStart = useCallback((e: DragStartEvent) => {
    const node = (e.active.data.current as any)?.node as LossNode | undefined
    if (node?.level === 3) setActiveL3(node)
  }, [])

  const handleDragOver = useCallback((e: DragOverEvent) => {
    if (!e.over) { setOverL2Id(null); return }
    const overId = String(e.over.id)
    if (overId.startsWith("drop-l2-")) {
      setOverL2Id(Number(overId.replace("drop-l2-", "")))
    } else {
      setOverL2Id(null)
    }
  }, [])

  // Stable callback — baca state via ref, bukan closure
  const handleDragEnd = useCallback(async (e: DragEndEvent) => {
    const dragged = activeL3Ref.current
    setActiveL3(null)
    setOverL2Id(null)

    if (!e.over || !dragged) return

    const overId = String(e.over.id)
    if (!overId.startsWith("drop-l2-")) return

    const targetL2Id = Number(overId.replace("drop-l2-", ""))
    if (!targetL2Id || targetL2Id === dragged.parent_id) return

    const targetL2 = allFlatRef.current.find(n => n.id === targetL2Id)
    if (!targetL2 || targetL2.level !== 2) return

    // sort_order = jumlah children L3 di target L2 (exclude node yang sedang dipindah)
    const sortOrder = targetL2.children.filter(c => c.id !== dragged.id).length

    await onMoveRef.current({
      id: dragged.id,
      new_parent_id: targetL2Id,
      new_level: 3,
      new_sort_order: sortOrder,
    })
  }, []) // deps kosong — semua data dibaca via ref

  if (nodes.length === 0) {
    return <p className="text-center py-10 text-sm text-muted-foreground">No data. Click &quot;Add Level 1&quot; to start.</p>
  }

  const isDragActive = activeL3 !== null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
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
            Dragging <strong>&quot;{activeL3!.name}&quot;</strong> — lepas di atas L2 Sub Category yang dituju (semua L2 sedang ter-expand)
          </span>
        ) : (
          <span>
            <span className="font-semibold text-emerald-700">L3 (Detail Loss)</span>
            {" "}bisa di-drag ke Sub Category (L2) mana saja, termasuk lintas L1.
          </span>
        )}
      </div>

      <div className={cn("space-y-0.5", isDragActive && "select-none")}>
        {nodes.map(node => (
          <L1Row key={node.id} node={node}
            isDragActive={isDragActive}
            activeL3Node={activeL3}
            overL2Id={overL2Id}
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
