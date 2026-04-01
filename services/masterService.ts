import { api } from '@/lib/api-client';
import {
  ApiMachineLossLvl1, ApiMachineLossLvl2, ApiMachineLossLvl3,
  ApiMasterMachineLoss,
  ApiShift, ApiFeedCode, ApiLine, ApiStandardThroughput,
  ApiProductionOutput,
  ApiMergedLine,
  ApiOutputType,
} from '@/types/api';

// ─── Machine Loss Level 1 ──────────────────────────────────────────────────
// Backend endpoint: /api/v1/master/machine-loss-lvl1
// Response field: machine_losses_lvl_1_id (bukan `id`)
// Tabel FLAT — hanya menyimpan name, tidak ada FK ke level lain
export const getMachineLossLvl1 = () =>
  api.get<ApiMachineLossLvl1[]>('/api/v1/master/machine-loss-lvl1');
export const createMachineLossLvl1 = (data: { name: string }) =>
  api.post<ApiMachineLossLvl1>('/api/v1/master/machine-loss-lvl1', data);
export const updateMachineLossLvl1 = (id: number, data: { name?: string }) =>
  api.put<ApiMachineLossLvl1>(`/api/v1/master/machine-loss-lvl1/${id}`, data);
export const deleteMachineLossLvl1 = (id: number) =>
  api.delete(`/api/v1/master/machine-loss-lvl1/${id}`);

// ─── Machine Loss Level 2 ──────────────────────────────────────────────────
// Backend endpoint: /api/v1/master/machine-loss-lvl2
// Response field: machine_losses_lvl_2_id (bukan `id`)
// Tabel FLAT — TIDAK ada lvl1_id; hierarki dikelola di master_machine_losses
export const getMachineLossLvl2 = () =>
  api.get<ApiMachineLossLvl2[]>('/api/v1/master/machine-loss-lvl2');
export const createMachineLossLvl2 = (data: { name: string }) =>
  api.post<ApiMachineLossLvl2>('/api/v1/master/machine-loss-lvl2', data);
export const updateMachineLossLvl2 = (id: number, data: { name?: string }) =>
  api.put<ApiMachineLossLvl2>(`/api/v1/master/machine-loss-lvl2/${id}`, data);
export const deleteMachineLossLvl2 = (id: number) =>
  api.delete(`/api/v1/master/machine-loss-lvl2/${id}`);

// ─── Machine Loss Level 3 ──────────────────────────────────────────────────
// Backend endpoint: /api/v1/master/machine-loss-lvl3
// Response field: machine_losses_lvl_3_id (bukan `id`)
// Tabel FLAT — TIDAK ada lvl2_id; hierarki dikelola di master_machine_losses
export const getMachineLossLvl3 = () =>
  api.get<ApiMachineLossLvl3[]>('/api/v1/master/machine-loss-lvl3');
export const createMachineLossLvl3 = (data: { name: string }) =>
  api.post<ApiMachineLossLvl3>('/api/v1/master/machine-loss-lvl3', data);
export const updateMachineLossLvl3 = (id: number, data: { name?: string }) =>
  api.put<ApiMachineLossLvl3>(`/api/v1/master/machine-loss-lvl3/${id}`, data);
export const deleteMachineLossLvl3 = (id: number) =>
  api.delete(`/api/v1/master/machine-loss-lvl3/${id}`);

// ─── Master Machine Losses (katalog kombinasi) ─────────────────────────────
// Backend endpoint: /api/v1/master/master-machine-losses
// Response field: machine_losses_id (bukan `id`)
// Query params: machine_losses_lvl_1_id, machine_losses_lvl_2_id
// Payload create: machine_losses_lvl_1_id (required), machine_losses_lvl_2_id, machine_losses_lvl_3_id
export const getMasterMachineLosses = (params?: {
  machine_losses_lvl_1_id?: number;
  machine_losses_lvl_2_id?: number;
}) => {
  const q = new URLSearchParams();
  if (params?.machine_losses_lvl_1_id) q.set('machine_losses_lvl_1_id', String(params.machine_losses_lvl_1_id));
  if (params?.machine_losses_lvl_2_id) q.set('machine_losses_lvl_2_id', String(params.machine_losses_lvl_2_id));
  const qs = q.toString();
  return api.get<ApiMasterMachineLoss[]>(`/api/v1/master/master-machine-losses${qs ? '?' + qs : ''}`);
};
export const createMasterMachineLoss = (data: {
  machine_losses_lvl_1_id: number;
  machine_losses_lvl_2_id?: number | null;
  machine_losses_lvl_3_id?: number | null;
  remarks?: string;
}) => api.post<ApiMasterMachineLoss>('/api/v1/master/master-machine-losses', data);
export const updateMasterMachineLoss = (id: number, data: Partial<{
  machine_losses_lvl_1_id: number;
  machine_losses_lvl_2_id: number | null;
  machine_losses_lvl_3_id: number | null;
  remarks: string;
  is_active: boolean;
}>) => api.put<ApiMasterMachineLoss>(`/api/v1/master/master-machine-losses/${id}`, data);
export const deleteMasterMachineLoss = (id: number) =>
  api.delete(`/api/v1/master/master-machine-losses/${id}`);

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
// ─── Output Types ──────────────────────────────────────────────────────────
export const getOutputTypes = () =>
  api.get<ApiOutputType[]>('/api/v1/master/output-types');
export const getActiveOutputTypes = () =>
  api.get<ApiOutputType[]>('/api/v1/master/output-types/active');
export const createOutputType = (data: {
  code: string; name: string; category: string;
  is_good_product?: boolean; sort_order?: number; remarks?: string;
}) => api.post<ApiOutputType>('/api/v1/master/output-types', data);
export const updateOutputType = (id: number, data: Partial<{
  name: string; category: string; is_good_product: boolean;
  sort_order: number; remarks: string; is_active: boolean;
}>) => api.put<ApiOutputType>(`/api/v1/master/output-types/${id}`, data);
export const deleteOutputType = (id: number) =>
  api.delete(`/api/v1/master/output-types/${id}`);
