'use client'

import { useState, useEffect, useCallback } from 'react'
import { OeeGuard } from '@/components/oee/oee-guard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Users, Plus, KeyRound, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api-client'
import { ApiUser, ApiPlant } from '@/types/api'
import { ApiRole } from '@/services/userService'
import { useAuth } from '@/lib/auth-context'

import { UserTable }       from '@/components/users/user-table'
import { UserFormDialog, UserFormState, EMPTY_USER_FORM } from '@/components/users/user-form-dialog'
import { UserPlantDialog } from '@/components/users/user-plant-dialog'
import {
  createUser, deactivateUser, listPlants, listRoles, listUsers,
  updateUser, resetPassword,
} from '@/services/userService'

export default function UsersPage() {
  const { user: currentUser } = useAuth()

  const [users,  setUsers]  = useState<ApiUser[]>([])
  const [roles,  setRoles]  = useState<ApiRole[]>([])
  const [plants, setPlants] = useState<ApiPlant[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [formOpen,  setFormOpen]  = useState(false)
  const [editing,   setEditing]   = useState<ApiUser | null>(null)
  const [form,      setForm]      = useState<UserFormState>(EMPTY_USER_FORM)
  const [formError, setFormError] = useState('')
  const [isSaving,  setIsSaving]  = useState(false)

  const [plantTarget,     setPlantTarget]     = useState<ApiUser | null>(null)
  const [plantDialogOpen, setPlantDialogOpen] = useState(false)
  const [isSavingPlants,  setIsSavingPlants]  = useState(false)

  const [deactivateTarget, setDeactivateTarget] = useState<ApiUser | null>(null)
  const [isDeactivating,   setIsDeactivating]   = useState(false)

  // Reset password state
  const [resetTarget,    setResetTarget]    = useState<ApiUser | null>(null)
  const [isResetting,    setIsResetting]    = useState(false)
  const [resetDoneInfo,  setResetDoneInfo]  = useState<{ username: string; tempPassword: string } | null>(null)
  const [copied,         setCopied]         = useState(false)

  const load = useCallback(async () => {
    try {
      setIsLoading(true)
      const [userData, roleData, plantData] = await Promise.all([
        listUsers(), listRoles(), listPlants(),
      ])
      setUsers(userData)
      setRoles(roleData)
      setPlants(plantData.filter(p => p.is_active))
    } catch {
      toast.error('Gagal memuat data user')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function openAdd() {
    setEditing(null); setForm(EMPTY_USER_FORM); setFormError(''); setFormOpen(true)
  }

  function openEdit(user: ApiUser) {
    setEditing(user)
    setForm({
      username:  user.username,
      email:     user.email,
      full_name: user.full_name ?? '',
      role_id:   String(user.role.id),
    })
    setFormError(''); setFormOpen(true)
  }

  async function handleSave() {
    setFormError('')
    if (!form.full_name.trim()) { setFormError('Nama lengkap wajib diisi.'); return }
    if (!form.email.trim())     { setFormError('Email wajib diisi.'); return }
    if (!form.role_id)          { setFormError('Role wajib dipilih.'); return }
    if (!editing && !form.username.trim()) { setFormError('Username wajib diisi.'); return }

    setIsSaving(true)
    try {
      if (editing) {
        const u = await updateUser(editing.id, {
          full_name: form.full_name.trim(),
          email:     form.email.trim(),
          role_id:   Number(form.role_id),
        })
        setUsers(prev => prev.map(x => x.id === editing.id ? u : x))
        toast.success('User berhasil diperbarui')
      } else {
        const u = await createUser({
          username:  form.username.trim(),
          email:     form.email.trim(),
          full_name: form.full_name.trim(),
          role_id:   Number(form.role_id),
          plant_ids: [],
        })
        setUsers(prev => [...prev, u])
        toast.success('User berhasil dibuat — atur akses plant di bawah')
      }
      setFormOpen(false)
    } catch (err) {
      if (err instanceof ApiError) setFormError(err.detail)
      else toast.error('Gagal menyimpan user')
    } finally { setIsSaving(false) }
  }

  async function handleSavePlants(plantIds: number[]) {
    if (!plantTarget) return
    setIsSavingPlants(true)
    try {
      const u = await updateUser(plantTarget.id, { plant_ids: plantIds })
      setUsers(prev => prev.map(x => x.id === plantTarget.id ? u : x))
      toast.success('Akses plant berhasil diperbarui')
      setPlantDialogOpen(false)
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.detail)
      else toast.error('Gagal memperbarui akses plant')
    } finally { setIsSavingPlants(false) }
  }

  async function handleToggleActive(user: ApiUser) {
    if (user.is_active) {
      setDeactivateTarget(user)
    } else {
      try {
        const u = await updateUser(user.id, { is_active: true })
        setUsers(prev => prev.map(x => x.id === user.id ? u : x))
        toast.success('User berhasil diaktifkan')
      } catch (err) {
        if (err instanceof ApiError) toast.error(err.detail)
        else toast.error('Gagal mengaktifkan user')
      }
    }
  }

  async function handleDeactivateConfirm() {
    if (!deactivateTarget) return
    setIsDeactivating(true)
    try {
      await deactivateUser(deactivateTarget.id)
      setUsers(prev => prev.map(x => x.id === deactivateTarget.id ? { ...x, is_active: false } : x))
      toast.success('User berhasil dinonaktifkan')
      setDeactivateTarget(null)
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.detail)
      else toast.error('Gagal menonaktifkan user')
    } finally { setIsDeactivating(false) }
  }

  // ── Reset Password ────────────────────────────────────────────────────────
  async function handleResetPasswordConfirm() {
    if (!resetTarget) return
    setIsResetting(true)
    try {
      const res = await resetPassword(resetTarget.id)
      // Mark user as must_change_password in local state
      setUsers(prev => prev.map(x => x.id === resetTarget.id ? { ...x, must_change_password: true } : x))
      setResetTarget(null)
      setResetDoneInfo({ username: resetTarget.username, tempPassword: res.temp_password })
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.detail)
      else toast.error('Gagal mereset password')
    } finally { setIsResetting(false) }
  }

  async function copyTempPassword(pwd: string) {
    await navigator.clipboard.writeText(pwd)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const totalActive   = users.filter(u => u.is_active).length
  const totalInactive = users.filter(u => !u.is_active).length

  return (
    <OeeGuard section="users">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">

        <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 via-blue-900 to-indigo-800 px-8 py-10">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
                <Users className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest mb-1">Administration</p>
                <h1 className="text-3xl font-bold text-white tracking-tight">User Management</h1>
                <p className="text-blue-200 text-sm mt-1">Kelola akun, role, dan akses plant</p>
              </div>
            </div>
            <Badge className="bg-amber-500/80 text-white border-0 px-3 py-1.5 text-xs">Admin Only</Badge>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>{totalActive} aktif</span>
              </div>
              {totalInactive > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-slate-300" />
                  <span>{totalInactive} nonaktif</span>
                </div>
              )}
            </div>
            <Button
              onClick={openAdd}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" /> Tambah User
            </Button>
          </div>

          <UserTable
            users={users}
            plants={plants}
            isLoading={isLoading}
            isSuperuser={currentUser?.is_superuser ?? false}
            onEdit={openEdit}
            onToggleActive={handleToggleActive}
            onManagePlants={user => { setPlantTarget(user); setPlantDialogOpen(true) }}
            onManageModules={() => {}}
            onResetPassword={setResetTarget}
          />
        </div>
      </div>

      <UserFormDialog
        open={formOpen}
        isEditing={!!editing}
        isSaving={isSaving}
        form={form}
        formError={formError}
        roles={roles}
        onFormChange={setForm}
        onSave={handleSave}
        onClose={() => setFormOpen(false)}
      />

      {plantTarget && (
        <UserPlantDialog
          open={plantDialogOpen}
          user={plantTarget}
          plants={plants}
          isSaving={isSavingPlants}
          onSave={handleSavePlants}
          onClose={() => setPlantDialogOpen(false)}
        />
      )}

      {/* Confirm Reset Password */}
      <ConfirmDialog
        open={!!resetTarget}
        onClose={() => setResetTarget(null)}
        onConfirm={handleResetPasswordConfirm}
        title="Reset Password User"
        description={`Password ${resetTarget?.full_name ?? resetTarget?.username} akan direset ke password sementara. User wajib mengganti password saat login berikutnya.`}
        confirmText="Reset"
        isLoading={isResetting}
      />

      {/* Reset Password Done — show temp password */}
      <Dialog open={!!resetDoneInfo} onOpenChange={() => setResetDoneInfo(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-amber-600" />
              Password Berhasil Direset
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Password untuk <strong>{resetDoneInfo?.username}</strong> telah direset.
              Sampaikan password sementara berikut kepada user:
            </p>
            <div className="flex items-center gap-2 rounded-lg border-2 border-amber-200 bg-amber-50 px-4 py-3">
              <code className="flex-1 text-lg font-bold font-mono text-amber-800 tracking-wider">
                {resetDoneInfo?.tempPassword}
              </code>
              <Button size="sm" variant="ghost" className="text-amber-700 hover:bg-amber-100 shrink-0"
                onClick={() => copyTempPassword(resetDoneInfo?.tempPassword ?? '')}>
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="rounded-md bg-slate-50 border px-3 py-2.5 text-xs text-slate-600 space-y-1">
              <p>• User harus login menggunakan password ini</p>
              <p>• Saat pertama login, user akan diarahkan untuk mengganti password</p>
              <p>• Semua sesi aktif user telah dihapus</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setResetDoneInfo(null)} className="w-full">Selesai</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Deactivate */}
      <ConfirmDialog
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivateConfirm}
        title="Nonaktifkan User"
        description={`${deactivateTarget?.full_name ?? deactivateTarget?.username} akan kehilangan akses segera. Akun dapat diaktifkan kembali kapan saja.`}
        confirmText="Nonaktifkan"
        isLoading={isDeactivating}
      />
    </OeeGuard>
  )
}