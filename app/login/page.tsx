'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { ProtectedRoute } from '@/components/protected-route'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { ApiError } from '@/lib/api-client'
import Image from 'next/image'
import Link from 'next/link'

const GOOGLE_CLIENT_ID = '934586469602-kgnhh6h5svicdfqbn5se79uflt1b304l.apps.googleusercontent.com'
const ALLOWED_DOMAIN   = 'cpp.co.id'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: object) => void
          renderButton: (el: HTMLElement, cfg: object) => void
          prompt: () => void
        }
      }
    }
  }
}

function LoginForm() {
  const { login, loginWithGoogle } = useAuth()

  const [username, setUsername]       = useState('')
  const [password, setPassword]       = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]             = useState('')
  const [isLoading, setIsLoading]     = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const googleBtnRef = useRef<HTMLDivElement>(null)

  // ── Load Google Identity Services script ─────────────────────────────────
  useEffect(() => {
    const scriptId = 'google-gsi-script'
    if (document.getElementById(scriptId)) {
      initGoogle()
      return
    }
    const script = document.createElement('script')
    script.id  = scriptId
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = initGoogle
    document.body.appendChild(script)
  }, [])

  function initGoogle() {
    if (!window.google || !googleBtnRef.current) return
    window.google.accounts.id.initialize({
      client_id:        GOOGLE_CLIENT_ID,
      callback:         handleGoogleCredential,
      hd:               ALLOWED_DOMAIN,   // hosted domain hint — restricts picker to @cpp.co.id
      auto_select:      false,
      cancel_on_tap_outside: true,
    })
    window.google.accounts.id.renderButton(googleBtnRef.current, {
      theme: 'outline',
      size:  'large',
      width: googleBtnRef.current.offsetWidth || 400,
      text:  'signin_with',
      logo_alignment: 'left',
    })
  }

  async function handleGoogleCredential(response: { credential: string }) {
    setError('')
    setGoogleLoading(true)
    try {
      await loginWithGoogle(response.credential)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail || 'Google sign-in failed.')
      } else {
        setError('Google sign-in failed. Please try again.')
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await login(username.trim(), password)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.status === 401
          ? 'Incorrect username or password.'
          : (err.detail || 'An error occurred.'))
      } else {
        setError('Unable to connect to server. Check your connection.')
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
            <Image src="/logo-master.png" alt="Logo" width={56} height={56} className="object-contain" />
            <div>
              <CardTitle>Digital Production Enterprise</CardTitle>
              <CardDescription>Enterprise Portal — OEE System</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Google Sign-In */}
          <div className="space-y-2">
            <div className="relative" ref={googleBtnRef}>
              {/* Fallback button while GIS script loads */}
              {!window?.google && (
                <Button variant="outline" className="w-full" disabled>
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Sign in with Google
                </Button>
              )}
            </div>
            {googleLoading && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-1">
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in with Google…
              </div>
            )}
            <p className="text-xs text-center text-muted-foreground">
              Only <span className="font-semibold text-blue-600">@{ALLOWED_DOMAIN}</span> accounts are permitted
            </p>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or sign in with credentials</span>
            </div>
          </div>

          {/* Username / Password */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="username"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button type="button" tabIndex={-1}
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
              {isLoading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…</>
                : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            No account?{' '}
            <Link href="/register" className="text-blue-600 hover:underline font-medium">
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <ProtectedRoute authPage>
      <LoginForm />
    </ProtectedRoute>
  )
}
