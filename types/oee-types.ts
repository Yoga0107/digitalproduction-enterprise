/**
 * types/oee-types.ts
 * ──────────────────
 * Unified types untuk semua 5 metrik OEE.
 * Satu endpoint /time-metrics melayani semuanya sekaligus.
 */

// ─── Detail per line (semua field dari engine) ────────────────────────────────
export interface OeeLineDetail {
  name:          string
  // Loading & Operating Time
  total_h:       number
  sched_loss_h:  number
  op_loss_h:     number
  loading_h:     number
  operating_h:   number
  // Rates
  availability:  number | null   // %
  performance:   number | null   // %
  quality:       number | null   // %
  // Production
  actual_output: number
  good_product:  number
  ideal_output:  number
}

// ─── Aggregate all_line ───────────────────────────────────────────────────────
export interface OeeAllLine {
  total_h:       number
  loading_h:     number
  operating_h:   number
  availability:  number | null
  actual_output: number
  good_product:  number
  ideal_output:  number
  performance:   number | null
  quality:       number | null
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

export interface AvailabilityLineView {
  operating_h: number | null
  loading_h: number | null
  rate: number | null
}

export interface AvailabilityRow {
  date: string
  lines: Record<number, AvailabilityLineView | undefined>
  all_line: number | null
}