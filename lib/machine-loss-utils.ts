/**
 * lib/machine-loss-utils.ts
 * Shared helpers for machine loss input.
 */

/** Compute duration in hours from HH:MM strings. Returns 0 if invalid or negative. */
export function calcDurationHours(from: string, to: string): number {
  if (!from || !to) return 0
  const [fh, fm] = from.split(':').map(Number)
  const [th, tm] = to.split(':').map(Number)
  const diffMinutes = (th * 60 + tm) - (fh * 60 + fm)
  return diffMinutes > 0 ? parseFloat((diffMinutes / 60).toFixed(4)) : 0
}

/**
 * Format nilai duration_minutes dari DB menjadi string jam.
 * Input selalu dalam MENIT (duration_minutes di DB).
 *
 * Contoh:
 *   30   → "0.5 hr"
 *   90   → "1.5 hr"
 *   60   → "1 hr"
 *   135  → "2.25 hr"
 *   0    → "—"
 */
export function fmtMinutes(value: number): string {
  if (!value || value <= 0) return '—'
  const hrs = value / 60
  const rounded = parseFloat(hrs.toFixed(2))
  return `${rounded} hr`
}

/** @deprecated Gunakan fmtMinutes() */
export function fmtHours(minutes: number): string {
  return fmtMinutes(minutes)
}

/** Format ISO date string to readable date. */
export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}
