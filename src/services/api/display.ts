import axiosInstance from '@/lib/axios';
import type { CommentListResponse } from '@/types/comment';
import type { ResultDisplayResponse } from '@/types/result';
import type { MainDisplayResponse, TrendDisplayResponse } from '@/types/trend';

import type { AxiosResponse } from 'axios';

/**
 * Display API 서비스
 */
export const displayApi = {
  /**
   * 메인 전시 조회
   * GET /api/v1/display/main
   */
  getMainDisplay: async (params?: {
    size?: number;
    page?: number;
    sort?: 'latest' | 'popular';
  }): Promise<MainDisplayResponse> => {
    const response: AxiosResponse<MainDisplayResponse> = await axiosInstance.get(
      '/api/v1/display/main',
      {
        params: params ? { size: params.size, page: params.page, sort: params.sort } : undefined,
      }
    );
    return response.data;
  },

  /**
   * Trend 전시 조회
   * GET /api/v1/display/trend/${trendAlias}
   */
  getTrendDisplay: async (trendAlias: string): Promise<TrendDisplayResponse> => {
    const response: AxiosResponse<TrendDisplayResponse> = await axiosInstance.get(
      `/api/v1/display/trend/${trendAlias}`
    );
    return response.data;
  },

  /**
   * Result 전시 조회
   * GET /api/v1/display/result/${resultId}
   */
  getResultDisplay: async (resultId: string): Promise<ResultDisplayResponse> => {
    const response: AxiosResponse<ResultDisplayResponse> = await axiosInstance.get(
      `/api/v1/display/result/${resultId}`
    );
    return response.data;
  },

  /**
   * 트렌드 아이템 댓글 조회
   * GET /api/v1/display/trend/{trendId}/item/{itemId}/comment
   */
  getComments: async ({
    trendId,
    itemId,
    sort = 'latest',
    cursor,
    size,
    tkuId,
  }: {
    trendId: number;
    itemId: string;
    sort?: string;
    cursor?: string;
    size?: number;
    tkuId?: string;
  }): Promise<CommentListResponse> => {
    const response: AxiosResponse<CommentListResponse> = await axiosInstance.get(
      `/api/v1/display/trend/${trendId}/item/${itemId}/comment`,
      {
        params: { sort, cursor, size },
        headers: tkuId ? { 'x-tku-id': tkuId } : undefined,
      }
    );
    return response.data;
  },
};
