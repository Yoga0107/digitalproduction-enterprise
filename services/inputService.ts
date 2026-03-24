/**
 * services/inputService.ts
 * ─────────────────────────
 * Semua API call untuk input data transaksional OEE.
 * Base URL: /api/v1/input/...
 */

import { api, apiRequest } from '@/lib/api-client'
import { ApiProductionOutput, ApiMachineLossInput } from '@/types/api'
import { API_BASE_URL } from '@/lib/api-config'

// ─── helpers ──────────────────────────────────────────────────────────────────

function _getToken(): string {
  return typeof window !== 'undefined' ? (localStorage.getItem('token') ?? '') : ''
}
function _getPlantId(): string {
  return typeof window !== 'undefined' ? (localStorage.getItem('active_plant_id') ?? '') : ''
}

async function _downloadBlob(url: string, fallbackName: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      Authorization: `Bearer ${_getToken()}`,
      'X-Plant-ID': _getPlantId(),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail ?? 'Export gagal')
  }
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  const cd = res.headers.get('content-disposition') ?? ''
  const match = cd.match(/filename="(.+)"/)
  a.download = match ? match[1] : fallbackName
  a.click()
  URL.revokeObjectURL(objectUrl)
}

async function _uploadFile(url: string, file: File): Promise<{
  imported: number
  errors: { row: number; errors: string[] }[]
  message: string
}> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_BASE_URL}${url}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${_getToken()}`,
      'X-Plant-ID': _getPlantId(),
    },
    body: form,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail ?? 'Import gagal')
  return data
}

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
    date: string; line_id: number; shift_id: number
    feed_code_id: number | null; production_plan: number | null
    finished_goods: number; downgraded_product: number
    wip: number; remix: number; reject_product: number; remarks: string
  }>
) => api.put<ApiProductionOutput>(`/api/v1/input/production-outputs/${id}`, data)

export const deleteProductionOutput = (id: number) =>
  api.delete(`/api/v1/input/production-outputs/${id}`)

/** Export Production Outputs — roles: administrator, plant_manager, operator */
export const downloadProductionOutputsExcel = (
  params?: { date_from?: string; date_to?: string; line_id?: number; shift_id?: number }
) => {
  const q = new URLSearchParams()
  if (params?.date_from) q.set('date_from', params.date_from)
  if (params?.date_to)   q.set('date_to',   params.date_to)
  if (params?.line_id)   q.set('line_id',   String(params.line_id))
  if (params?.shift_id)  q.set('shift_id',  String(params.shift_id))
  const qs = q.toString()
  return _downloadBlob(
    `/api/v1/input/production-outputs/export${qs ? '?' + qs : ''}`,
    `production_output_${Date.now()}.xlsx`
  )
}

/** Import Production Outputs — roles: administrator, plant_manager only */
export const importProductionOutputsExcel = (file: File) =>
  _uploadFile('/api/v1/input/production-outputs/import', file)

// ─── Machine Loss Inputs ──────────────────────────────────────────────────────

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
  date: string; line_id: number; shift_id: number
  feed_code_id?: number | null
  loss_l1_id?: number | null; loss_l2_id?: number | null; loss_l3_id?: number | null
  time_from?: string | null; time_to?: string | null
  duration_minutes: number; remarks?: string
}) => api.post<ApiMachineLossInput>('/api/v1/input/machine-loss-inputs', data)

export const updateMachineLossInput = (id: number, data: Partial<{
  date: string; line_id: number; shift_id: number
  feed_code_id: number | null
  loss_l1_id: number | null; loss_l2_id: number | null; loss_l3_id: number | null
  time_from: string | null; time_to: string | null
  duration_minutes: number; remarks: string
}>) => api.put<ApiMachineLossInput>(`/api/v1/input/machine-loss-inputs/${id}`, data)

export const deleteMachineLossInput = (id: number) =>
  api.delete(`/api/v1/input/machine-loss-inputs/${id}`)

/** Export Machine Loss Inputs — roles: administrator, plant_manager, operator */
export const downloadMachineLossExcel = (
  params?: { date_from?: string; date_to?: string; line_id?: number; shift_id?: number }
) => {
  const q = new URLSearchParams()
  if (params?.date_from) q.set('date_from', params.date_from)
  if (params?.date_to)   q.set('date_to',   params.date_to)
  if (params?.line_id)   q.set('line_id',   String(params.line_id))
  if (params?.shift_id)  q.set('shift_id',  String(params.shift_id))
  const qs = q.toString()
  return _downloadBlob(
    `/api/v1/input/machine-loss-inputs/export${qs ? '?' + qs : ''}`,
    `machine_loss_${Date.now()}.xlsx`
  )
}

/** Import Machine Loss Inputs — roles: administrator, plant_manager only */
export const importMachineLossExcel = (file: File) =>
  _uploadFile('/api/v1/input/machine-loss-inputs/import', file)
