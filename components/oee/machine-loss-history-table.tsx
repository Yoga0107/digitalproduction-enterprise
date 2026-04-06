'use client'

import { useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Pencil, Trash2, Eye, WrenchIcon } from 'lucide-react'
import { ApiMachineLossInput } from '@/types/api'
import { fmtDate, fmtMinutes } from '@/lib/machine-loss-utils'
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
  const drag = useRef({ active: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 })

  function onMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    const el = scrollRef.current; if (!el) return
    drag.current = { active: true, startX: e.pageX - el.offsetLeft, startY: e.pageY - el.offsetTop, scrollLeft: el.scrollLeft, scrollTop: el.scrollTop }
    el.style.cursor = 'grabbing'; el.style.userSelect = 'none'
  }
  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!drag.current.active) return
    const el = scrollRef.current; if (!el) return
    e.preventDefault()
    el.scrollLeft = drag.current.scrollLeft - ((e.pageX - el.offsetLeft) - drag.current.startX)
    el.scrollTop  = drag.current.scrollTop  - ((e.pageY - el.offsetTop)  - drag.current.startY)
  }
  function onMouseUpLeave() {
    drag.current.active = false
    const el = scrollRef.current
    if (el) { el.style.cursor = 'grab'; el.style.userSelect = '' }
  }

  return (
    <Card className="border border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="pb-3 bg-white border-b border-slate-100">
        <CardTitle className="text-base flex items-center gap-2">
          <WrenchIcon className="h-4 w-4 text-teal-600" />
          Riwayat Machine Loss
          {!isLoading && (
            <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-100 ml-1">
              {rows.length} record
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-14 text-muted-foreground text-sm">
            Belum ada data tersedia.
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="overflow-auto max-h-[520px] cursor-grab select-none"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUpLeave}
            onMouseLeave={onMouseUpLeave}
          >
            <table className="w-full text-sm border-collapse min-w-[1040px]">
              {/* ── HEAD ──────────────────────────────────────────────────── */}
              <thead>
                <tr className="bg-white text-black">
                  {/* Sticky: Date */}
                  <th className="sticky left-0 z-20 bg-white text-left px-4 py-3 text-xs font-semibold whitespace-nowrap border-r border-slate-700 min-w-[130px]">
                    Tanggal
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap min-w-[120px]">Line</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap min-w-[100px]">Shift</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap min-w-[110px]">Kode Pakan</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap min-w-[160px]">
                    <span className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-red-500/30 text-black text-[10px] font-bold">L1</span>
                      Kategori Utama
                    </span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap min-w-[160px]">
                    <span className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-violet-500/30 text-black text-[10px] font-bold">L2</span>
                      Sub-Kategori
                    </span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap min-w-[160px]">
                    <span className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/30 text-black text-[10px] font-bold">L3</span>
                      Detail Kerugian
                    </span>
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold whitespace-nowrap min-w-[80px]">Mulai</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold whitespace-nowrap min-w-[80px]">Selesai</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold whitespace-nowrap min-w-[90px]">Durasi</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold min-w-[130px]">Keterangan</th>
                  {/* Sticky: Actions */}
                  <th className="sticky right-0 z-20 bg-white px-4 py-3 text-center text-xs font-semibold whitespace-nowrap border-l border-slate-700 min-w-[100px]">
                    Aksi
                  </th>
                </tr>
              </thead>

              {/* ── BODY ──────────────────────────────────────────────────── */}
              <tbody>
                {rows.map((r, i) => {
                  const isEven = i % 2 === 0
                  const rowBg  = isEven ? 'bg-white' : 'bg-slate-50'
                  return (
                    <tr
                      key={r.id}
                      className={cn(
                        'border-b border-slate-100 hover:bg-teal-50 transition-colors cursor-pointer group',
                        rowBg,
                      )}
                      onClick={() => onView?.(r)}
                    >
                      {/* Sticky: Date — must match row bg exactly */}
                      <td className={cn(
                        'sticky left-0 z-10 border-r border-slate-200 px-4 py-3 font-medium whitespace-nowrap',
                        'group-hover:bg-teal-50',
                        isEven ? 'bg-white' : 'bg-slate-50',
                      )}>
                        {fmtDate(r.date)}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-slate-700">{r.line_name ?? '—'}</td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant="outline" className="text-xs font-medium">{r.shift_name ?? '—'}</Badge>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {r.feed_code_code
                          ? <Badge className="bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-100 text-xs font-mono">{r.feed_code_code}</Badge>
                          : <span className="text-slate-300 text-xs">—</span>}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {r.loss_l1_name
                          ? <Badge className="bg-red-100 text-red-700 border border-red-200 hover:bg-red-100 text-xs font-medium">{r.loss_l1_name}</Badge>
                          : <span className="text-slate-300 text-xs">—</span>}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {r.loss_l2_name
                          ? <Badge className="bg-violet-100 text-violet-700 border border-violet-200 hover:bg-violet-100 text-xs font-medium">{r.loss_l2_name}</Badge>
                          : <span className="text-slate-300 text-xs">—</span>}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {r.loss_l3_name
                          ? <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-medium">{r.loss_l3_name}</Badge>
                          : <span className="text-slate-300 text-xs">—</span>}
                      </td>

                      <td className="px-4 py-3 text-center font-mono text-xs text-slate-600">{r.time_from ?? '—'}</td>
                      <td className="px-4 py-3 text-center font-mono text-xs text-slate-600">{r.time_to   ?? '—'}</td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className="text-sm font-bold text-orange-600 tabular-nums">
                          {fmtMinutes(r.duration_minutes)}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-xs text-slate-500 max-w-[130px] truncate">
                        {r.remarks || <span className="text-slate-300">—</span>}
                      </td>

                      {/* Sticky: Actions — fully opaque, matches row background */}
                      <td
                        className={cn(
                          'sticky right-0 z-10 border-l border-slate-200 px-3 py-2.5',
                          'group-hover:bg-teal-50',
                          isEven ? 'bg-white' : 'bg-slate-50',
                        )}
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="flex justify-center items-center gap-0.5">
                          <Button
                            size="sm" variant="ghost"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-teal-600 hover:bg-teal-100"
                            onClick={() => onView?.(r)}
                            title="Lihat detail"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => onEdit(r)}
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => onDelete(r.id)}
                            title="Hapus"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
