import { KodePakan } from "@/types/kode-pakan-types"

export function validateKodePakanUnique(
  data: KodePakan[],
  kode: string,
  editingId?: string
) {
  return !data.some(
    (item) =>
      item.kode.toLowerCase() === kode.toLowerCase() &&
      item.id !== editingId
  )
}