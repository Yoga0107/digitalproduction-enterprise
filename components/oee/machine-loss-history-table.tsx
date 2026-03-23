'use client'

import { useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Pencil, Trash2, Eye } from 'lucide-react'
import { ApiMachineLossInput } from '@/types/api'
import { fmtDate, fmtHours } from '@/lib/machine-loss-utils'
import { cn } from '@/lib/utils'

type Props = {
  rows:      ApiMachineLossInput[]
  isLoading: boolean
  onEdit:    (row: ApiMachineLossInput) => void
  onDelete:  (id: number) => void
  onView?:   (row: ApiMachineLossInput) => void
}

export function MachineLossHistoryTable({ rows, isLoading, onEdit, onDelete, onView }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // ── Drag-to-scroll ──────────────────────────────────────────────────────
  const drag = useRef({ active: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 })

  function onMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    const el = scrollRef.current
    if (!el) return
    drag.current = { active: true, startX: e.pageX - el.offsetLeft, startY: e.pageY - el.offsetTop, scrollLeft: el.scrollLeft, scrollTop: el.scrollTop }
    el.style.cursor = 'grabbing'
    el.style.userSelect = 'none'
  }

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!drag.current.active) return
    const el = scrollRef.current
    if (!el) return
    e.preventDefault()
    const dx = (e.pageX - el.offsetLeft) - drag.current.startX
    const dy = (e.pageY - el.offsetTop)  - drag.current.startY
    el.scrollLeft = drag.current.scrollLeft - dx
    el.scrollTop  = drag.current.scrollTop  - dy
  }

  function onMouseUpLeave() {
    drag.current.active = false
    const el = scrollRef.current
    if (el) { el.style.cursor = 'grab'; el.style.userSelect = '' }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          Riwayat Machine Loss
          {!isLoading && (
            <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-100">
              {rows.length} record
            </Badge>
          )}
          {rows.length > 0 && (
            <span className="ml-auto text-xs text-muted-foreground font-normal">
              Geser tabel untuk melihat semua kolom
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground px-6">
            Belum ada data. Klik <strong>Tambah Data</strong> untuk mulai.
          </div>
        ) : (
          /* Scrollable drag container */
          <div
            ref={scrollRef}
            className="overflow-auto max-h-[480px] cursor-grab select-none rounded-b-xl"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUpLeave}
            onMouseLeave={onMouseUpLeave}
          >
            <table className="w-full text-sm border-collapse min-w-[960px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 border-b border-slate-200">
                  {/* Sticky first col */}
                  <th className="sticky left-0 z-20 bg-slate-50 text-left px-4 py-3 text-xs font-semibold text-slate-600 whitespace-nowrap border-r border-slate-200 min-w-[120px]">
                    Tanggal
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 whitespace-nowrap min-w-[110px]">Line</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 whitespace-nowrap min-w-[100px]">Shift</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 whitespace-nowrap min-w-[110px]">Kode Pakan</th>
                  {/* Loss level columns */}
                  <th className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap min-w-[150px]">
                    <span className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">L1</span>
                      Kategori Utama
                    </span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap min-w-[150px]">
                    <span className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 text-[10px] font-bold">L2</span>
                      Sub-Kategori
                    </span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap min-w-[150px]">
                    <span className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold">L3</span>
                      Detail Kerugian
                    </span>
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 whitespace-nowrap min-w-[80px]">Mulai</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 whitespace-nowrap min-w-[80px]">Selesai</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 whitespace-nowrap min-w-[90px]">Durasi</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 min-w-[120px]">Keterangan</th>
                  {/* Sticky last col */}
                  <th className="sticky right-0 z-20 bg-slate-50 px-4 py-3 text-center text-xs font-semibold text-slate-600 whitespace-nowrap border-l border-slate-200 min-w-[80px]">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={r.id}
                    className={cn(
                      'border-b border-slate-100 hover:bg-teal-50/40 transition-colors cursor-pointer',
                      i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30',
                    )}
                    onClick={() => onView?.(r)}
                  >
                    {/* Sticky: Date */}
                    <td className="sticky left-0 z-10 bg-inherit border-r border-slate-100 px-4 py-3 font-medium whitespace-nowrap">
                      {fmtDate(r.date)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{r.line_name ?? '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant="outline" className="text-xs">{r.shift_name ?? '—'}</Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.feed_code_code
                        ? <Badge className="bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-100 text-xs font-mono">{r.feed_code_code}</Badge>
                        : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                    {/* L1 */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.loss_l1_name
                        ? <Badge className="bg-red-100 text-red-700 border border-red-200 hover:bg-red-100 text-xs font-medium">{r.loss_l1_name}</Badge>
                        : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                    {/* L2 */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.loss_l2_name
                        ? <Badge className="bg-violet-100 text-violet-700 border border-violet-200 hover:bg-violet-100 text-xs font-medium">{r.loss_l2_name}</Badge>
                        : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                    {/* L3 */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.loss_l3_name
                        ? <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-medium">{r.loss_l3_name}</Badge>
                        : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-xs">{r.time_from ?? '—'}</td>
                    <td className="px-4 py-3 text-center font-mono text-xs">{r.time_to   ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold text-orange-600">
                        {fmtHours(r.duration_minutes)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[120px] truncate">
                      {r.remarks || '—'}
                    </td>
                    {/* Sticky: Actions */}
                    <td className="sticky right-0 z-10 bg-inherit border-l border-slate-100 px-3 py-3"
                      onClick={e => e.stopPropagation()}>
                      <div className="flex justify-center gap-1">
                        <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-teal-600"
                          onClick={() => onView?.(r)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => onEdit(r)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm" variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => onDelete(r.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
