export interface ApiRole { id: number; name: string }

export interface ApiUserModulePermissions {
  user_id: number
  modules: string[]          // e.g. ['dashboard', 'oee', 'settings']
  use_role_default: boolean  // true = no custom overrides set
}

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

export interface LoginToken {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface LoginResponse {
  token: LoginToken
  user: ApiUser
  accessible_plants: ApiPlant[]
}

export interface RegisterResponse { message: string; user: ApiUser }

// ─── Machine Loss Level Tables (4-table ERD) ──────────────────────────────
// NOTE: Backend menggunakan field ID khusus, bukan `id` generic.
// Lvl1, Lvl2, Lvl3 adalah tabel FLAT — tidak ada FK antar level.
// Hierarki dikelola di tabel master_machine_losses (katalog kombinasi).

export interface ApiMachineLossLvl1 {
  machine_losses_lvl_1_id: number;  // PK dari backend
  name: string;
}

export interface ApiMachineLossLvl2 {
  machine_losses_lvl_2_id: number;  // PK dari backend
  name: string;
}

export interface ApiMachineLossLvl3 {
  machine_losses_lvl_3_id: number;  // PK dari backend
  name: string;
}

export interface ApiMasterMachineLoss {
  machine_losses_id: number;              // PK dari backend
  machine_losses_lvl_1_id: number;
  machine_losses_lvl_2_id: number | null;
  machine_losses_lvl_3_id: number | null;
  remarks: string | null;
  is_active: boolean;
  created_at: string;
  created_by_id: number | null;
  // denormalized names
  lvl1_name: string | null;
  lvl2_name: string | null;
  lvl3_name: string | null;
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

export interface ApiOutputType {
  id: number
  code: string
  name: string
  category: string
  is_good_product: boolean
  sort_order: number
  remarks: string | null
  is_active: boolean
  created_at: string
  created_by_id: number | null
}

export interface ApiProductionOutputItem {
  item_id:         number
  group_id:        string
  date:            string
  line_id:         number
  line_name:       string | null
  shift_id:        number
  shift_name:      string | null
  feed_code_id:    number | null
  feed_code_code:  string | null
  output_type:     string
  category:        string
  quantity:        number
  remarks:         string | null
}

export interface ApiProductionOutput {
  /** group_id (UUID string) — ties N rows together; used for edit/delete */
  id: string
  date: string
  line_id: number
  shift_id: number
  feed_code_id: number | null
  production_plan: number | null
  // quantities dinamis per output_type {code: quantity}
  quantities: Record<string, number>
  // computed
  actual_output: number
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