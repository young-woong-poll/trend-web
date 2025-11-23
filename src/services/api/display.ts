import axiosInstance from '@/lib/axios';
import type { ResultDisplayResponse, InviteeResultResponse } from '@/types/result';
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
  getMainDisplay: async (): Promise<MainDisplayResponse> => {
    const response: AxiosResponse<MainDisplayResponse> =
      await axiosInstance.get('/api/v1/display/main');
    return response.data;
  },

  /**
   * Trend 전시 조회
   * GET /api/v1/display/trend/${trendId}
   */
  getTrendDisplay: async (trendId: string): Promise<TrendDisplayResponse> => {
    const response: AxiosResponse<TrendDisplayResponse> = await axiosInstance.get(
      `/api/v1/display/trend/${trendId}`
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
   * 초대한 친구 결과 목록 조회
   * GET /api/v1/display/result/${resultId}/invitee
   */
  getResultDisplayInvitee: async (resultId: string): Promise<InviteeResultResponse> => {
    const response: AxiosResponse<InviteeResultResponse> = await axiosInstance.get(
      `/api/v1/display/result/${resultId}/invitee`
    );
    return response.data;
  },
};
