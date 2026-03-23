'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, Eye, EyeOff, KeyRound, CheckCircle2, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api-client';
import { ApiError } from '@/lib/api-client';

// ─── Password strength helper ─────────────────────────────────────────────────
function checkStrength(pwd: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pwd.length >= 8)                    score++;
  if (/[A-Z]/.test(pwd))                  score++;
  if (/[a-z]/.test(pwd))                  score++;
  if (/[0-9]/.test(pwd))                  score++;
  if (/[^A-Za-z0-9]/.test(pwd))           score++;

  if (score <= 1) return { score, label: 'Sangat Lemah', color: 'bg-red-500'    };
  if (score === 2) return { score, label: 'Lemah',        color: 'bg-orange-400' };
  if (score === 3) return { score, label: 'Cukup',        color: 'bg-yellow-400' };
  if (score === 4) return { score, label: 'Kuat',         color: 'bg-emerald-400' };
  return              { score, label: 'Sangat Kuat',   color: 'bg-emerald-600' };
}

const RULES = [
  { test: (p: string) => p.length >= 8,           label: 'Minimal 8 karakter'          },
  { test: (p: string) => /[A-Z]/.test(p),         label: 'Mengandung huruf kapital'     },
  { test: (p: string) => /[a-z]/.test(p),         label: 'Mengandung huruf kecil'       },
  { test: (p: string) => /[0-9]/.test(p),         label: 'Mengandung angka'             },
];

// ─── Page component ───────────────────────────────────────────────────────────
function ChangePasswordForm() {
  const { user, updateUser } = useAuth();
  const router = useRouter();

  const [currentPwd, setCurrentPwd]   = useState('');
  const [newPwd,     setNewPwd]       = useState('');
  const [confirmPwd, setConfirmPwd]   = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error,       setError]       = useState('');
  const [isLoading,   setIsLoading]   = useState(false);

  const strength  = checkStrength(newPwd);
  const allRulesMet = RULES.every(r => r.test(newPwd));
  const passwordsMatch = newPwd && confirmPwd && newPwd === confirmPwd;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!currentPwd) { setError('Password saat ini wajib diisi.'); return; }
    if (!allRulesMet) { setError('Password baru belum memenuhi semua persyaratan.'); return; }
    if (newPwd !== confirmPwd) { setError('Konfirmasi password tidak cocok.'); return; }
    if (currentPwd === newPwd) { setError('Password baru tidak boleh sama dengan password saat ini.'); return; }

    setIsLoading(true);
    try {
      await api.post(
        '/api/v1/auth/me/change-password',
        { current_password: currentPwd, new_password: newPwd, confirm_new_password: confirmPwd },
        { withPlant: false },
      );

      // Clear must_change_password flag locally
      updateUser({ must_change_password: false });

      // Redirect to dashboard
      router.replace('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail || 'Gagal mengganti password. Periksa kembali input Anda.');
      } else {
        setError('Tidak dapat terhubung ke server.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-md space-y-4">

        {/* Header card */}
        <Card className="border-amber-200 bg-amber-50 shadow-sm">
          <CardContent className="flex items-start gap-3 p-4">
            <KeyRound className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-900 text-sm">Ganti Password Diperlukan</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Halo <strong>{user?.full_name || user?.username}</strong>, akun Anda menggunakan password sementara.
                Harap buat password baru sebelum melanjutkan.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Main form */}
        <Card className="shadow-xl">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-xl">Buat Password Baru</CardTitle>
            </div>
            <CardDescription>
              Password baru Anda harus berbeda dari password sementara.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Current password */}
              <div className="space-y-1.5">
                <Label htmlFor="current">Password Saat Ini</Label>
                <div className="relative">
                  <Input
                    id="current"
                    type={showCurrent ? 'text' : 'password'}
                    placeholder="Masukkan password saat ini"
                    value={currentPwd}
                    onChange={e => setCurrentPwd(e.target.value)}
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button type="button"
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                    onClick={() => setShowCurrent(v => !v)}>
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div className="space-y-1.5">
                <Label htmlFor="new">Password Baru</Label>
                <div className="relative">
                  <Input
                    id="new"
                    type={showNew ? 'text' : 'password'}
                    placeholder="Buat password baru"
                    value={newPwd}
                    onChange={e => setNewPwd(e.target.value)}
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button type="button"
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                    onClick={() => setShowNew(v => !v)}>
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Strength meter */}
                {newPwd && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Kekuatan:</span>
                      <span className={`font-semibold ${
                        strength.score <= 2 ? 'text-red-600' :
                        strength.score === 3 ? 'text-yellow-600' : 'text-emerald-600'
                      }`}>{strength.label}</span>
                    </div>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(i => (
                        <div key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all ${
                            i <= strength.score ? strength.color : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    {/* Rule checklist */}
                    <div className="space-y-1 pt-1">
                      {RULES.map((r, i) => {
                        const met = r.test(newPwd);
                        return (
                          <div key={i} className="flex items-center gap-1.5 text-xs">
                            <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${met ? 'text-emerald-500' : 'text-slate-300'}`} />
                            <span className={met ? 'text-emerald-700' : 'text-muted-foreground'}>{r.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Konfirmasi Password Baru</Label>
                <div className="relative">
                  <Input
                    id="confirm"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Ulangi password baru"
                    value={confirmPwd}
                    onChange={e => setConfirmPwd(e.target.value)}
                    autoComplete="new-password"
                    className={`pr-10 ${
                      confirmPwd
                        ? passwordsMatch ? 'border-emerald-400 focus-visible:ring-emerald-300' : 'border-red-400 focus-visible:ring-red-300'
                        : ''
                    }`}
                  />
                  <button type="button"
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirm(v => !v)}>
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPwd && !passwordsMatch && (
                  <p className="text-xs text-red-600">Password tidak cocok</p>
                )}
                {passwordsMatch && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Password cocok
                  </p>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />{error}
                </div>
              )}

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading
                  ? <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Menyimpan…</span>
                  : 'Simpan Password Baru'
                }
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ChangePasswordPage() {
  return (
    <ProtectedRoute>
      <ChangePasswordForm />
    </ProtectedRoute>
  );
}
