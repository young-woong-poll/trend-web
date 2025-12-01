/**
 * 서버 컴포넌트 전용 fetch 유틸리티
 * 클라이언트 컴포넌트에서는 사용하지 마세요
 */

import type { BaseResponse } from '@/types/api';

const API_URL =
  process.env.API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://trend-api.votebox.kr';

export async function serverFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const result: BaseResponse<T> = await response.json();

    // BaseResponse의 data 필드를 반환
    return result.data;
  } catch (error) {
    console.error(`[serverFetch] Error fetching ${endpoint}:`, error);
    throw error;
  }
}
