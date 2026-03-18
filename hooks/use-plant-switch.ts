'use client';

/**
 * hooks/use-plant-switch.ts
 * 
 * Hook terpusat untuk mengganti plant aktif sekaligus melakukan
 * hard-refresh halaman agar semua data tersync dengan plant baru.
 * 
 * Dipakai di: Sidebar (dropdown), SelectPlantPage
 */

import { useCallback, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, Plant } from '@/lib/auth-context';

export function usePlantSwitch() {
  const { activePlant, selectPlant } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSwitching, setIsSwitching] = useState(false);

  const switchPlant = useCallback(
    async (plant: Plant, redirectTo?: string) => {
      // Kalau pilih plant yang sama, tidak perlu refresh
      if (plant.id === activePlant?.id && !redirectTo) return;

      setIsSwitching(true);
      selectPlant(plant);

      const target = redirectTo ?? pathname;

      // router.replace memicu re-render komponen Next.js, tapi
      // tidak selalu re-fetch server data. router.refresh() memaksa
      // Next.js membuang cache dan re-fetch semua data di halaman aktif.
      if (redirectTo && redirectTo !== pathname) {
        router.replace(target);
      } else {
        // Tetap di halaman yang sama → refresh data
        router.replace(target);
        router.refresh();
      }

      // Beri sedikit waktu untuk animasi/spinner sebelum selesai
      setTimeout(() => setIsSwitching(false), 600);
    },
    [activePlant, selectPlant, router, pathname]
  );

  return { switchPlant, isSwitching };
}
