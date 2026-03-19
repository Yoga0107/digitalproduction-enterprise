'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { registerApi } from '@/services/authService'
import { ProtectedRoute } from '@/components/protected-route'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react'
import { ApiError } from '@/lib/api-client'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const ALLOWED_DOMAIN = 'cpp.co.id'

function RegisterForm() {
  const router = useRouter()

  const [form, setForm] = useState({
    full_name:        '',
    username:         '',
    email:            '',
    password:         '',
    confirm_password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]               = useState('')
  const [success, setSuccess]           = useState('')
  const [isLoading, setIsLoading]       = useState(false)

  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }))

  // Real-time domain validation
  const emailOk    = !form.email || form.email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)
  const emailTyped = form.email.includes('@')
  const passwordRules = {
    length:    form.password.length >= 8,
    uppercase: /[A-Z]/.test(form.password),
    number:    /[0-9]/.test(form.password),
  }
  const passwordMatch = form.confirm_password === '' || form.password === form.confirm_password

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Client-side domain guard
    if (!form.email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)) {
      setError(`Only @${ALLOWED_DOMAIN} email addresses are permitted.`)
      return
    }
    if (!passwordRules.length || !passwordRules.uppercase || !passwordRules.number) {
      setError('Password does not meet requirements.')
      return
    }
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)
    try {
      const res = await registerApi(form)
      setSuccess(res.message || 'Registration successful! Redirecting to login…')
      setTimeout(() => router.push('/login'), 2500)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errors && err.errors.length > 0) {
          setError(err.errors.map(e => e.message).join(' • '))
        } else {
          setError(err.detail || 'Registration failed.')
        }
      } else {
        setError('Unable to connect to server.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-2 pb-4">
          <div className="flex items-center gap-3">
            <Image src="/logo-master.png" alt="Logo" width={52} height={52} className="object-contain" />
            <div>
              <CardTitle>Create Account</CardTitle>
              <CardDescription>Digital Production Enterprise — OEE System</CardDescription>
            </div>
          </div>
          {/* Domain restriction notice */}
          <div className="flex items-center gap-2 rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-700">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            Registration is restricted to <strong className="ml-1">@{ALLOWED_DOMAIN}</strong> &nbsp;email addresses only.
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="border-emerald-300 bg-emerald-50 text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {/* Full name */}
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Full Name <span className="text-destructive">*</span></Label>
              <Input
                id="full_name"
                placeholder="John Doe"
                value={form.full_name}
                onChange={set('full_name')}
                required disabled={isLoading}
              />
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <Label htmlFor="username">Username <span className="text-destructive">*</span></Label>
              <Input
                id="username"
                placeholder="john_doe"
                value={form.username}
                onChange={set('username')}
                required disabled={isLoading}
                autoComplete="username"
              />
              <p className="text-xs text-muted-foreground">
                Letters, numbers, dots, dashes, underscores only.
              </p>
            </div>

            {/* Email with domain hint */}
            <div className="space-y-1.5">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder={`name@${ALLOWED_DOMAIN}`}
                  value={form.email}
                  onChange={set('email')}
                  required disabled={isLoading}
                  autoComplete="email"
                  className={cn(
                    emailTyped && !emailOk
                      ? 'border-destructive focus-visible:ring-destructive'
                      : emailTyped && emailOk
                      ? 'border-emerald-400 focus-visible:ring-emerald-400'
                      : ''
                  )}
                />
              </div>
              {emailTyped && !emailOk && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Must be a @{ALLOWED_DOMAIN} address
                </p>
              )}
              {emailTyped && emailOk && (
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Valid domain
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 chars, 1 uppercase, 1 number"
                  value={form.password}
                  onChange={set('password')}
                  required disabled={isLoading}
                  className="pr-10"
                  autoComplete="new-password"
                />
                <button type="button" tabIndex={-1}
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.password && (
                <div className="space-y-1 pt-0.5">
                  <div className="flex gap-1">
                    {[passwordRules.length, passwordRules.uppercase, passwordRules.number].map((ok, i) => (
                      <div key={i} className={cn('h-1 flex-1 rounded-full', ok ? 'bg-emerald-400' : 'bg-slate-200')} />
                    ))}
                  </div>
                  <div className="grid grid-cols-1 gap-0.5">
                    {[
                      { ok: passwordRules.length,    label: 'At least 8 characters' },
                      { ok: passwordRules.uppercase, label: 'One uppercase letter'  },
                      { ok: passwordRules.number,    label: 'One number'            },
                    ].map(({ ok, label }) => (
                      <p key={label} className={cn('text-xs flex items-center gap-1', ok ? 'text-emerald-600' : 'text-muted-foreground')}>
                        <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', ok ? 'bg-emerald-500' : 'bg-slate-300')} />
                        {label}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirm_password">
                Confirm Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="confirm_password"
                type="password"
                placeholder="Repeat password"
                value={form.confirm_password}
                onChange={set('confirm_password')}
                required disabled={isLoading}
                autoComplete="new-password"
                className={cn(
                  form.confirm_password && !passwordMatch
                    ? 'border-destructive focus-visible:ring-destructive' : ''
                )}
              />
              {form.confirm_password && !passwordMatch && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isLoading || !!success}
            >
              {isLoading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account…</>
                : 'Create Account'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                Sign In
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <ProtectedRoute authPage>
      <RegisterForm />
    </ProtectedRoute>
  )
}
