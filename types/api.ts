// ─── Auth ──────────────────────────────────────────────────────────────────
export interface ApiRole { id: number; name: string }

export interface ApiUser {
  id: number; username: string; email: string;
  full_name: string | null; role: ApiRole;
  is_active: boolean; is_superuser: boolean; created_at: string;
}

export interface ApiPlant {
  id: number; name: string; code: string;
  schema_name: string; is_active: boolean;
  description?: string | null; created_at?: string;
}

export interface ApiToken {
  access_token: string; refresh_token: string;
  token_type: string; expires_in: number;
}

export interface LoginResponse {
  token: ApiToken; user: ApiUser; accessible_plants: ApiPlant[];
}

export interface RegisterResponse { message: string; user: ApiUser }

// ─── Machine Loss (unified) ────────────────────────────────────────────────
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

// ─── Master Data ──────────────────────────────────────────────────────────
export interface ApiShift {
  id: number; name: string;
  time_from: string; time_to: string;
  remarks: string | null; is_active: boolean;
  created_at: string; created_by_id: number | null;
}

export interface ApiFeedCode {
  id: number; code: string; remarks: string | null;
  is_active: boolean; created_at: string; created_by_id: number | null;
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
