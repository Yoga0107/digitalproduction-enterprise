'use client';

/**
 * hooks/use-plant-switch.ts
 *
 * Hook terpusat untuk mengganti plant aktif.
 *
 * Strategi: window.location.href (hard navigation)
 * - Flush semua React state + useEffect di semua halaman
 * - Tidak ada data dari plant lama yang "bocor" ke plant baru
 * - Lebih reliable daripada router.refresh() yang hanya invalidate
 *   Next.js server cache, tidak menyentuh client-side useState
 *
 * Dipakai di: Sidebar (dropdown plant), SelectPlantPage
 */

import { useCallback, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth, Plant } from '@/lib/auth-context';

export function usePlantSwitch() {
  const { activePlant, selectPlant } = useAuth();
  const pathname = usePathname();
  const [isSwitching, setIsSwitching] = useState(false);

  const switchPlant = useCallback(
    (plant: Plant, redirectTo?: string) => {
      // Plant sama dan tidak ada redirect paksa — tidak perlu lakukan apa-apa
      if (plant.id === activePlant?.id && !redirectTo) return;

      setIsSwitching(true);

      // Simpan plant baru ke auth context + localStorage
      selectPlant(plant);

      // Tentukan target URL
      const target = redirectTo ?? pathname;

      // Hard navigation: flush semua React state, paksa reload penuh
      // sehingga semua useEffect/fetch di halaman baru pakai plant baru
      window.location.href = target;
    },
    [activePlant, selectPlant, pathname],
  );

  return { switchPlant, isSwitching };
}
