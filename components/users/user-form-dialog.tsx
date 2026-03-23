'use client'

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { AlertCircle, Loader2, UserPlus, Pencil, Info, KeyRound } from 'lucide-react'
import { ApiRole } from '@/services/userService'

export type UserFormState = {
  username:  string
  email:     string
  full_name: string
  role_id:   string
}

export const EMPTY_USER_FORM: UserFormState = {
  username:  '',
  email:     '',
  full_name: '',
  role_id:   '',
}

const ROLE_LABEL: Record<string, string> = {
  administrator: 'Administrator',
  plant_manager: 'Plant Manager',
  operator:      'Operator',
  viewer:        'Viewer',
}

type Props = {
  open:       boolean
  isEditing:  boolean
  isSaving:   boolean
  form:       UserFormState
  formError:  string
  roles:      ApiRole[]
  onFormChange: (f: UserFormState) => void
  onSave:  () => void
  onClose: () => void
}

export function UserFormDialog({
  open, isEditing, isSaving, form, formError,
  roles, onFormChange, onSave, onClose,
}: Props) {
  const set = (patch: Partial<UserFormState>) => onFormChange({ ...form, ...patch })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing
              ? <><Pencil className="h-4 w-4 text-blue-600" /> Edit User</>
              : <><UserPlus className="h-4 w-4 text-blue-600" /> Tambah User</>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">

          {/* Username — hanya saat create */}
          {!isEditing && (
            <div className="space-y-1.5">
              <Label>Username <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Contoh: john_doe"
                autoComplete="off"
                value={form.username}
                onChange={e => set({ username: e.target.value })}
              />
            </div>
          )}

          {/* Full name */}
          <div className="space-y-1.5">
            <Label>Nama Lengkap <span className="text-destructive">*</span></Label>
            <Input
              placeholder="Contoh: John Doe"
              value={form.full_name}
              onChange={e => set({ full_name: e.target.value })}
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label>Email <span className="text-destructive">*</span></Label>
            <Input
              type="email"
              placeholder="Contoh: john@company.com"
              autoComplete="off"
              value={form.email}
              onChange={e => set({ email: e.target.value })}
            />
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <Label>Role <span className="text-destructive">*</span></Label>
            <Select value={form.role_id} onValueChange={v => set({ role_id: v })}>
              <SelectTrigger><SelectValue placeholder="Pilih role…" /></SelectTrigger>
              <SelectContent>
                {roles.map(r => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {ROLE_LABEL[r.name] ?? r.name}
                    {r.description && (
                      <span className="ml-2 text-xs text-muted-foreground">{r.description}</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Info password */}
          {!isEditing && (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3">
              <KeyRound className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-xs text-amber-800 space-y-0.5">
                <p className="font-semibold">Password Sementara</p>
                <p>
                  User akan login menggunakan password sementara{' '}
                  <code className="bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded font-mono font-bold">
                    Qweqwe123
                  </code>{' '}
                  dan <strong>wajib mengganti password</strong> saat pertama kali masuk.
                </p>
              </div>
            </div>
          )}

          {isEditing && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2.5">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                Untuk mereset password, gunakan tombol <strong>Reset Password</strong> di tabel user.
              </span>
            </div>
          )}
        </div>

        {formError && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive -mt-1">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {formError}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Batal</Button>
          <Button onClick={onSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Simpan Perubahan' : 'Buat User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
