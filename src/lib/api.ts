import type { ApiError, ApiSuccess } from '@/types';

export function apiSuccess<T>(data: T): ApiSuccess<T> {
  return { success: true, data, timestamp: new Date().toISOString() };
}

export function apiError(code: string, message: string): ApiError {
  return { success: false, error: { code, message }, timestamp: new Date().toISOString() };
}
