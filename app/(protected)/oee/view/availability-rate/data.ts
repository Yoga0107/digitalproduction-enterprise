/**
 * DEPRECATED — data statis digantikan oleh API call ke backend.
 * File ini dipertahankan agar tidak ada import yang broken.
 * Gunakan getAvailabilityRate() dari services/oeeService.ts.
 */

// AvailabilityRow adalah alias dari OeeRow (unified type)
export type { OeeRow as AvailabilityRow } from "@/types/oee-types"

/** @deprecated Gunakan getAvailabilityRate() dari services/oeeService.ts */
export const availabilityData: never[] = []