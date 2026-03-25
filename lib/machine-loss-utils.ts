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
 * Format minutes into decimal hours string.
 * Examples: 90 min → "1.5 hr"  |  37 min → "0.617 hr"  |  60 min → "1 hr"  |  0 → "—"
 * Input is always in MINUTES (as stored in DB as duration_minutes).
 */
export function fmtHours(minutes: number): string {
  if (!minutes || minutes <= 0) return '—'
  const hrs = minutes / 60
  // If exactly a whole number, show without decimals
  if (Number.isInteger(hrs)) return `${hrs} hr`
  // Round to 3 significant decimal places, strip trailing zeros
  const rounded = parseFloat(hrs.toFixed(3))
  return `${rounded} hr`
}

/** Format ISO date string to readable date. */
export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}
