/**
 * services/equipmentService.ts
 * API calls untuk Master Equipment Tree.
 */

import { api } from '@/lib/api-client'
import { API_BASE_URL } from '@/lib/api-config'
import {
  ApiEquipmentTree, EquipmentStats,
  EquipmentCreatePayload, EquipmentUpdatePayload,
  EquipmentPaginatedResponse,
} from '@/types/equipment-types'

const BASE = '/api/v1/equipment'

function _token()   { return typeof window !== 'undefined' ? (localStorage.getItem('token') ?? '') : '' }
function _plantId() { return typeof window !== 'undefined' ? (localStorage.getItem('active_plant_id') ?? '') : '' }

async function _downloadBlob(url: string, name: string) {
  const res = await fetch(`${API_BASE_URL}${url}`, {
    headers: { Authorization: `Bearer ${_token()}`, 'X-Plant-ID': _plantId() },
  })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail ?? 'Export gagal')
  const blob = await res.blob()
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}

async function _uploadFile(url: string, file: File) {
  const form = new FormData(); form.append('file', file)
  const res = await fetch(`${API_BASE_URL}${url}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${_token()}`, 'X-Plant-ID': _plantId() },
    body: form,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail ?? 'Import gagal')
  return data
}

// ─── Params type (shared) ─────────────────────────────────────────────────────
export interface EquipmentFilterParams {
  sistem?:       string
  sub_sistem?:   string
  unit_mesin?:   string
  bagian_mesin?: string
  is_verified?:  boolean
  search?:       string
}

// ─── Server-side paginated (TABLE VIEW) ───────────────────────────────────────
// Fetch hanya data yang dibutuhkan per halaman — tidak load semua ke memori.

export const getEquipmentPaginated = (
  params: EquipmentFilterParams & { page: number; page_size: number }
) => {
  const q = new URLSearchParams()
  if (params.sistem)       q.set('sistem',       params.sistem)
  if (params.sub_sistem)   q.set('sub_sistem',   params.sub_sistem)
  if (params.unit_mesin)   q.set('unit_mesin',   params.unit_mesin)
  if (params.bagian_mesin) q.set('bagian_mesin', params.bagian_mesin)
  if (params.is_verified !== undefined) q.set('is_verified', String(params.is_verified))
  if (params.search)       q.set('search',       params.search)
  q.set('page',      String(params.page))
  q.set('page_size', String(params.page_size))
  return api.get<EquipmentPaginatedResponse>(`${BASE}/paginated?${q.toString()}`)
}

// ─── Full list (TREE VIEW — load semua, dengan filter & limit) ────────────────

export const getEquipment = (params?: EquipmentFilterParams & { skip?: number; limit?: number }) => {
  const q = new URLSearchParams()
  if (params?.sistem)       q.set('sistem',       params.sistem)
  if (params?.sub_sistem)   q.set('sub_sistem',   params.sub_sistem)
  if (params?.unit_mesin)   q.set('unit_mesin',   params.unit_mesin)
  if (params?.bagian_mesin) q.set('bagian_mesin', params.bagian_mesin)
  if (params?.is_verified !== undefined) q.set('is_verified', String(params.is_verified))
  if (params?.search)       q.set('search',       params.search)
  if (params?.skip  != null) q.set('skip',        String(params.skip))
  if (params?.limit != null) q.set('limit',       String(params.limit))
  const qs = q.toString()
  return api.get<ApiEquipmentTree[]>(`${BASE}${qs ? '?' + qs : ''}`)
}

export const getEquipmentStats = () =>
  api.get<EquipmentStats>(`${BASE}/stats`)

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export const createEquipment = (data: EquipmentCreatePayload) =>
  api.post<ApiEquipmentTree>(BASE, data)

export const updateEquipment = (id: number, data: EquipmentUpdatePayload) =>
  api.put<ApiEquipmentTree>(`${BASE}/${id}`, data)

export const deleteEquipment = (id: number) =>
  api.delete(`${BASE}/${id}`)

// ─── Verifikasi ───────────────────────────────────────────────────────────────

export const verifyEquipment   = (id: number) => api.post<ApiEquipmentTree>(`${BASE}/${id}/verify`, {})
export const unverifyEquipment = (id: number) => api.post<ApiEquipmentTree>(`${BASE}/${id}/unverify`, {})
export const verifyBulk = (ids: number[], action: 'verify' | 'unverify') =>
  api.post<{ updated: number; action: string }>(`${BASE}/verify-bulk`, { ids, action })

// ─── Import / Export ─────────────────────────────────────────────────────────

export const exportEquipment = (isVerified?: boolean) =>
  _downloadBlob(
    `${BASE}/export${isVerified !== undefined ? `?is_verified=${isVerified}` : ''}`,
    `equipment_tree_${Date.now()}.xlsx`,
  )

export const importEquipment = (file: File) => _uploadFile(`${BASE}/import`, file)
