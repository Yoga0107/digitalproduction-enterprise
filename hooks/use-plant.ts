/**
 * hooks/use-plant.ts
 * Hook convenience untuk halaman yang butuh data plant aktif.
 * Otomatis throw jika plant belum dipilih (seharusnya sudah di-guard oleh ProtectedRoute).
 */

import { useAuth } from '@/lib/auth-context';
import type { Plant } from '@/lib/auth-context';

export function usePlant(): { plant: Plant; plantId: number } {
  const { activePlant } = useAuth();

  if (!activePlant) {
    throw new Error(
      'usePlant dipanggil tanpa active plant. Pastikan halaman ini dibungkus ProtectedRoute requirePlant.'
    );
  }

  return {
    plant: activePlant,
    plantId: activePlant.id,
  };
}
