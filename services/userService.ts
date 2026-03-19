/**
 * services/userService.ts
 * Admin-only user management API calls.
 */

import { api } from '@/lib/api-client'
import { ApiUser, ApiPlant } from '@/types/api'

export interface ApiRole {
  id: number
  name: string
  description: string | null
}

// ─── Users ────────────────────────────────────────────────────────────────────

export const listUsers = () =>
  api.get<ApiUser[]>('/api/v1/users/', { withPlant: false })

export const createUser = (data: {
  username: string
  email: string
  full_name: string
  password: string
  role_id: number
  plant_ids: number[]
}) => api.post<ApiUser>('/api/v1/users/', data, { withPlant: false })

export const updateUser = (id: number, data: Partial<{
  full_name: string
  email: string
  role_id: number
  is_active: boolean
  plant_ids: number[]
}>) => api.put<ApiUser>(`/api/v1/users/${id}`, data, { withPlant: false })

export const deactivateUser = (id: number) =>
  api.delete(`/api/v1/users/${id}`, { withPlant: false })

// ─── Roles ────────────────────────────────────────────────────────────────────

export const listRoles = () =>
  api.get<ApiRole[]>('/api/v1/auth/roles', { withPlant: false })

// ─── Plants ───────────────────────────────────────────────────────────────────

export const listPlants = () =>
  api.get<ApiPlant[]>('/api/v1/plants/', { withPlant: false })
