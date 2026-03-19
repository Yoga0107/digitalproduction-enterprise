'use client'

import { useState, useEffect, useCallback } from 'react'
import { OeeGuard } from '@/components/oee/oee-guard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Users, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api-client'
import { ApiUser, ApiPlant, ApiRole } from '@/types/api'


import { UserTable }       from '@/components/users/user-table'
import { UserFormDialog, UserFormState, EMPTY_USER_FORM } from '@/components/users/user-form-dialog'
import { UserPlantDialog } from '@/components/users/user-plant-dialog'
import { createUser, deactivateUser, listPlants, listRoles, listUsers, updateUser } from '@/services/userService'

export default function UsersPage() {
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
      toast.error('Failed to load users')
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
      password:  '',
      role_id:   String(user.role.id),
    })
    setFormError(''); setFormOpen(true)
  }

  async function handleSave() {
    setFormError('')
    if (!form.full_name.trim()) { setFormError('Full name is required.'); return }
    if (!form.email.trim())     { setFormError('Email is required.'); return }
    if (!form.role_id)          { setFormError('Role is required.'); return }
    if (!editing && !form.password) { setFormError('Password is required.'); return }
    if (!editing && !form.username.trim()) { setFormError('Username is required.'); return }

    setIsSaving(true)
    try {
      if (editing) {
        const u = await updateUser(editing.id, {
          full_name: form.full_name.trim(),
          email:     form.email.trim(),
          role_id:   Number(form.role_id),
        })
        setUsers(prev => prev.map(x => x.id === editing.id ? u : x))
        toast.success('User updated')
      } else {
        const u = await createUser({
          username:  form.username.trim(),
          email:     form.email.trim(),
          full_name: form.full_name.trim(),
          password:  form.password,
          role_id:   Number(form.role_id),
          plant_ids: [],
        })
        setUsers(prev => [...prev, u])
        toast.success('User created — assign plant access below')
      }
      setFormOpen(false)
    } catch (err) {
      if (err instanceof ApiError) setFormError(err.detail)
      else toast.error('Failed to save user')
    } finally { setIsSaving(false) }
  }

  async function handleSavePlants(plantIds: number[]) {
    if (!plantTarget) return
    setIsSavingPlants(true)
    try {
      const u = await updateUser(plantTarget.id, { plant_ids: plantIds })
      setUsers(prev => prev.map(x => x.id === plantTarget.id ? u : x))
      toast.success('Plant access updated')
      setPlantDialogOpen(false)
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.detail)
      else toast.error('Failed to update plant access')
    } finally { setIsSavingPlants(false) }
  }

  async function handleToggleActive(user: ApiUser) {
    if (!user.is_active) {
      try {
        const u = await updateUser(user.id, { is_active: true })
        setUsers(prev => prev.map(x => x.id === user.id ? u : x))
        toast.success('User activated')
      } catch (err) {
        if (err instanceof ApiError) toast.error(err.detail)
        else toast.error('Failed to activate user')
      }
      return
    }
    setDeactivateTarget(user)
  }

  async function handleDeactivateConfirm() {
    if (!deactivateTarget) return
    setIsDeactivating(true)
    try {
      await deactivateUser(deactivateTarget.id)
      setUsers(prev => prev.map(x =>
        x.id === deactivateTarget.id ? { ...x, is_active: false } : x
      ))
      toast.success('User deactivated')
      setDeactivateTarget(null)
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.detail)
      else toast.error('Failed to deactivate user')
    } finally { setIsDeactivating(false) }
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
              <p className="text-blue-200 text-sm mt-1">Manage accounts, roles and plant access</p>
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
              <span>{totalActive} active</span>
            </div>
            {totalInactive > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-slate-300" />
                <span>{totalInactive} inactive</span>
              </div>
            )}
          </div>
          <Button
            onClick={openAdd}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" /> Add User
          </Button>
        </div>

        <UserTable
          users={users}
          plants={plants}
          isLoading={isLoading}
          onEdit={openEdit}
          onToggleActive={handleToggleActive}
          onManagePlants={user => { setPlantTarget(user); setPlantDialogOpen(true) }}
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

    <ConfirmDialog
      open={!!deactivateTarget}
      onClose={() => setDeactivateTarget(null)}
      onConfirm={handleDeactivateConfirm}
      title="Deactivate User"
      description={`${deactivateTarget?.full_name ?? deactivateTarget?.username} will lose access immediately. You can re-activate them at any time.`}
      confirmText="Deactivate"
      isLoading={isDeactivating}
    />
  </OeeGuard>
  )
}
