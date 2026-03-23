'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerApi } from '@/services/authService';
import { ProtectedRoute } from '@/components/protected-route';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { ApiError } from '@/lib/api-client';
import Image from 'next/image';
import Link from 'next/link';

function RegisterForm() {
  const router = useRouter();

  const [form, setForm] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.password !== form.confirm_password) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await registerApi(form);
      setSuccess(res.message || 'Registrasi berhasil! Silakan login.');
      setTimeout(() => router.push('/login'), 2500);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errors && err.errors.length > 0) {
          setError(err.errors.map((e) => e.message).join(' • '));
        } else {
          setError(err.detail || 'Registrasi gagal.');
        }
      } else {
        setError('Tidak dapat terhubung ke server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <Image src="/logo-master.png" alt="Logo" width={56} height={56} className="object-contain" />
            <div>
              <CardTitle>Daftar Akun</CardTitle>
              <CardDescription>Digital Production Enterprise — OEE System</CardDescription>
            </div>
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
              <Alert className="border-green-300 bg-green-50 text-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="full_name">Nama Lengkap <span className="text-red-500">*</span></Label>
              <Input
                id="full_name"
                placeholder="Budi Santoso"
                value={form.full_name}
                onChange={set('full_name')}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username <span className="text-red-500">*</span></Label>
              <Input
                id="username"
                placeholder="budi_operator"
                value={form.username}
                onChange={set('username')}
                required
                disabled={isLoading}
                autoComplete="username"
              />
              <p className="text-xs text-muted-foreground">Hanya huruf, angka, titik, strip, underscore.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
              <Input
                id="email"
                type="email"
                placeholder="budi@perusahaan.com"
                value={form.email}
                onChange={set('email')}
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 karakter, 1 huruf kapital, 1 angka"
                  value={form.password}
                  onChange={set('password')}
                  required
                  disabled={isLoading}
                  className="pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">Konfirmasi Password <span className="text-red-500">*</span></Label>
              <Input
                id="confirm_password"
                type="password"
                placeholder="Ulangi password"
                value={form.confirm_password}
                onChange={set('confirm_password')}
                required
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || !!success}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Mendaftar…
                </span>
              ) : (
                'Daftar'
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Sudah punya akun?{' '}
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                Login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <ProtectedRoute authPage>
      <RegisterForm />
    </ProtectedRoute>
  );
}
