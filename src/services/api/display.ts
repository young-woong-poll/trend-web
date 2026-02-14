import axiosInstance from '@/lib/axios';
import type { CommentListResponse } from '@/types/comment';
import type { MainDisplayResponse, HotpickDisplayResponse } from '@/types/hotpick';
import type { ResultDisplayResponse } from '@/types/result';

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
   * Hotpick 전시 조회
   * GET /api/v1/display/hotpick/${hotpickAlias}
   */
  getHotpickDisplay: async (hotpickAlias: string): Promise<HotpickDisplayResponse> => {
    const response: AxiosResponse<HotpickDisplayResponse> = await axiosInstance.get(
      `/api/v1/display/hotpick/${hotpickAlias}`
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
   * 핫픽 선거 댓글 조회
   * GET /api/v1/display/hotpick/{hotpickId}/election/{electionId}/comment
   */
  getComments: async ({
    hotpickId,
    electionId,
    sort = 'latest',
    cursor,
    size,
    tkuId,
  }: {
    hotpickId: number;
    electionId: string;
    sort?: string;
    cursor?: string;
    size?: number;
    tkuId?: string;
  }): Promise<CommentListResponse> => {
    const response: AxiosResponse<CommentListResponse> = await axiosInstance.get(
      `/api/v1/display/hotpick/${hotpickId}/election/${electionId}/comment`,
      {
        params: { sort, cursor, size },
        headers: tkuId ? { 'x-tku-id': tkuId } : undefined,
      }
    );
    return response.data;
  },
};
