import { Shift } from "@/types/shift-types"

export function validateShiftOverlap(
  shifts: Shift[],
  newShift: Shift,
  editingId?: string
) {
  const toMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number)
    return h * 60 + m
  }

  const newStart = toMinutes(newShift.from)
  const newEnd = toMinutes(newShift.to)

  for (const shift of shifts) {
    if (editingId && shift.id === editingId) continue

    const start = toMinutes(shift.from)
    const end = toMinutes(shift.to)

    if (newStart < end && newEnd > start) {
      return false
    }
  }

  return true
}