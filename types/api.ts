export interface ApiRole { id: number; name: string }

export interface ApiUser {
  id: number; username: string; email: string;
  full_name: string; role: ApiRole; is_active: boolean;
  is_superuser: boolean; must_change_password: boolean; created_at: string;
  plant_ids: number[];
}

export interface ApiPlant {
  id: number; name: string; code: string;
  schema_name: string; description: string | null;
  is_active: boolean; created_at: string;
}

export interface ApiToken { access_token: string; token_type: string }
export interface LoginResponse { access_token: string; token_type: string; user: ApiUser }
export interface RegisterResponse { message: string; user: ApiUser }

// ─── Machine Losses (tabel self-referencing, sumber kebenaran untuk master page) ─
// Tabel ini disync dari loss_level_1/2/3 via trigger/manual
export interface ApiMachineLoss {
  id: number;
  parent_id: number | null;
  level: 1 | 2 | 3;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  created_by_id: number | null;
}

// ─── Loss Level Master Tables (tabel input terpisah per level) ────────────
export interface ApiLossLevel1 {
  id: number; name: string; description: string | null;
  sort_order: number; is_active: boolean;
  created_at: string; created_by_id: number | null;
}

export interface ApiLossLevel2 {
  id: number; level_1_id: number; name: string; description: string | null;
  sort_order: number; is_active: boolean;
  created_at: string; created_by_id: number | null;
}

export interface ApiLossLevel3 {
  id: number; level_2_id: number; name: string; description: string | null;
  sort_order: number; is_active: boolean;
  created_at: string; created_by_id: number | null;
}

// ─── Master Data ──────────────────────────────────────────────────────────
export interface ApiShift {
  id: number; name: string;
  time_from: string; time_to: string;
  remarks: string | null; is_active: boolean;
  created_at: string; created_by_id: number | null;
}

export interface ApiFeedCode {
  id: number; code: string;
  remarks: string | null; is_active: boolean;
  created_at: string; created_by_id: number | null;
}

export interface ApiLine {
  id: number; plant_id: number; name: string;
  code: string | null; remarks: string | null;
  is_active: boolean; created_at: string; created_by_id: number | null;
}

export interface ApiStandardThroughput {
  id: number; line_id: number; feed_code_id: number;
  standard_throughput: number; remarks: string | null;
  created_at: string; created_by_id: number | null;
}

export interface ApiProductionOutput {
  id: number
  date: string
  line_id: number
  shift_id: number
  feed_code_id: number | null
  production_plan: number | null
  // 5 input fields
  finished_goods: number
  downgraded_product: number
  wip: number
  remix: number
  reject_product: number
  // computed
  actual_output: number
  good_product: number
  quality_rate: number
  remarks: string | null
  is_active: boolean
  created_at: string
  created_by_id: number | null
  // embedded names
  line_name: string | null
  shift_name: string | null
  feed_code_code: string | null
}

export interface ApiMachineLossInput {
  id: number
  date: string
  line_id: number
  shift_id: number
  feed_code_id: number | null
  loss_l1_id: number | null
  loss_l2_id: number | null
  loss_l3_id: number | null
  time_from: string | null
  time_to: string | null
  duration_minutes: number
  remarks: string | null
  is_active: boolean
  created_at: string
  created_by_id: number | null
  // denormalised
  line_name: string | null
  shift_name: string | null
  feed_code_code: string | null
  loss_l1_name: string | null
  loss_l2_name: string | null
  loss_l3_name: string | null
}

export interface ApiMergedLineMember {
  line_id: number
  line_name: string
  line_code: string | null
}

export interface ApiMergedLine {
  id: number
  name: string
  code: string | null
  remarks: string | null
  is_active: boolean
  created_at: string
  created_by_id: number | null
  members: ApiMergedLineMember[]
}
