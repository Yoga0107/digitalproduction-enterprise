/**
 * lib/api-config.ts
 * ─────────────────────────────────────────────────────
 * SATU tempat untuk semua endpoint URL.
 * Ubah base URL cukup dari .env.local: NEXT_PUBLIC_API_URL
 *
 * Cara pakai:
 *   import { ENDPOINTS } from '@/lib/api-config'
 *   api.get(ENDPOINTS.SHIFTS)
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
const V1   = `${BASE}/api/v1`

export const API_BASE_URL = BASE

export const ENDPOINTS = {
  // ── Auth ────────────────────────────────────────────
  AUTH: {
    LOGIN:           `${V1}/auth/login`,
    REGISTER:        `${V1}/auth/register`,
    LOGOUT:          `${V1}/auth/logout`,
    REFRESH:         `${V1}/auth/refresh`,
    ME:              `${V1}/auth/me`,
    ME_PLANTS:       `${V1}/auth/me/plants`,
    CHANGE_PASSWORD: `${V1}/auth/me/change-password`,
  },

  // ── Plants ──────────────────────────────────────────
  PLANTS: {
    LIST:            `${V1}/plants`,
    CREATE:          `${V1}/plants`,
    BY_ID:           (id: number) => `${V1}/plants/${id}`,
    MIGRATE:         (id: number) => `${V1}/plants/${id}/migrate-schema`,
  },

  // ── Users ───────────────────────────────────────────
  USERS: {
    LIST:            `${V1}/users`,
    CREATE:          `${V1}/users`,
    BY_ID:           (id: number) => `${V1}/users/${id}`,
    RESET_PASSWORD:  (id: number) => `${V1}/users/${id}/reset-password`,
  },

  // ── Master Data ─────────────────────────────────────
  MASTER: {
    // Loss Levels (sumber data)
    LOSS_L1:         `${V1}/master/loss-level-1`,
    LOSS_L1_BY_ID:   (id: number) => `${V1}/master/loss-level-1/${id}`,

    LOSS_L2:         `${V1}/master/loss-level-2`,
    LOSS_L2_BY_ID:   (id: number) => `${V1}/master/loss-level-2/${id}`,

    LOSS_L3:         `${V1}/master/loss-level-3`,
    LOSS_L3_BY_ID:   (id: number) => `${V1}/master/loss-level-3/${id}`,

    // Machine Loss Summary (denormalized, read + sync)
    LOSS_SUMMARY:        `${V1}/master/machine-loss-summary`,
    LOSS_SUMMARY_SYNC:   `${V1}/master/machine-loss-summary/sync`,

    // Shifts
    SHIFTS:          `${V1}/master/shifts`,
    SHIFT_BY_ID:     (id: number) => `${V1}/master/shifts/${id}`,

    // Feed Codes
    FEED_CODES:      `${V1}/master/feed-codes`,
    FEED_CODE_BY_ID: (id: number) => `${V1}/master/feed-codes/${id}`,

    // Lines
    LINES:           `${V1}/master/lines`,
    LINE_BY_ID:      (id: number) => `${V1}/master/lines/${id}`,

    // Standard Throughputs
    THROUGHPUTS:     `${V1}/master/standard-throughputs`,
    THROUGHPUT_BY_ID:(id: number) => `${V1}/master/standard-throughputs/${id}`,
  },
} as const
