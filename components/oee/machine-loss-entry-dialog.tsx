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
  AlertCircle, Loader2, Wrench, Clock, Tag, CheckCircle2,
} from 'lucide-react'
import { ApiLine, ApiShift, ApiMachineLoss, ApiFeedCode } from '@/types/api'
import { cn } from '@/lib/utils'
import { calcDurationHours, fmtHours } from '@/lib/machine-loss-utils'

// ─── Types ────────────────────────────────────────────────────────────────────
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
  allLosses:   ApiMachineLoss[]
  onFormChange: (f: MachineLossFormState) => void
  onSave:      () => void
  onClose:     () => void
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({
  step,
  label,
  icon: Icon,
  locked,
  done,
  children,
}: {
  step:     number
  label:    string
  icon:     React.ElementType
  locked:   boolean   // true = belum bisa diakses
  done:     boolean   // true = sudah terisi lengkap
  children: React.ReactNode
}) {
  return (
    <div className={cn(
      'rounded-xl border transition-all duration-200',
      locked
        ? 'bg-slate-50 border-slate-100'
        : done
          ? 'bg-white border-emerald-200 shadow-sm'
          : 'bg-white border-slate-200 shadow-sm',
    )}>
      {/* Section header */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-t-xl',
        locked ? 'opacity-40' : '',
      )}>
        {/* Step bubble */}
        <div className={cn(
          'h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-colors',
          done
            ? 'bg-emerald-500 text-white'
            : locked
              ? 'bg-slate-200 text-slate-400'
              : 'bg-slate-800 text-white',
        )}>
          {done ? <CheckCircle2 className="h-4 w-4" /> : step}
        </div>
        <Icon className={cn('h-3.5 w-3.5', locked ? 'text-slate-300' : 'text-slate-500')} />
        <span className={cn(
          'text-xs font-semibold uppercase tracking-widest',
          locked ? 'text-slate-300' : done ? 'text-emerald-700' : 'text-slate-600',
        )}>
          {label}
        </span>
      </div>

      {/* Section body — hidden when locked */}
      {!locked && (
        <div className="px-4 pb-4 space-y-3">
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export function MachineLossEntryDialog({
  open, isEditing, isSaving, form, formError,
  lines, shifts, feedCodes, allLosses,
  onFormChange, onSave, onClose,
}: Props) {
  const set = (patch: Partial<MachineLossFormState>) =>
    onFormChange({ ...form, ...patch })

  // Step completion states
  const step1Done = !!(form.date && form.line_id && form.shift_id)
  const step2Done = step1Done   // step 2 is always optional, just needs step 1 done to unlock
  const step3Done = !!form.loss_l1_id
  const step4Done = !!(form.duration_hours && Number(form.duration_hours) > 0)

  // Cascading loss options
  const lossL1 = allLosses.filter(l => l.level === 1 && l.is_active)
  const lossL2 = allLosses.filter(
    l => l.level === 2 && l.is_active &&
      (!form.loss_l1_id || l.parent_id === Number(form.loss_l1_id))
  )
  const lossL3 = allLosses.filter(
    l => l.level === 3 && l.is_active &&
      (!form.loss_l2_id || l.parent_id === Number(form.loss_l2_id))
  )

  // Selected labels for breadcrumb
  const selL1 = lossL1.find(l => String(l.id) === form.loss_l1_id)
  const selL2 = lossL2.find(l => String(l.id) === form.loss_l2_id)
  const selL3 = lossL3.find(l => String(l.id) === form.loss_l3_id)

  // Duration auto-compute
  const autoHours    = calcDurationHours(form.time_from, form.time_to)
  const hasAutoHours = !!(form.time_from && form.time_to && autoHours > 0)
  const displayHours = hasAutoHours ? autoHours : (Number(form.duration_hours) || 0)

  function handleL1Change(val: string) {
    set({ loss_l1_id: val === 'none' ? '' : val, loss_l2_id: '', loss_l3_id: '' })
  }
  function handleL2Change(val: string) {
    set({ loss_l2_id: val === 'none' ? '' : val, loss_l3_id: '' })
  }
  function handleTimeChange(field: 'time_from' | 'time_to', val: string) {
    const from = field === 'time_from' ? val : form.time_from
    const to   = field === 'time_to'   ? val : form.time_to
    const hrs  = calcDurationHours(from, to)
    set({ [field]: val, duration_hours: hrs > 0 ? String(hrs) : form.duration_hours })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-teal-600" />
            {isEditing ? 'Edit Data Machine Loss' : 'Tambah Data Machine Loss'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2.5 py-1">

          {/* ── STEP 1: Konteks ── */}
          <Section
            step={1}
            label="Tanggal, Shift & Line"
            icon={Wrench}
            locked={false}
            done={step1Done}
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Tanggal <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={e => set({ date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Shift <span className="text-destructive">*</span>
                </Label>
                <Select value={form.shift_id} onValueChange={v => set({ shift_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih shift…" /></SelectTrigger>
                  <SelectContent>
                    {shifts.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        <span className="font-medium">{s.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {s.time_from} – {s.time_to}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs">
                  Line <span className="text-destructive">*</span>
                </Label>
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

          {/* ── STEP 2: Kode Pakan (opsional) ── */}
          <Section
            step={2}
            label="Kode Pakan"
            icon={Tag}
            locked={!step1Done}
            done={step1Done && !!form.feed_code_id}
          >
            <Select
              value={form.feed_code_id || 'none'}
              onValueChange={v => set({ feed_code_id: v === 'none' ? '' : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih kode pakan…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground italic">— Tidak ada —</span>
                </SelectItem>
                {feedCodes.map(fc => (
                  <SelectItem key={fc.id} value={String(fc.id)}>
                    <span className="font-mono font-medium">{fc.code}</span>
                    {fc.remarks && (
                      <span className="ml-2 text-xs text-muted-foreground">{fc.remarks}</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Section>

          {/* ── STEP 3: Kategori Kerugian ── */}
          <Section
            step={3}
            label="Machine Loss Category"
            icon={Wrench}
            locked={!step2Done}
            done={step3Done}
          >
            {/* Breadcrumb preview */}
            {selL1 && (
              <div className="flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 flex-wrap">
                <span className="font-semibold text-red-600">{selL1.name}</span>
                {selL2 && (
                  <>
                    <span className="text-slate-300">›</span>
                    <span className="font-semibold text-violet-600">{selL2.name}</span>
                  </>
                )}
                {selL3 && (
                  <>
                    <span className="text-slate-300">›</span>
                    <span className="font-semibold text-emerald-600">{selL3.name}</span>
                  </>
                )}
              </div>
            )}

            {/* L1 */}
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">L1</span>
                Loss Level 1
                <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.loss_l1_id || 'none'}
                onValueChange={handleL1Change}
              >
                <SelectTrigger className={cn(form.loss_l1_id && 'border-red-200 bg-red-50/40')}>
                  <SelectValue placeholder="Pilih kategori utama…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground italic">— Pilih —</span>
                  </SelectItem>
                  {lossL1.map(l => (
                    <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* L2 — hanya muncul setelah L1 dipilih */}
            {form.loss_l1_id && (
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 text-[10px] font-bold">L2</span>
                  Loss Level 2
                  <span className="text-xs text-muted-foreground font-normal"></span>
                </Label>
                <Select
                  value={form.loss_l2_id || 'none'}
                  onValueChange={handleL2Change}
                  disabled={lossL2.length === 0}
                >
                  <SelectTrigger className={cn(form.loss_l2_id && 'border-violet-200 bg-violet-50/40')}>
                    <SelectValue placeholder={lossL2.length === 0 ? 'Tidak ada sub-kategori' : 'Pilih sub-kategori…'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-muted-foreground italic">— Tidak ada —</span>
                    </SelectItem>
                    {lossL2.map(l => (
                      <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* L3 — hanya muncul setelah L2 dipilih */}
            {form.loss_l2_id && (
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold">L3</span>
                  Loss Level 3
                  <span className="text-xs text-muted-foreground font-normal"></span>
                </Label>
                <Select
                  value={form.loss_l3_id || 'none'}
                  onValueChange={v => set({ loss_l3_id: v === 'none' ? '' : v })}
                  disabled={lossL3.length === 0}
                >
                  <SelectTrigger className={cn(form.loss_l3_id && 'border-emerald-200 bg-emerald-50/40')}>
                    <SelectValue placeholder={lossL3.length === 0 ? 'Tidak ada detail' : 'Pilih detail…'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-muted-foreground italic">— Tidak ada —</span>
                    </SelectItem>
                    {lossL3.map(l => (
                      <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </Section>

          {/* ── STEP 4: Waktu & Durasi ── */}
          <Section
            step={4}
            label="Waktu & Durasi"
            icon={Clock}
            locked={!step3Done}
            done={step4Done}
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Waktu Mulai</Label>
                <Input
                  type="time"
                  value={form.time_from}
                  onChange={e => handleTimeChange('time_from', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Waktu Selesai</Label>
                <Input
                  type="time"
                  value={form.time_to}
                  onChange={e => handleTimeChange('time_to', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                Durasi (jam) <span className="text-destructive">*</span>
                {hasAutoHours && (
                  <span className="text-[10px] text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded font-normal">
                    dihitung otomatis
                  </span>
                )}
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Contoh: 1.5"
                  value={hasAutoHours ? String(autoHours) : form.duration_hours}
                  onChange={e => !hasAutoHours && set({ duration_hours: e.target.value })}
                  readOnly={hasAutoHours}
                  className={cn(hasAutoHours && 'bg-muted/50 text-muted-foreground cursor-not-allowed')}
                />
                {displayHours > 0 && (
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded">
                      {fmtHours(displayHours)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Keterangan</Label>
              <Textarea
                placeholder="Catatan opsional…"
                rows={2}
                value={form.remarks}
                onChange={e => set({ remarks: e.target.value })}
              />
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
