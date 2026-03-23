import { api } from '@/lib/api-client';
import {
  ApiMachineLoss,
  ApiLossLevel1, ApiLossLevel2, ApiLossLevel3,
  ApiShift, ApiFeedCode, ApiLine, ApiStandardThroughput,
  ApiProductionOutput,
  ApiMergedLine,
} from '@/types/api';

// ─── Machine Losses (self-referencing, digunakan oleh master page tree) ────
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
  name: string; description: string; is_active: boolean; sort_order: number;
}>) => api.put<ApiMachineLoss>(`/api/v1/master/machine-losses/${id}`, data);

export const moveMachineLoss = (id: number, data: {
  new_parent_id: number | null;
  new_level: number;
  new_sort_order: number;
}) => api.patch<ApiMachineLoss>(`/api/v1/master/machine-losses/${id}/move`, data);

export const deleteMachineLoss = (id: number) =>
  api.delete(`/api/v1/master/machine-losses/${id}`);

/** Manual full-sync: rebuild machine_losses dari loss_level_1/2/3. */
export const syncMachineLosses = () =>
  api.post<ApiMachineLoss[]>('/api/v1/master/machine-losses/sync', {});

// ─── Loss Level 1 ─────────────────────────────────────────────────────────
export const getLossLevel1 = () =>
  api.get<ApiLossLevel1[]>('/api/v1/master/loss-level-1');
export const createLossLevel1 = (data: { name: string; description?: string; sort_order?: number }) =>
  api.post<ApiLossLevel1>('/api/v1/master/loss-level-1', data);
export const updateLossLevel1 = (id: number, data: Partial<{ name: string; description: string; sort_order: number; is_active: boolean }>) =>
  api.put<ApiLossLevel1>(`/api/v1/master/loss-level-1/${id}`, data);
export const deleteLossLevel1 = (id: number) =>
  api.delete(`/api/v1/master/loss-level-1/${id}`);

// ─── Loss Level 2 ─────────────────────────────────────────────────────────
export const getLossLevel2 = () =>
  api.get<ApiLossLevel2[]>('/api/v1/master/loss-level-2');
export const createLossLevel2 = (data: { level_1_id: number; name: string; description?: string; sort_order?: number }) =>
  api.post<ApiLossLevel2>('/api/v1/master/loss-level-2', data);
export const updateLossLevel2 = (id: number, data: Partial<{ name: string; description: string; sort_order: number; is_active: boolean }>) =>
  api.put<ApiLossLevel2>(`/api/v1/master/loss-level-2/${id}`, data);
export const deleteLossLevel2 = (id: number) =>
  api.delete(`/api/v1/master/loss-level-2/${id}`);

// ─── Loss Level 3 ─────────────────────────────────────────────────────────
export const getLossLevel3 = () =>
  api.get<ApiLossLevel3[]>('/api/v1/master/loss-level-3');
export const createLossLevel3 = (data: { level_2_id: number; name: string; description?: string; sort_order?: number }) =>
  api.post<ApiLossLevel3>('/api/v1/master/loss-level-3', data);
export const updateLossLevel3 = (id: number, data: Partial<{ name: string; description: string; sort_order: number; is_active: boolean }>) =>
  api.put<ApiLossLevel3>(`/api/v1/master/loss-level-3/${id}`, data);
export const deleteLossLevel3 = (id: number) =>
  api.delete(`/api/v1/master/loss-level-3/${id}`);

// ─── Shifts ────────────────────────────────────────────────────────────────
export const getShifts = () => api.get<ApiShift[]>('/api/v1/master/shifts');
export const createShift = (data: { name: string; time_from: string; time_to: string; remarks?: string }) =>
  api.post<ApiShift>('/api/v1/master/shifts', data);
export const updateShift = (id: number, data: Partial<{ name: string; time_from: string; time_to: string; remarks: string; is_active: boolean }>) =>
  api.put<ApiShift>(`/api/v1/master/shifts/${id}`, data);
export const deleteShift = (id: number) => api.delete(`/api/v1/master/shifts/${id}`);

// ─── Feed Codes ────────────────────────────────────────────────────────────
export const getFeedCodes = () => api.get<ApiFeedCode[]>('/api/v1/master/feed-codes');
export const createFeedCode = (data: { code: string; remarks?: string }) =>
  api.post<ApiFeedCode>('/api/v1/master/feed-codes', data);
export const updateFeedCode = (id: number, data: Partial<{ code: string; remarks: string; is_active: boolean }>) =>
  api.put<ApiFeedCode>(`/api/v1/master/feed-codes/${id}`, data);
export const deleteFeedCode = (id: number) => api.delete(`/api/v1/master/feed-codes/${id}`);

// ─── Lines ─────────────────────────────────────────────────────────────────
export const getLines = () => api.get<ApiLine[]>('/api/v1/master/lines');
export const createLine = (data: { name: string; code?: string; remarks?: string }) =>
  api.post<ApiLine>('/api/v1/master/lines', data);
export const updateLine = (id: number, data: Partial<{ name: string; code: string; remarks: string; is_active: boolean }>) =>
  api.put<ApiLine>(`/api/v1/master/lines/${id}`, data);
export const deleteLine = (id: number) => api.delete(`/api/v1/master/lines/${id}`);

// ─── Standard Throughputs ──────────────────────────────────────────────────
export const getStandardThroughputs = () =>
  api.get<ApiStandardThroughput[]>('/api/v1/master/standard-throughputs');
export const createStandardThroughput = (data: { line_id: number; feed_code_id: number; standard_throughput: number; remarks?: string }) =>
  api.post<ApiStandardThroughput>('/api/v1/master/standard-throughputs', data);
export const updateStandardThroughput = (id: number, data: Partial<{ standard_throughput: number; remarks: string }>) =>
  api.put<ApiStandardThroughput>(`/api/v1/master/standard-throughputs/${id}`, data);
export const deleteStandardThroughput = (id: number) =>
  api.delete(`/api/v1/master/standard-throughputs/${id}`);

// ─── Merged Lines ──────────────────────────────────────────────────────────
export const getMergedLines = () =>
  api.get<ApiMergedLine[]>('/api/v1/master/merged-lines');

export const getMergedLine = (id: number) =>
  api.get<ApiMergedLine>(`/api/v1/master/merged-lines/${id}`);

export const createMergedLine = (data: { name: string; code?: string; remarks?: string; line_ids: number[] }) =>
  api.post<ApiMergedLine>('/api/v1/master/merged-lines', data);

export const updateMergedLine = (id: number, data: Partial<{ name: string; code: string; remarks: string; line_ids: number[]; is_active: boolean }>) =>
  api.put<ApiMergedLine>(`/api/v1/master/merged-lines/${id}`, data);

export const deleteMergedLine = (id: number) =>
  api.delete(`/api/v1/master/merged-lines/${id}`);
