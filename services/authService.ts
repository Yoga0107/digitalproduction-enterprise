/**
 * services/authService.ts
 * All authentication API calls.
 */

import { api } from '@/lib/api-client';
import type { LoginResponse, RegisterResponse, ApiUser } from '@/types/api';

// ─── Login ──────────────────────────────────────────────────────────────────
export async function loginApi(
  username: string,
  password: string
): Promise<LoginResponse> {
  return api.post<LoginResponse>(
    '/api/v1/auth/login',
    { username, password },
    { withPlant: false }
  );
}

// ─── Register ───────────────────────────────────────────────────────────────
export async function registerApi(payload: {
  username: string;
  email: string;
  full_name: string;
  password: string;
  confirm_password: string;
}): Promise<RegisterResponse> {
  return api.post<RegisterResponse>(
    '/api/v1/auth/register',
    payload,
    { withPlant: false }
  );
}

// ─── Logout ──────────────────────────────────────────────────────────────────
export async function logoutApi(refreshToken: string): Promise<void> {
  await api.post(
    '/api/v1/auth/logout',
    { refresh_token: refreshToken },
    { withPlant: false }
  );
}

// ─── Current User ─────────────────────────────────────────────────────────────
export async function getMeApi(): Promise<ApiUser> {
  return api.get<ApiUser>('/api/v1/auth/me', { withPlant: false });
}

// ─── Update Profile ───────────────────────────────────────────────────────────
export async function updateProfileApi(payload: {
  full_name?: string;
  email?: string;
}): Promise<ApiUser> {
  return api.patch<ApiUser>('/api/v1/auth/me', payload, { withPlant: false });
}

// ─── Change Password ──────────────────────────────────────────────────────────
export async function changePasswordApi(payload: {
  current_password: string;
  new_password: string;
  confirm_new_password: string;
}): Promise<{ message: string }> {
  return api.post<{ message: string }>(
    '/api/v1/auth/me/change-password',
    payload,
    { withPlant: false }
  );
}

