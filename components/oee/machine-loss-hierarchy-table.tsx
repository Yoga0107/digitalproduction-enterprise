"use client"

/**
 * MachineLossHierarchyTable
 * ─────────────────────────
 * Tabel transaksional drag-and-drop untuk re-mapping hierarki machine loss.
 *
 * Node bersumber dari loss_level_1/2/3 (source_level/source_id).
 * Dalam hierarchy ini setiap node punya effective_level yang bisa berbeda
 * dari source_level-nya (hasil drag: promosi / demosi).
 *
 * Saat node dipindah, anak-anaknya yang kehilangan parent otomatis
 * masuk ke panel "Unparented" (is_unparented=true).
 */

import { useState, useCallback } from "react"
import {
  DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, useDroppable,
} from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ApiMachineLossHierarchy } from "@/types/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  GripVertical, AlertTriangle, ArrowUpCircle, ArrowDownCircle,
  Trash2, Loader2, ChevronRight,
} from "lucide-react"
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip"

// ─── Types ───────────────────────────────────────────────────────────────────
export type HierarchyMovePayload = {
  id: number
  new_parent_hierarchy_id: number | null
  new_effective_level: 1 | 2 | 3
  new_sort_order: number
}

type Props = {
  entries: ApiMachineLossHierarchy[]
  onMove: (payload: HierarchyMovePayload) => Promise<void>
  onDelete: (id: number) => Promise<void>
  isBusy?: boolean
}

// ─── Level config ────────────────────────────────────────────────────────────
const LEVEL_CFG = {
  1: { label: "L1 — Loss Category",  badge: "bg-blue-100 text-blue-700 border-blue-200",     col: "border-blue-200 bg-blue-50/40",     header: "bg-blue-100 text-blue-800",     drop: "ring-blue-400"   },
  2: { label: "L2 — Sub Category",   badge: "bg-violet-100 text-violet-700 border-violet-200", col: "border-violet-200 bg-violet-50/40", header: "bg-violet-100 text-violet-800", drop: "ring-violet-400" },
  3: { label: "L3 — Detail Loss",    badge: "bg-emerald-100 text-emerald-700 border-emerald-200", col: "border-emerald-200 bg-emerald-50/40", header: "bg-emerald-100 text-emerald-800", drop: "ring-emerald-400" },
} as const

// ─── Drag ghost ───────────────────────────────────────────────────────────────
function DragGhost({ entry }: { entry: ApiMachineLossHierarchy }) {
  const cfg = LEVEL_CFG[entry.effective_level]
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-white shadow-xl px-3 py-2 text-sm font-medium w-64">
      <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0", cfg.badge)}>L{entry.effective_level}</span>
      <span className="truncate flex-1">{entry.source_name}</span>
    </div>
  )
}

// ─── Single sortable row ──────────────────────────────────────────────────────
function HierarchyRow({ entry, onDelete, isBusy }: { entry: ApiMachineLossHierarchy; onDelete: (id: number) => void; isBusy: boolean }) {
  const cfg = LEVEL_CFG[entry.effective_level]
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `entry-${entry.id}`,
    data: { type: "hierarchy-entry", entry },
  })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0 : 1 }

  return (
    <div ref={setNodeRef} style={style}
      className={cn("group flex items-center gap-2 rounded-md border bg-white px-2 py-1.5 text-sm shadow-sm hover:shadow-md transition-all", isDragging && "invisible")}>
      <button {...attributes} {...listeners} className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing" title="Drag untuk memindah level">
        <GripVertical className="h-4 w-4" />
      </button>
      <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0", cfg.badge)}>L{entry.effective_level}</span>
      <div className="flex-1 min-w-0">
        <span className="font-medium truncate block">{entry.source_name}</span>
        {entry.parent_name && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 truncate">
            <ChevronRight className="h-2.5 w-2.5 shrink-0" />{entry.parent_name}
          </span>
        )}
      </div>
      {entry.source_level !== entry.effective_level && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-[9px] font-bold px-1 py-0.5 rounded border bg-amber-50 text-amber-600 border-amber-200 shrink-0">
                orig L{entry.source_level}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">Level asli di master: L{entry.source_level}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      <Button size="icon" variant="ghost"
        className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive transition-opacity"
        onClick={() => onDelete(entry.id)} disabled={isBusy}>
        {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
      </Button>
    </div>
  )
}

