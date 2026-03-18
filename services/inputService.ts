/**
 * services/inputService.ts
 * ─────────────────────────
 * Semua API call untuk input data transaksional OEE.
 * Base URL: /api/v1/input/...
 */

import { api } from '@/lib/api-client'
import { ApiProductionOutput } from '@/types/api'

// ─── Production Outputs ───────────────────────────────────────────────────────

export const getProductionOutputs = (params?: {
  date_from?: string
  date_to?: string
  line_id?: number
  shift_id?: number
}) => {
  const q = new URLSearchParams()
  if (params?.date_from) q.set('date_from', params.date_from)
  if (params?.date_to)   q.set('date_to',   params.date_to)
  if (params?.line_id)   q.set('line_id',   String(params.line_id))
  if (params?.shift_id)  q.set('shift_id',  String(params.shift_id))
  const qs = q.toString()
  return api.get<ApiProductionOutput[]>(
    `/api/v1/input/production-outputs${qs ? '?' + qs : ''}`
  )
}

export const createProductionOutput = (data: {
  date: string
  line_id: number
  shift_id: number
  feed_code_id?: number | null
  production_plan?: number | null
  actual_output: number
  good_product: number
  remarks?: string
}) => api.post<ApiProductionOutput>('/api/v1/input/production-outputs', data)

export const updateProductionOutput = (
  id: number,
  data: Partial<{
    date: string
    line_id: number
    shift_id: number
    feed_code_id: number | null
    production_plan: number | null
    actual_output: number
    good_product: number
    remarks: string
  }>
) => api.put<ApiProductionOutput>(`/api/v1/input/production-outputs/${id}`, data)

export const deleteProductionOutput = (id: number) =>
  api.delete(`/api/v1/input/production-outputs/${id}`)
