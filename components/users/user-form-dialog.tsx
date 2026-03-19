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
import { AlertCircle, Loader2, UserPlus, Pencil } from 'lucide-react'
import { ApiRole } from '@/services/userService'

export type UserFormState = {
  username:  string
  email:     string
  full_name: string
  password:  string
  role_id:   string
}

export const EMPTY_USER_FORM: UserFormState = {
  username:  '',
  email:     '',
  full_name: '',
  password:  '',
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
              : <><UserPlus className="h-4 w-4 text-blue-600" /> Add User</>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">

          {/* Username — only on create */}
          {!isEditing && (
            <div className="space-y-1.5">
              <Label>Username <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. john_doe"
                autoComplete="off"
                value={form.username}
                onChange={e => set({ username: e.target.value })}
              />
            </div>
          )}

          {/* Full name */}
          <div className="space-y-1.5">
            <Label>Full Name <span className="text-destructive">*</span></Label>
            <Input
              placeholder="e.g. John Doe"
              value={form.full_name}
              onChange={e => set({ full_name: e.target.value })}
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label>Email <span className="text-destructive">*</span></Label>
            <Input
              type="email"
              placeholder="e.g. john@company.com"
              autoComplete="off"
              value={form.email}
              onChange={e => set({ email: e.target.value })}
            />
          </div>

          {/* Password — only on create */}
          {!isEditing && (
            <div className="space-y-1.5">
              <Label>Password <span className="text-destructive">*</span></Label>
              <Input
                type="password"
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                value={form.password}
                onChange={e => set({ password: e.target.value })}
              />
            </div>
          )}

          {/* Role */}
          <div className="space-y-1.5">
            <Label>Role <span className="text-destructive">*</span></Label>
            <Select value={form.role_id} onValueChange={v => set({ role_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select role…" /></SelectTrigger>
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

          {isEditing && (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
              To change the password, the user must use the <strong>Change Password</strong> option in their profile.
            </p>
          )}

        </div>

        {formError && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive -mt-1">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {formError}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Create User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
