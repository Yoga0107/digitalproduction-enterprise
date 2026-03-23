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
  finished_goods: number
  downgraded_product: number
  wip: number
  remix: number
  reject_product: number
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
    finished_goods: number
    downgraded_product: number
    wip: number
    remix: number
    reject_product: number
    remarks: string
  }>
) => api.put<ApiProductionOutput>(`/api/v1/input/production-outputs/${id}`, data)

export const deleteProductionOutput = (id: number) =>
  api.delete(`/api/v1/input/production-outputs/${id}`)

// ─── Machine Loss Inputs ──────────────────────────────────────────────────────

import { ApiMachineLossInput } from '@/types/api'

export const getMachineLossInputs = (params?: {
  date_from?: string; date_to?: string; line_id?: number; shift_id?: number
}) => {
  const q = new URLSearchParams()
  if (params?.date_from) q.set('date_from', params.date_from)
  if (params?.date_to)   q.set('date_to',   params.date_to)
  if (params?.line_id)   q.set('line_id',   String(params.line_id))
  if (params?.shift_id)  q.set('shift_id',  String(params.shift_id))
  const qs = q.toString()
  return api.get<ApiMachineLossInput[]>(
    `/api/v1/input/machine-loss-inputs${qs ? '?' + qs : ''}`
  )
}

export const createMachineLossInput = (data: {
  date: string; line_id: number; shift_id: number;
  feed_code_id?: number | null;
  loss_l1_id?: number | null; loss_l2_id?: number | null; loss_l3_id?: number | null;
  time_from?: string | null; time_to?: string | null;
  duration_minutes: number; remarks?: string
}) => api.post<ApiMachineLossInput>('/api/v1/input/machine-loss-inputs', data)

export const updateMachineLossInput = (id: number, data: Partial<{
  date: string; line_id: number; shift_id: number;
  feed_code_id: number | null;
  loss_l1_id: number | null; loss_l2_id: number | null; loss_l3_id: number | null;
  time_from: string | null; time_to: string | null;
  duration_minutes: number; remarks: string
}>) => api.put<ApiMachineLossInput>(`/api/v1/input/machine-loss-inputs/${id}`, data)

export const deleteMachineLossInput = (id: number) =>
  api.delete(`/api/v1/input/machine-loss-inputs/${id}`)
