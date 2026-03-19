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
 * Format hours into a readable string.
 * Examples: 0.5 → "30m"  |  1.5 → "1h 30m"  |  2.0 → "2h"
 */
export function fmtHours(hours: number): string {
  if (!hours || hours <= 0) return '—'
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0)          return `${h}h`
  return `${m}m`
}

/** Format ISO date string to readable date. */
export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}