// ─── Unparented row ───────────────────────────────────────────────────────────
function UnparentedRow({ entry, onDelete, isBusy }: { entry: ApiMachineLossHierarchy; onDelete: (id: number) => void; isBusy: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `entry-${entry.id}`,
    data: { type: "hierarchy-entry", entry },
  })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0 : 1 }

  return (
    <div ref={setNodeRef} style={style}
      className={cn("group flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-sm", isDragging && "invisible")}>
      <button {...attributes} {...listeners} className="shrink-0 text-amber-400 hover:text-amber-600 cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4" />
      </button>
      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
      <span className="font-medium truncate flex-1 text-amber-800">{entry.source_name}</span>
      <span className="text-[9px] px-1 py-0.5 rounded border bg-amber-100 text-amber-600 border-amber-200 shrink-0">orig L{entry.source_level}</span>
      <Button size="icon" variant="ghost"
        className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
        onClick={() => onDelete(entry.id)} disabled={isBusy}>
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  )
}

// ─── Droppable column ─────────────────────────────────────────────────────────
function LevelColumn({ level, entries, onDelete, isBusy, isOver }: {
  level: 1 | 2 | 3; entries: ApiMachineLossHierarchy[]; onDelete: (id: number) => void; isBusy: boolean; isOver: boolean
}) {
  const cfg = LEVEL_CFG[level]
  const { setNodeRef } = useDroppable({ id: `col-${level}` })
  return (
    <div className={cn("flex flex-col rounded-lg border-2 overflow-hidden transition-all", cfg.col, isOver && `ring-2 ${cfg.drop}`)}>
      <div className={cn("px-3 py-2 flex items-center justify-between", cfg.header)}>
        <span className="text-xs font-bold">{cfg.label}</span>
        <Badge variant="secondary" className="text-[10px] h-5">{entries.length}</Badge>
      </div>
      <div ref={setNodeRef} className="flex-1 p-2 space-y-1.5 min-h-[120px]">
        <SortableContext items={entries.map(e => `entry-${e.id}`)} strategy={verticalListSortingStrategy}>
          {entries.length === 0
            ? <div className="flex items-center justify-center h-20 text-xs text-muted-foreground border-2 border-dashed rounded-md">Drop di sini</div>
            : entries.map(e => <HierarchyRow key={e.id} entry={e} onDelete={onDelete} isBusy={isBusy} />)
          }
        </SortableContext>
      </div>
    </div>
  )
}

// ─── Unparented panel ─────────────────────────────────────────────────────────
function UnparentedPanel({ entries, onDelete, isBusy, isOver }: {
  entries: ApiMachineLossHierarchy[]; onDelete: (id: number) => void; isBusy: boolean; isOver: boolean
}) {
  const { setNodeRef } = useDroppable({ id: "col-unparented" })
  if (entries.length === 0 && !isOver) return null
  return (
    <div className={cn("rounded-lg border-2 border-amber-200 overflow-hidden transition-all", isOver && "ring-2 ring-amber-400")}>
      <div className="px-3 py-2 flex items-center justify-between bg-amber-100">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
          <span className="text-xs font-bold text-amber-800">Unparented</span>
          <span className="text-[10px] text-amber-600">— parent telah dipindah / di-remap</span>
        </div>
        <Badge variant="secondary" className="text-[10px] h-5 bg-amber-200 text-amber-700">{entries.length}</Badge>
      </div>
      <div ref={setNodeRef} className="p-2 space-y-1.5 min-h-[60px] bg-amber-50/40">
        <SortableContext items={entries.map(e => `entry-${e.id}`)} strategy={verticalListSortingStrategy}>
          {entries.length === 0
            ? <div className="flex items-center justify-center h-12 text-xs text-amber-500 border-2 border-dashed border-amber-200 rounded-md">Drop di sini untuk unparent</div>
            : entries.map(e => <UnparentedRow key={e.id} entry={e} onDelete={onDelete} isBusy={isBusy} />)
          }
        </SortableContext>
      </div>
    </div>
  )
}

