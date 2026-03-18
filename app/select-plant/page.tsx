'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, Plant } from '@/lib/auth-context';
import { usePlantSwitch } from '@/hooks/use-plant-switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Factory, ChevronRight, LogOut, CheckCircle2, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { ROLE_LABELS } from '@/lib/role-map';

export default function SelectPlantPage() {
  const { user, accessiblePlants, activePlant, selectPlant, logout, isLoading } = useAuth();
  const { switchPlant, isSwitching } = usePlantSwitch();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.replace('/login'); return; }
    // Kalau cuma 1 plant → langsung pilih dan masuk
    if (accessiblePlants.length === 1 && !activePlant) {
      selectPlant(accessiblePlants[0]);
      router.replace('/dashboard');
    }
  }, [user, isLoading, accessiblePlants, activePlant, selectPlant, router]);

  const handleSelectPlant = (plant: Plant) => {
    // Kalau plant berbeda dari yang aktif → switch + hard refresh ke dashboard
    // Kalau sama → langsung ke dashboard
    if (plant.id !== activePlant?.id) {
      switchPlant(plant, '/dashboard');
    } else {
      router.push('/dashboard');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-50 p-4">
      <div className="w-full max-w-lg space-y-4">

        {/* Header card */}
        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Image src="/logo-master.png" alt="Logo" width={52} height={52} className="object-contain" />
              <div>
                <CardTitle className="text-lg">Pilih Plant</CardTitle>
                <CardDescription>
                  Halo, <span className="font-semibold text-foreground">{user.full_name}</span>
                  {' '}·{' '}
                  <span className="text-xs">{ROLE_LABELS[user.role]}</span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Plant list */}
        {accessiblePlants.length === 0 ? (
          <Card>
            <CardContent className="py-10 flex flex-col items-center gap-3 text-center text-muted-foreground">
              <Factory className="h-12 w-12 opacity-20" />
              <div>
                <p className="text-sm font-medium">Belum ada akses plant</p>
                <p className="text-xs mt-1">Hubungi administrator untuk mendapatkan akses ke plant.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground px-1">
              {accessiblePlants.length} plant tersedia — klik untuk masuk
            </p>
            {accessiblePlants.map((plant) => {
              const isActive = activePlant?.id === plant.id;
              const isThisSwitching = isSwitching && !isActive;
              return (
                <button
                  key={plant.id}
                  onClick={() => handleSelectPlant(plant)}
                  disabled={isSwitching}
                  className="w-full text-left disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Card className={`cursor-pointer transition-all hover:shadow-md hover:border-blue-400 ${
                    isActive ? 'border-blue-500 bg-blue-50/60 shadow-sm' : 'hover:bg-slate-50'
                  }`}>
                    <CardContent className="flex items-center justify-between py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          isActive ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {isThisSwitching
                            ? <Loader2 className="h-5 w-5 animate-spin" />
                            : <Factory className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{plant.name}</p>
                          <p className="text-xs text-muted-foreground">Kode: {plant.code}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isActive && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Aktif
                          </Badge>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        )}

        <Button variant="ghost" className="w-full text-muted-foreground" onClick={handleLogout} disabled={isSwitching}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
