/**
 * types/equipment-types.ts
 * Tipe untuk Master Equipment Tree.
 */

export interface ApiEquipmentTree {
  id:             number
  sistem:         string
  sub_sistem:     string | null
  unit_mesin:     string | null
  bagian_mesin:   string | null
  spare_part:     string | null
  spesifikasi:    string | null
  sku:            string | null
  bu:             string | null
  is_verified:    boolean
  verified_by_id: number | null
  verified_at:    string | null
  remarks:        string | null
  is_active:      boolean
  created_at:     string
  created_by_id:  number | null
  updated_at:     string
}

export interface EquipmentStats {
  total:      number
  verified:   number
  unverified: number
  by_sistem:  { sistem: string; count: number }[]
}

export interface EquipmentCreatePayload {
  sistem:       string
  sub_sistem?:  string | null
  unit_mesin?:  string | null
  bagian_mesin?: string | null
  spare_part?:  string | null
  spesifikasi?: string | null
  sku?:         string | null
  bu?:          string | null
  remarks?:     string | null
}

export type EquipmentUpdatePayload = Partial<EquipmentCreatePayload & { is_active: boolean }>

// Untuk tree view UI
export interface EquipmentNode {
  key:      string
  label:    string
  level:    "sistem" | "sub_sistem" | "unit_mesin" | "bagian_mesin" | "spare_part"
  children: EquipmentNode[]
  rows:     ApiEquipmentTree[]   // raw rows di level ini
  verified: number
  total:    number
}
