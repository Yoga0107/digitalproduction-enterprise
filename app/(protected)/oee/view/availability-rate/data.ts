/**
 * DEPRECATED — data statis digantikan oleh API call ke backend.
 * File ini dipertahankan agar tidak ada import yang broken.
 * Gunakan getAvailabilityRate() dari services/oeeService.ts.
 */

// Re-export type dari types/oee-types.ts agar import lama tidak error
export type { AvailabilityRow } from "@/types/oee-types"

/** @deprecated Gunakan getAvailabilityRate() dari services/oeeService.ts */
export const availabilityData: never[] = []

