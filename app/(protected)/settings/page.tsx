'use client'

import { useState, useRef, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api-client'
import { updateProfileApi, changePasswordApi } from '@/services/authService'
import {
  User, Shield, Info, Camera, Loader2, AlertCircle,
  CheckCircle2, Eye, EyeOff, Factory, Calendar, Mail,
  AtSign, ShieldCheck, KeyRound,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROLE_LABELS } from '@/lib/role-map'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

const AVATAR_KEY = (userId: number) => `avatar_${userId}`

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user, login, activePlant, accessiblePlants } = useAuth()
  const router = useRouter()

  if (!user) {
    router.replace('/login')
    return null
  }

  // Avatar stored in localStorage as base64
  const [avatarSrc, setAvatarSrc] = useState<string | null>(() => {
    if (typeof window === 'undefined' || !user) return null
    return localStorage.getItem(AVATAR_KEY(user.id))
  })
  const [avatarUploading, setAvatarUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Profile form ────────────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    full_name: user.full_name ?? '',
    email:     user.email,
  })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError]   = useState('')
  const [profileSuccess, setProfileSuccess] = useState(false)

  // ── Password form ───────────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({
    current_password:     '',
    new_password:         '',
    confirm_new_password: '',
  })
  const [pwSaving, setPwSaving]   = useState(false)
  const [pwError,  setPwError]    = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [showPw, setShowPw] = useState({
    current: false, new_: false, confirm: false,
  })

  // ── Avatar ──────────────────────────────────────────────────────────────────

  function handleAvatarClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2 MB')
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    setAvatarUploading(true)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      // Resize to max 256x256 via canvas
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX = 256
        const ratio = Math.min(MAX / img.width, MAX / img.height)
        canvas.width  = Math.round(img.width  * ratio)
        canvas.height = Math.round(img.height * ratio)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        const compressed = canvas.toDataURL('image/jpeg', 0.85)
        if (user) localStorage.setItem(AVATAR_KEY(user.id), compressed)
        setAvatarSrc(compressed)
        setAvatarUploading(false)
        toast.success('Profile picture updated')
      }
      img.src = result
    }
    reader.readAsDataURL(file)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  function removeAvatar() {
    if (!user) return
    localStorage.removeItem(AVATAR_KEY(user.id))
    setAvatarSrc(null)
    toast.success('Profile picture removed')
  }

  // ── Save profile ────────────────────────────────────────────────────────────

  async function handleSaveProfile() {
    setProfileError('')
    setProfileSuccess(false)
    if (!profileForm.full_name.trim()) { setProfileError('Full name is required.'); return }
    if (!profileForm.email.trim())     { setProfileError('Email is required.'); return }

    setProfileSaving(true)
    try {
      await updateProfileApi({
        full_name: profileForm.full_name.trim(),
        email:     profileForm.email.trim(),
      })
      setProfileSuccess(true)
      toast.success('Profile updated')
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (err) {
      if (err instanceof ApiError) setProfileError(err.detail)
      else setProfileError('Failed to update profile')
    } finally {
      setProfileSaving(false)
    }
  }

  // ── Change password ─────────────────────────────────────────────────────────

  async function handleChangePassword() {
    setPwError('')
    setPwSuccess(false)
    if (!pwForm.current_password)     { setPwError('Current password is required.'); return }
    if (!pwForm.new_password)         { setPwError('New password is required.'); return }
    if (pwForm.new_password.length < 8) { setPwError('New password must be at least 8 characters.'); return }
    if (!/[A-Z]/.test(pwForm.new_password)) { setPwError('Password must contain at least one uppercase letter.'); return }
    if (!/[0-9]/.test(pwForm.new_password)) { setPwError('Password must contain at least one number.'); return }
    if (pwForm.new_password !== pwForm.confirm_new_password) {
      setPwError('Passwords do not match.')
      return
    }

    setPwSaving(true)
    try {
      await changePasswordApi(pwForm)
      setPwSuccess(true)
      setPwForm({ current_password: '', new_password: '', confirm_new_password: '' })
      toast.success('Password changed. Other sessions signed out.')
      setTimeout(() => setPwSuccess(false), 4000)
    } catch (err) {
      if (err instanceof ApiError) setPwError(err.detail)
      else setPwError('Failed to change password')
    } finally {
      setPwSaving(false)
    }
  }

  const roleLabel = ROLE_LABELS[user.role] ?? user.role

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">

      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-8 py-10">
        <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-6">
          {/* Avatar */}
          <div className="relative group shrink-0">
            <Avatar className="h-20 w-20 ring-4 ring-white/20">
              <AvatarImage src={avatarSrc ?? undefined} />
              <AvatarFallback className="bg-blue-600 text-white text-2xl font-bold">
                {initials(user.full_name ?? user.username)}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={handleAvatarClick}
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              title="Change photo"
            >
              {avatarUploading
                ? <Loader2 className="h-5 w-5 text-white animate-spin" />
                : <Camera className="h-5 w-5 text-white" />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white">{user.full_name ?? user.username}</h1>
            <p className="text-slate-300 text-sm mt-0.5">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-white/10 text-white border-white/20 text-xs">
                {roleLabel}
              </Badge>
              {user.is_superuser && (
                <Badge className="bg-amber-500/80 text-white border-0 text-xs gap-1">
                  <ShieldCheck className="h-3 w-3" /> Superuser
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="p-8 max-w-3xl">
        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" /> Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" /> Security
            </TabsTrigger>
            <TabsTrigger value="account" className="gap-2">
              <Info className="h-4 w-4" /> Account Info
            </TabsTrigger>
          </TabsList>

          {/* ── Profile tab ───────────────────────────────────────────────── */}
          <TabsContent value="profile" className="space-y-6">

            {/* Profile picture card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Profile Picture</CardTitle>
                <CardDescription>
                  Stored locally on this device. Max 2 MB, auto-resized to 256×256.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-5">
                  <Avatar className="h-16 w-16 shrink-0">
                    <AvatarImage src={avatarSrc ?? undefined} />
                    <AvatarFallback className="bg-blue-600 text-white text-xl font-bold">
                      {initials(user.full_name ?? user.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={handleAvatarClick} disabled={avatarUploading}>
                      {avatarUploading
                        ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Uploading…</>
                        : <><Camera className="mr-2 h-3.5 w-3.5" /> Upload Photo</>}
                    </Button>
                    {avatarSrc && (
                      <Button variant="outline" size="sm" onClick={removeAvatar}
                        className="text-destructive hover:text-destructive">
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile info card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Personal Information</CardTitle>
                <CardDescription>Update your display name and email address.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={profileForm.full_name}
                    onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))}
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="your@email.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground">Username</Label>
                  <div className="flex items-center gap-2 h-9 px-3 rounded-md border bg-muted/50">
                    <AtSign className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{user.username}</span>
                    <span className="ml-auto text-xs text-muted-foreground">Cannot be changed</span>
                  </div>
                </div>

                {profileError && (
                  <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />{profileError}
                  </div>
                )}
                {profileSuccess && (
                  <div className="flex items-center gap-2 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0" /> Profile updated successfully.
                  </div>
                )}

                <Button
                  onClick={handleSaveProfile}
                  disabled={profileSaving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {profileSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Security tab ──────────────────────────────────────────────── */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-slate-600" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Changing your password will sign out all other active sessions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Current password */}
                <div className="space-y-1.5">
                  <Label htmlFor="current_pw">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current_pw"
                      type={showPw.current ? 'text' : 'password'}
                      value={pwForm.current_password}
                      onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))}
                      placeholder="Enter current password"
                      className="pr-10"
                      autoComplete="current-password"
                    />
                    <button type="button" tabIndex={-1}
                      onClick={() => setShowPw(s => ({ ...s, current: !s.current }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPw.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Separator />

                {/* New password */}
                <div className="space-y-1.5">
                  <Label htmlFor="new_pw">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new_pw"
                      type={showPw.new_ ? 'text' : 'password'}
                      value={pwForm.new_password}
                      onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))}
                      placeholder="Min. 8 chars, 1 uppercase, 1 number"
                      className="pr-10"
                      autoComplete="new-password"
                    />
                    <button type="button" tabIndex={-1}
                      onClick={() => setShowPw(s => ({ ...s, new_: !s.new_ }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPw.new_ ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password strength indicator */}
                  {pwForm.new_password && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex gap-1">
                        {[
                          pwForm.new_password.length >= 8,
                          /[A-Z]/.test(pwForm.new_password),
                          /[0-9]/.test(pwForm.new_password),
                          pwForm.new_password.length >= 12,
                        ].map((ok, i) => (
                          <div key={i} className={cn(
                            'h-1.5 flex-1 rounded-full transition-colors',
                            ok ? 'bg-emerald-400' : 'bg-slate-200'
                          )} />
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                        {[
                          { ok: pwForm.new_password.length >= 8,    label: 'At least 8 characters' },
                          { ok: /[A-Z]/.test(pwForm.new_password),   label: 'One uppercase letter'  },
                          { ok: /[0-9]/.test(pwForm.new_password),   label: 'One number'             },
                          { ok: pwForm.new_password.length >= 12,   label: '12+ chars (recommended)'},
                        ].map(({ ok, label }) => (
                          <p key={label} className={cn(
                            'text-xs flex items-center gap-1',
                            ok ? 'text-emerald-600' : 'text-muted-foreground'
                          )}>
                            <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', ok ? 'bg-emerald-500' : 'bg-slate-300')} />
                            {label}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirm_pw">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm_pw"
                      type={showPw.confirm ? 'text' : 'password'}
                      value={pwForm.confirm_new_password}
                      onChange={e => setPwForm(f => ({ ...f, confirm_new_password: e.target.value }))}
                      placeholder="Repeat new password"
                      className={cn(
                        'pr-10',
                        pwForm.confirm_new_password && pwForm.new_password !== pwForm.confirm_new_password
                          ? 'border-destructive focus-visible:ring-destructive'
                          : ''
                      )}
                      autoComplete="new-password"
                    />
                    <button type="button" tabIndex={-1}
                      onClick={() => setShowPw(s => ({ ...s, confirm: !s.confirm }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPw.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {pwForm.confirm_new_password && pwForm.new_password !== pwForm.confirm_new_password && (
                    <p className="text-xs text-destructive">Passwords do not match</p>
                  )}
                </div>

                {pwError && (
                  <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />{pwError}
                  </div>
                )}
                {pwSuccess && (
                  <div className="flex items-center gap-2 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0" /> Password changed. Other sessions signed out.
                  </div>
                )}

                <Button
                  onClick={handleChangePassword}
                  disabled={pwSaving}
                  className="bg-slate-800 hover:bg-slate-900"
                >
                  {pwSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Change Password
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Account info tab ──────────────────────────────────────────── */}
          <TabsContent value="account" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Account Details</CardTitle>
                <CardDescription>Read-only information about your account.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { icon: AtSign,      label: 'Username',    value: user.username },
                    { icon: Mail,        label: 'Email',       value: user.email },
                    { icon: User,        label: 'Full Name',   value: user.full_name ?? '—' },
                    { icon: Shield,      label: 'Role',        value: roleLabel },
                    { icon: Calendar,    label: 'Member since',value: fmtDate(user.created_at) },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-4 py-2 border-b last:border-0">
                      <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-sm font-medium truncate">{value}</p>
                      </div>
                    </div>
                  ))}

                  {/* Status badges */}
                  <div className="flex items-center gap-4 py-2 border-b">
                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <Info className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <div className="flex gap-2 mt-0.5 flex-wrap">
                        <Badge className={cn(
                          'text-xs',
                          user.is_active
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500'
                        )}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {user.is_superuser && (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 text-xs gap-1">
                            <ShieldCheck className="h-3 w-3" /> Superuser
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Plant access */}
                  <div className="flex items-start gap-4 py-2">
                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Factory className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1.5">
                        Plant Access ({accessiblePlants.length})
                      </p>
                      {accessiblePlants.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No plant access assigned</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {accessiblePlants.map(p => (
                            <div key={p.id} className={cn(
                              'flex items-center gap-1.5 rounded-md border px-2 py-1',
                              activePlant?.id === p.id
                                ? 'border-emerald-300 bg-emerald-50'
                                : 'border-slate-200 bg-white'
                            )}>
                              <Factory className={cn(
                                'h-3 w-3 shrink-0',
                                activePlant?.id === p.id ? 'text-emerald-600' : 'text-slate-400'
                              )} />
                              <span className={cn(
                                'text-xs font-medium',
                                activePlant?.id === p.id ? 'text-emerald-700' : 'text-slate-600'
                              )}>
                                {p.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono">{p.code}</span>
                              {activePlant?.id === p.id && (
                                <Badge className="text-[9px] px-1 py-0 h-4 bg-emerald-100 text-emerald-700 border-0 hover:bg-emerald-100">
                                  Active
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  )
}