// ─── Instruction bar ──────────────────────────────────────────────────────────
function InstructionBar() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 border">
      <div className="flex items-center gap-1.5"><ArrowUpCircle className="h-3.5 w-3.5 text-violet-500" /><span>Drag L3 → kolom L2 untuk <strong>promosi</strong></span></div>
      <div className="flex items-center gap-1.5"><ArrowDownCircle className="h-3.5 w-3.5 text-emerald-500" /><span>Drag L2 → kolom L3 untuk <strong>demosi</strong></span></div>
      <div className="flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5 text-amber-500" /><span>Children yang kehilangan parent → <strong>Unparented</strong></span></div>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export function MachineLossHierarchyTable({ entries, onMove, onDelete, isBusy = false }: Props) {
  const [activeEntry, setActiveEntry] = useState<ApiMachineLossHierarchy | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const byLevel = {
    1: entries.filter(e => !e.is_unparented && e.effective_level === 1),
    2: entries.filter(e => !e.is_unparented && e.effective_level === 2),
    3: entries.filter(e => !e.is_unparented && e.effective_level === 3),
  }
  const unparented = entries.filter(e => e.is_unparented)

  function parseDropCol(id: string): 1 | 2 | 3 | "unparented" | null {
    if (id === "col-1") return 1
    if (id === "col-2") return 2
    if (id === "col-3") return 3
    if (id === "col-unparented") return "unparented"
    const entryId = Number(id.replace("entry-", ""))
    const t = entries.find(e => e.id === entryId)
    if (!t) return null
    if (t.is_unparented) return "unparented"
    return t.effective_level
  }

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setActiveEntry((e.active.data.current as any)?.entry ?? null)
  }, [])

  const handleDragOver = useCallback((e: DragOverEvent) => {
    setOverId(e.over ? String(e.over.id) : null)
  }, [])

  const handleDragEnd = useCallback(async (e: DragEndEvent) => {
    setActiveEntry(null); setOverId(null)
    const { active, over } = e
    if (!over || active.id === over.id) return
    const dragged = (active.data.current as any)?.entry as ApiMachineLossHierarchy | undefined
    if (!dragged) return
    const col = parseDropCol(String(over.id))
    if (!col) return

    if (col === "unparented") {
      await onMove({ id: dragged.id, new_parent_hierarchy_id: null, new_effective_level: dragged.source_level as 1|2|3, new_sort_order: unparented.length })
      return
    }

    const newLevel = col
    if (newLevel === dragged.effective_level && !dragged.is_unparented) return

    // Find last entry in target col as the parent hint for L2/L3
    // For L1 → no parent. For L2 → last L1 entry id. For L3 → last L2 entry id.
    let newParentId: number | null = null
    if (newLevel === 2 && byLevel[1].length > 0) {
      newParentId = byLevel[1][byLevel[1].length - 1].id
    } else if (newLevel === 3 && byLevel[2].length > 0) {
      newParentId = byLevel[2][byLevel[2].length - 1].id
    }

    await onMove({
      id: dragged.id,
      new_parent_hierarchy_id: newParentId,
      new_effective_level: newLevel,
      new_sort_order: byLevel[newLevel].length,
    })
  }, [entries, byLevel, unparented, onMove])

  const hoveredCol = overId ? parseDropCol(overId) : null

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
        <p className="text-sm">Belum ada data hierarchy.</p>
        <p className="text-xs">Klik <strong>Sync dari Master</strong> untuk mengisi dari loss_level_1/2/3.</p>
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="space-y-4">
        <InstructionBar />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {([1, 2, 3] as const).map(level => (
            <LevelColumn key={level} level={level} entries={byLevel[level]}
              onDelete={onDelete} isBusy={isBusy} isOver={hoveredCol === level} />
          ))}
        </div>
        <UnparentedPanel entries={unparented} onDelete={onDelete} isBusy={isBusy} isOver={hoveredCol === "unparented"} />
      </div>
      <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
        {activeEntry && <DragGhost entry={activeEntry} />}
      </DragOverlay>
    </DndContext>
  )
}
