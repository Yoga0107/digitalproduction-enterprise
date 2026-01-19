'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertCircle } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user) {
            router.push('/dashboard');
        }
    }, [user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const success = await login(email, password);
            if (success) {
                router.push('/dashboard');
            } else {
                setError('Invalid email or password');
            }
        } catch (err) {
            setError('An error occurred during login');
        } finally {
            setIsLoading(false);
        }
    };

    const demoAccounts = [
        { email: 'admin@company.com', password: 'admin123', role: 'Admin' },
        { email: 'manager@company.com', password: 'manager123', role: 'Manager' },
        { email: 'user@company.com', password: 'user123', role: 'User' },
        { email: 'viewer@company.com', password: 'viewer123', role: 'Viewer' },
    ];

    const handleQuickLogin = (email: string, password: string) => {
        setEmail(email);
        setPassword(password);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-50 p-4">
            <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-white">
                                <Image
                                    src="/logo-master.png"
                                    alt="Logo Master"
                                    width={100}
                                    height={100}
                                    className="object-contain"
                                />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">Digital Production Enterprise</h1>
                                <p className="text-sm text-slate-600">Enterprise Portal</p>
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-slate-900">
                            Selamat Datang
                        </h2>
                        <p className="text-slate-600">
                            Login menggunakan Single Sign-On untuk mengakses dashboard
                        </p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Demo Accounts</CardTitle>
                            <CardDescription>
                                Klik untuk auto-fill kredensial demo
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {demoAccounts.map((account) => (
                                <Button
                                    key={account.email}
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => handleQuickLogin(account.email, account.password)}
                                    type="button"
                                >
                                    <div className="text-left">
                                        <div className="font-medium">{account.role}</div>
                                        <div className="text-xs text-slate-500">
                                            {account.email}
                                        </div>
                                    </div>
                                </Button>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <Card className="shadow-xl">
                    <CardHeader>
                        <CardTitle>Login SSO</CardTitle>
                        <CardDescription>
                            Masukkan kredensial Anda untuk login
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="user@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        Logging in...
                                    </div>
                                ) : (
                                    'Login dengan SSO'
                                )}
                            </Button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-2 text-slate-500">
                                        Secured by SSO
                                    </span>
                                </div>
                            </div>

                            <p className="text-xs text-center text-slate-500">
                                Sistem menggunakan Single Sign-On untuk keamanan maksimal
                            </p>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
