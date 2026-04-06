/**
 * services/oeeService.ts
 * ───────────────────────
 * Satu fungsi utama getTimeMetrics() yang hit /time-metrics.
 * Loading Time, Operating Time, Availability Rate semua dari
 * satu API call — tidak ada query duplikat ke backend.
 */

import { api } from '@/lib/api-client'
import { OeeParams, OeeTimeMetricsResponse } from '@/types/oee-types'

/**
 * Ambil semua metrik OEE (Loading, Operating, Availability) sekaligus.
 * Backend hanya query DB sekali untuk ketiga metrik.
 */
export const getTimeMetrics = (params: OeeParams): Promise<OeeTimeMetricsResponse> => {
  const q = new URLSearchParams()
  q.set('date_from', params.date_from)
  q.set('date_to',   params.date_to)
  q.set('group_by',  params.group_by ?? 'daily')
  if (params.line_ids?.length) {
    q.set('line_ids', params.line_ids.join(','))
  }
  return api.get<OeeTimeMetricsResponse>(`/api/v1/oee/time-metrics?${q.toString()}`)
}
