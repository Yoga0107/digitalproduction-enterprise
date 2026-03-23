import { api } from '@/lib/api-client'
import { ApiPlant } from '@/types/api'

export const listAllPlants = () =>
  api.get<ApiPlant[]>('/api/v1/plants/', { withPlant: false })

export const createPlant = (data: {
  name: string
  code: string
  description?: string | null
}) => api.post<ApiPlant>('/api/v1/plants/', data, { withPlant: false })

export const updatePlant = (id: number, data: {
  name: string
  code: string
  description?: string | null
}) => api.patch<ApiPlant>(`/api/v1/plants/${id}`, data, { withPlant: false })

export const togglePlantActive = (id: number) =>
  api.patch<ApiPlant>(`/api/v1/plants/${id}/toggle-active`, {}, { withPlant: false })

export const migratePlantSchema = (id: number) =>
  api.post<{ message: string }>(`/api/v1/plants/${id}/migrate-schema`, {}, { withPlant: false })
