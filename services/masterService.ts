/**
 * services/masterService.ts
 * Semua master data API calls — unified machine_losses endpoint.
 */

import { api } from '@/lib/api-client';
import type {
  ApiShift, ApiFeedCode, ApiLine, ApiStandardThroughput, ApiMachineLoss,
} from '@/types/api';

// ─── Machine Losses (unified) ──────────────────────────────────────────────
export const getMachineLosses = () =>
  api.get<ApiMachineLoss[]>('/api/v1/master/machine-losses');

export const createMachineLoss = (data: {
  parent_id?: number | null;
  level: number;
  name: string;
  description?: string;
  sort_order?: number;
}) => api.post<ApiMachineLoss>('/api/v1/master/machine-losses', data);

export const updateMachineLoss = (id: number, data: Partial<{
  name: string;
  description: string;
  is_active: boolean;
  sort_order: number;
}>) => api.put<ApiMachineLoss>(`/api/v1/master/machine-losses/${id}`, data);

export const moveMachineLoss = (id: number, data: {
  new_parent_id: number | null;
  new_level: number;
  new_sort_order: number;
}) => api.patch<ApiMachineLoss>(`/api/v1/master/machine-losses/${id}/move`, data);

export const deleteMachineLoss = (id: number) =>
  api.delete(`/api/v1/master/machine-losses/${id}`);

// ─── Shifts ────────────────────────────────────────────────────────────────
export const getShifts = () => api.get<ApiShift[]>('/api/v1/master/shifts');

export const createShift = (data: { name: string; time_from: string; time_to: string; remarks?: string }) =>
  api.post<ApiShift>('/api/v1/master/shifts', data);

export const updateShift = (id: number, data: Partial<{
  name: string; time_from: string; time_to: string; remarks: string; is_active: boolean;
}>) => api.put<ApiShift>(`/api/v1/master/shifts/${id}`, data);

export const deleteShift = (id: number) =>
  api.delete(`/api/v1/master/shifts/${id}`);

// ─── Feed Codes ────────────────────────────────────────────────────────────
export const getFeedCodes = () => api.get<ApiFeedCode[]>('/api/v1/master/feed-codes');

export const createFeedCode = (data: { code: string; remarks?: string }) =>
  api.post<ApiFeedCode>('/api/v1/master/feed-codes', data);

export const updateFeedCode = (id: number, data: Partial<{
  code: string; remarks: string; is_active: boolean;
}>) => api.put<ApiFeedCode>(`/api/v1/master/feed-codes/${id}`, data);

export const deleteFeedCode = (id: number) =>
  api.delete(`/api/v1/master/feed-codes/${id}`);

// ─── Lines ─────────────────────────────────────────────────────────────────
export const getLines = () => api.get<ApiLine[]>('/api/v1/master/lines');

export const createLine = (data: { name: string; code?: string; remarks?: string }) =>
  api.post<ApiLine>('/api/v1/master/lines', data);

export const updateLine = (id: number, data: Partial<{
  name: string; code: string; remarks: string; is_active: boolean;
}>) => api.put<ApiLine>(`/api/v1/master/lines/${id}`, data);

export const deleteLine = (id: number) =>
  api.delete(`/api/v1/master/lines/${id}`);

// ─── Standard Throughputs ──────────────────────────────────────────────────
export const getStandardThroughputs = () =>
  api.get<ApiStandardThroughput[]>('/api/v1/master/standard-throughputs');

export const createStandardThroughput = (data: {
  line_id: number; feed_code_id: number; standard_throughput: number; remarks?: string;
}) => api.post<ApiStandardThroughput>('/api/v1/master/standard-throughputs', data);

export const updateStandardThroughput = (id: number, data: Partial<{
  standard_throughput: number; remarks: string;
}>) => api.put<ApiStandardThroughput>(`/api/v1/master/standard-throughputs/${id}`, data);

export const deleteStandardThroughput = (id: number) =>
  api.delete(`/api/v1/master/standard-throughputs/${id}`);
