'use client'

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertCircle, Loader2, Wrench, Clock, Tag, CheckCircle2, AlertTriangle,
  ChevronRight, X,
} from 'lucide-react'
import { ApiLine, ApiShift, ApiMachineLossLvl1, ApiMachineLossLvl2, ApiMachineLossLvl3, ApiFeedCode } from '@/types/api'
import { cn } from '@/lib/utils'
import { calcDurationHours, fmtMinutes } from '@/lib/machine-loss-utils'

export type MachineLossFormState = {
  date:           string
  line_id:        string
  shift_id:       string
  feed_code_id:   string
  loss_l1_id:     string
  loss_l2_id:     string
  loss_l3_id:     string
  time_from:      string
  time_to:        string
  duration_hours: string
  remarks:        string
}

export const EMPTY_LOSS_FORM: MachineLossFormState = {
  date:           new Date().toISOString().slice(0, 10),
  line_id:        '',
  shift_id:       '',
  feed_code_id:   '',
  loss_l1_id:     '',
  loss_l2_id:     '',
  loss_l3_id:     '',
  time_from:      '',
  time_to:        '',
  duration_hours: '',
  remarks:        '',
}

type Props = {
  open:        boolean
  isEditing:   boolean
  isSaving:    boolean
  form:        MachineLossFormState
  formError:   string
  lines:       ApiLine[]
  shifts:      ApiShift[]
  feedCodes:   ApiFeedCode[]
  allLvl1:     ApiMachineLossLvl1[]
  allLvl2:     ApiMachineLossLvl2[]
  allLvl3:     ApiMachineLossLvl3[]
  onFormChange: (f: MachineLossFormState) => void
  onSave:      () => void
  onClose:     () => void
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ step, label, icon: Icon, locked, done, children }: {
  step: number; label: string; icon: React.ElementType
  locked: boolean; done: boolean; children: React.ReactNode
}) {
  return (
    <div className={cn(
      'rounded-xl border transition-all duration-200',
      locked ? 'bg-slate-50 border-slate-100' : done ? 'bg-white border-emerald-200 shadow-sm' : 'bg-white border-slate-200 shadow-sm',
    )}>
      <div className={cn('flex items-center gap-3 px-4 py-3 rounded-t-xl', locked ? 'opacity-40' : '')}>
        <div className={cn(
          'h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-colors',
          done ? 'bg-emerald-500 text-white' : locked ? 'bg-slate-200 text-slate-400' : 'bg-slate-800 text-white',
        )}>
          {done ? <CheckCircle2 className="h-4 w-4" /> : step}
        </div>
        <Icon className={cn('h-3.5 w-3.5', locked ? 'text-slate-300' : 'text-slate-500')} />
        <span className={cn(
          'text-xs font-semibold uppercase tracking-widest',
          locked ? 'text-slate-300' : done ? 'text-emerald-700' : 'text-slate-600',
        )}>{label}</span>
      </div>
      {!locked && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  )
}

// ─── LossPicker: card-grid selector ──────────────────────────────────────────
function LossPicker<T extends { name: string }>({
  items, selectedId, onSelect, onClear, getId,
  colorScheme, placeholder, emptyText,
}: {
  items: T[]
  selectedId: string
  onSelect: (id: string) => void
  onClear: () => void
  getId: (item: T) => number
  colorScheme: 'red' | 'violet' | 'emerald'
  placeholder: string
  emptyText: string
}) {
  const c = {
    red: {
      selected: 'border-red-300 bg-red-50 text-red-800 ring-2 ring-red-300 ring-offset-1',
      hover: 'hover:border-red-200 hover:bg-red-50/60 hover:text-red-700',
      chip: 'bg-red-100 text-red-700 border-red-200',
      dot: 'bg-red-500',
      clear: 'hover:bg-red-200/60',
    },
    violet: {
      selected: 'border-violet-300 bg-violet-50 text-violet-800 ring-2 ring-violet-300 ring-offset-1',
      hover: 'hover:border-violet-200 hover:bg-violet-50/60 hover:text-violet-700',
      chip: 'bg-violet-100 text-violet-700 border-violet-200',
      dot: 'bg-violet-500',
      clear: 'hover:bg-violet-200/60',
    },
    emerald: {
      selected: 'border-emerald-300 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-300 ring-offset-1',
      hover: 'hover:border-emerald-200 hover:bg-emerald-50/60 hover:text-emerald-700',
      chip: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      clear: 'hover:bg-emerald-200/60',
    },
  }[colorScheme]

  if (items.length === 0) {
    return <p className="text-xs text-slate-400 italic py-1.5 text-center">{emptyText}</p>
  }

  return (
    <div className="space-y-2">
      {/* Selected chip */}
      {selectedId && (
        <div className={cn('flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-semibold', c.chip)}>
          <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', c.dot)} />
          <span className="flex-1 truncate">
            {items.find(i => String(getId(i)) === selectedId)?.name ?? '—'}
          </span>
          <button
            type="button"
            onClick={onClear}
            className={cn('rounded-full p-0.5 transition-colors', c.clear)}
            title="Hapus pilihan"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Card grid */}
      {!selectedId && (
        <p className="text-[11px] text-slate-400 font-medium">{placeholder}</p>
      )}
      <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto">
        {items.map(item => {
          const id = String(getId(item))
          const isSelected = selectedId === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => isSelected ? onClear() : onSelect(id)}
              className={cn(
                'text-left rounded-lg border px-2.5 py-2 text-xs font-medium transition-all duration-150 leading-snug',
                isSelected
                  ? c.selected
                  : cn('border-slate-200 bg-white text-slate-600', c.hover),
              )}
            >
              <span className="line-clamp-2">{item.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Dialog ──────────────────────────────────────────────────────────────
export function MachineLossEntryDialog({
  open, isEditing, isSaving, form, formError,
  lines, shifts, feedCodes, allLvl1, allLvl2, allLvl3,
  onFormChange, onSave, onClose,
}: Props) {
  const set = (patch: Partial<MachineLossFormState>) => onFormChange({ ...form, ...patch })

  const step1Done = !!(form.date && form.line_id && form.shift_id)
  const step3Done = !!form.loss_l1_id
  const step4Done = !!(form.duration_hours && Number(form.duration_hours) > 0)

  const selL1 = allLvl1.find(l => String(l.machine_losses_lvl_1_id) === form.loss_l1_id)
  const selL2 = allLvl2.find(l => String(l.machine_losses_lvl_2_id) === form.loss_l2_id)
  const selL3 = allLvl3.find(l => String(l.machine_losses_lvl_3_id) === form.loss_l3_id)

  const autoHours    = calcDurationHours(form.time_from, form.time_to)
  const hasAutoHours = !!(form.time_from && form.time_to && autoHours > 0)
  const displayHours = hasAutoHours ? autoHours : (Number(form.duration_hours) || 0)

  const selectedShift = shifts.find(s => String(s.id) === form.shift_id)
  const crossShiftWarning = (() => {
    if (!form.time_from || !form.time_to || !selectedShift) return null
    const toMin = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m }
    const fromMin          = toMin(form.time_from)
    const endMin           = toMin(form.time_to)
    const shiftEnd         = toMin(selectedShift.time_to)
    const adjEnd           = endMin   <= fromMin                        ? endMin   + 24 * 60 : endMin
    const adjShiftEnd      = shiftEnd <= toMin(selectedShift.time_from) ? shiftEnd + 24 * 60 : shiftEnd
    if (adjEnd > adjShiftEnd) {
      const over = adjEnd - adjShiftEnd
      return `Downtime melewati batas shift (${selectedShift.time_to}) sejauh ${fmtMinutes(over)}. Data akan otomatis disimpan dalam ${Math.min(shifts.length, 2)} record terpisah.`
    }
    return null
  })()

  function handleL1Change(id: string) { set({ loss_l1_id: id, loss_l2_id: '', loss_l3_id: '' }) }
  function handleL2Change(id: string) { set({ loss_l2_id: id, loss_l3_id: '' }) }
  function handleL3Change(id: string) { set({ loss_l3_id: id }) }
  function handleTimeChange(field: 'time_from' | 'time_to', val: string) {
    const from = field === 'time_from' ? val : form.time_from
    const to   = field === 'time_to'   ? val : form.time_to
    const hrs  = calcDurationHours(from, to)
    set({ [field]: val, duration_hours: hrs > 0 ? String(hrs) : form.duration_hours })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[580px] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-teal-600" />
            {isEditing ? 'Edit Data Machine Loss' : 'Tambah Data Machine Loss'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2.5 py-1">

          {/* STEP 1 */}
          <Section step={1} label="Tanggal, Shift & Line" icon={Wrench} locked={false} done={step1Done}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Tanggal <span className="text-destructive">*</span></Label>
                <Input type="date" value={form.date} onChange={e => set({ date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Shift <span className="text-destructive">*</span></Label>
                <Select value={form.shift_id} onValueChange={v => set({ shift_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih shift…" /></SelectTrigger>
                  <SelectContent>
                    {shifts.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        <span className="font-medium">{s.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{s.time_from} – {s.time_to}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs">Line <span className="text-destructive">*</span></Label>
                <Select value={form.line_id} onValueChange={v => set({ line_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih line…" /></SelectTrigger>
                  <SelectContent>
                    {lines.map(l => (
                      <SelectItem key={l.id} value={String(l.id)}>
                        {l.name}{l.code ? ` (${l.code})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Section>

          {/* STEP 2 */}
          <Section step={2} label="Kode Pakan" icon={Tag} locked={!step1Done} done={step1Done && !!form.feed_code_id}>
            <Select value={form.feed_code_id || 'none'} onValueChange={v => set({ feed_code_id: v === 'none' ? '' : v })}>
              <SelectTrigger><SelectValue placeholder="Pilih kode pakan…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none"><span className="text-muted-foreground italic">— Tidak ada —</span></SelectItem>
                {feedCodes.map(fc => (
                  <SelectItem key={fc.id} value={String(fc.id)}>
                    <span className="font-mono font-medium">{fc.code}</span>
                    {fc.remarks && <span className="ml-2 text-xs text-muted-foreground">{fc.remarks}</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Section>

          {/* STEP 3 — Enhanced Loss Category Picker */}
          <Section step={3} label="Machine Loss Category" icon={Wrench} locked={!step1Done} done={step3Done}>

            {/* Breadcrumb trail */}
            {selL1 && (
              <div className="flex items-center gap-1.5 flex-wrap rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-xs font-semibold border border-red-200">
                  <span className="text-[9px] font-bold opacity-50">L1</span>{selL1.name}
                </span>
                {selL2 && (
                  <>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-100 text-violet-700 text-xs font-semibold border border-violet-200">
                      <span className="text-[9px] font-bold opacity-50">L2</span>{selL2.name}
                    </span>
                  </>
                )}
                {selL3 && (
                  <>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200">
                      <span className="text-[9px] font-bold opacity-50">L3</span>{selL3.name}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* L1 */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">L1</span>
                <span className="text-xs font-semibold text-slate-600">Loss Category</span>
                <span className="text-destructive text-xs ml-0.5">*</span>
              </div>
              <LossPicker
                items={allLvl1}
                selectedId={form.loss_l1_id}
                onSelect={handleL1Change}
                onClear={() => handleL1Change('')}
                getId={l => l.machine_losses_lvl_1_id}
                colorScheme="red"
                placeholder="Pilih kategori utama kerugian:"
                emptyText="Belum ada Loss Category. Tambahkan di Master."
              />
            </div>

            {/* L2 */}
            {form.loss_l1_id && (
              <div className="space-y-1.5 pl-3 border-l-2 border-red-100 ml-1">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 text-[10px] font-bold">L2</span>
                  <span className="text-xs font-semibold text-slate-600">Sub Category</span>
                  <span className="text-[11px] text-muted-foreground">(opsional)</span>
                </div>
                <LossPicker
                  items={allLvl2}
                  selectedId={form.loss_l2_id}
                  onSelect={handleL2Change}
                  onClear={() => handleL2Change('')}
                  getId={l => l.machine_losses_lvl_2_id}
                  colorScheme="violet"
                  placeholder="Pilih sub-kategori:"
                  emptyText="Tidak ada sub-kategori untuk kategori ini."
                />
              </div>
            )}

            {/* L3 */}
            {form.loss_l2_id && (
              <div className="space-y-1.5 pl-6 border-l-2 border-violet-100 ml-1">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold">L3</span>
                  <span className="text-xs font-semibold text-slate-600">Detail Loss</span>
                  <span className="text-[11px] text-muted-foreground">(opsional)</span>
                </div>
                <LossPicker
                  items={allLvl3}
                  selectedId={form.loss_l3_id}
                  onSelect={handleL3Change}
                  onClear={() => handleL3Change('')}
                  getId={l => l.machine_losses_lvl_3_id}
                  colorScheme="emerald"
                  placeholder="Pilih detail kerugian:"
                  emptyText="Tidak ada detail kerugian untuk sub-kategori ini."
                />
              </div>
            )}
          </Section>

          {/* STEP 4 */}
          <Section step={4} label="Waktu & Durasi" icon={Clock} locked={!step3Done} done={step4Done}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Waktu Mulai</Label>
                <Input type="time" value={form.time_from} onChange={e => handleTimeChange('time_from', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Waktu Selesai</Label>
                <Input type="time" value={form.time_to} onChange={e => handleTimeChange('time_to', e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                Durasi (jam) <span className="text-destructive">*</span>
                {hasAutoHours && (
                  <span className="text-[10px] text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded font-normal">dihitung otomatis</span>
                )}
              </Label>
              <div className="relative">
                <Input
                  type="number" step="0.01" min="0.01"
                  placeholder="Contoh: 1.5"
                  value={hasAutoHours ? String(autoHours) : form.duration_hours}
                  onChange={e => !hasAutoHours && set({ duration_hours: e.target.value })}
                  readOnly={hasAutoHours}
                  className={cn(hasAutoHours && 'bg-muted/50 text-muted-foreground cursor-not-allowed')}
                />
                {displayHours > 0 && (
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded">
                      {fmtMinutes(displayHours * 60)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {crossShiftWarning && (
              <div className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-xs text-amber-800 space-y-0.5">
                  <p className="font-semibold">Downtime Melewati Batas Shift</p>
                  <p>{crossShiftWarning}</p>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Keterangan</Label>
              <Textarea placeholder="Catatan opsional…" rows={2} value={form.remarks} onChange={e => set({ remarks: e.target.value })} />
            </div>
          </Section>
        </div>

        {formError && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />{formError}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Batal</Button>
          <Button onClick={onSave} disabled={isSaving} className="bg-teal-600 hover:bg-teal-700">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Simpan Perubahan' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
