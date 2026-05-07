/**
 * types/oee-types.ts
 * ──────────────────
 * Unified types untuk semua 5 metrik OEE.
 * Satu endpoint /time-metrics melayani semuanya sekaligus.
 */

export interface LossBreakdownItem {
  l1:    string
  l2:    string
  l3:    string
  hours: number
}

export interface ShiftDetail {
  shift_name:        string
  total_h:           number
  sched_loss_h:      number
  loading_h:         number
  op_loss_h:         number
  operating_h:       number
  sched_breakdown:   LossBreakdownItem[]
  op_breakdown:      LossBreakdownItem[]
}

export interface OeeLineDetail {
  name:              string
  shifts:            Record<number, ShiftDetail>
  total_h:           number
  sched_loss_h:      number
  op_loss_h:         number
  loading_h:         number
  operating_h:       number
  availability:      number | null
  performance:       number | null
  quality:           number | null
  oee:               number | null
  actual_output:     number
  good_product:      number
  std_throughput:    number
  actual_throughput: number
  sched_breakdown:   LossBreakdownItem[]
  op_breakdown:      LossBreakdownItem[]
}

export interface OeeAllLine {
  shifts:            Record<number, ShiftDetail>
  total_h:           number
  sched_loss_h:      number
  op_loss_h:         number
  loading_h:         number
  operating_h:       number
  availability:      number | null
  actual_output:     number
  good_product:      number
  performance:       number | null
  quality:           number | null
  oee:               number | null
  sched_breakdown:   LossBreakdownItem[]
  op_breakdown:      LossBreakdownItem[]
}

// ─── Satu baris (per tanggal / per bulan) ────────────────────────────────────
export interface OeeRow {
  date:     string
  lines:    Record<number, OeeLineDetail>
  all_line: OeeAllLine
}

// ─── Response & Params ────────────────────────────────────────────────────────
export interface OeeTimeMetricsResponse {
  data:      OeeRow[]
  date_from: string
  date_to:   string
  group_by:  "daily" | "monthly"
}

export interface OeeParams {
  date_from: string
  date_to:   string
  group_by?: "daily" | "monthly"
  line_ids?: number[]
}
