import { serverFetch } from '@/lib/serverFetch';
import type { MainDisplayResponse, HotpickDisplayResponse } from '@/types/hotpick';
import type { ResultDisplayResponse } from '@/types/result';

/**
 * 서버 컴포넌트 전용 Display API
 */
export const serverDisplayApi = {
  /**
   * 메인 전시 조회 (서버 컴포넌트 전용)
   */
  getMainDisplay: async (params?: {
    size?: number;
    page?: number;
    sort?: 'latest' | 'popular';
  }): Promise<MainDisplayResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.size !== undefined) {
      searchParams.set('size', String(params.size));
    }
    if (params?.page !== undefined) {
      searchParams.set('page', String(params.page));
    }
    if (params?.sort) {
      searchParams.set('sort', params.sort);
    }
    const queryString = searchParams.toString();
    const url = queryString ? `/api/v1/display/main?${queryString}` : '/api/v1/display/main';

    return serverFetch<MainDisplayResponse>(url, {
      next: { revalidate: 60 }, // ISR: 60초마다 재검증
    });
  },

  /**
   * Hotpick 전시 조회 (서버 컴포넌트 전용)
   */
  getHotpickDisplay: async (hotpickAlias: string): Promise<HotpickDisplayResponse> =>
    serverFetch<HotpickDisplayResponse>(`/api/v1/display/hotpick/${hotpickAlias}`, {
      next: { revalidate: 60 }, // ISR: 60초마다 재검증
    }),

  /**
   * Result 전시 조회 (서버 컴포넌트 전용)
   */
  getResultDisplay: async (resultId: string): Promise<ResultDisplayResponse> =>
    serverFetch<ResultDisplayResponse>(`/api/v1/display/result/${resultId}`, {
      next: { revalidate: 10 },
    }),
};
