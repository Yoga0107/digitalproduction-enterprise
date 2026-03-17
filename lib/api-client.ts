/**
 * lib/api-client.ts
 * HTTP client — auto-inject Authorization + X-Plant-ID.
 * Base URL diambil dari NEXT_PUBLIC_API_URL via api-config.ts
 */

import { API_BASE_URL, ENDPOINTS } from "./api-config";




export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
    public errors?: { field: string; message: string }[]
  ) {
    super(detail)
    this.name = 'ApiError'
  }
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('refresh_token')
}

function getStoredPlantId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('active_plant_id')
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken()
  if (!refreshToken) return null
  try {
    const res = await fetch(ENDPOINTS.AUTH.REFRESH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) return null
    const data = await res.json()
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    return data.access_token
  } catch {
    return null
  }
}

interface RequestOptions extends RequestInit {
  withPlant?: boolean
  _retry?: boolean
}

export async function apiRequest<T = unknown>(
  urlOrPath: string,
  options: RequestOptions = {}
): Promise<T> {
  const { withPlant = true, _retry = false, ...fetchOptions } = options

  // Kalau sudah full URL (dari ENDPOINTS), pakai langsung. Kalau path, prepend base.
  const url = urlOrPath.startsWith('http') ? urlOrPath : `${API_BASE_URL}${urlOrPath}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  }

  const token = getStoredToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  if (withPlant) {
    const plantId = getStoredPlantId()
    if (plantId) headers['X-Plant-ID'] = plantId
  }

  const response = await fetch(url, { ...fetchOptions, headers })

  if (response.status === 401 && !_retry) {
    const newToken = await refreshAccessToken()
    if (newToken) return apiRequest<T>(urlOrPath, { ...options, _retry: true })
    if (typeof window !== 'undefined') {
      localStorage.clear()
      window.location.href = '/login'
    }
    throw new ApiError(401, 'Sesi habis, silakan login ulang')
  }

  if (response.status === 204) return undefined as T

  const json = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new ApiError(response.status, json.detail ?? 'Terjadi kesalahan', json.errors)
  }
  return json as T
}

export const api = {
  get:    <T>(url: string, opts?: RequestOptions) =>
    apiRequest<T>(url, { method: 'GET', ...opts }),
  post:   <T>(url: string, body: unknown, opts?: RequestOptions) =>
    apiRequest<T>(url, { method: 'POST', body: JSON.stringify(body), ...opts }),
  patch:  <T>(url: string, body: unknown, opts?: RequestOptions) =>
    apiRequest<T>(url, { method: 'PATCH', body: JSON.stringify(body), ...opts }),
  put:    <T>(url: string, body: unknown, opts?: RequestOptions) =>
    apiRequest<T>(url, { method: 'PUT', body: JSON.stringify(body), ...opts }),
  delete: <T>(url: string, opts?: RequestOptions) =>
    apiRequest<T>(url, { method: 'DELETE', ...opts }),
}
