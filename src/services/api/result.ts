import axiosInstance from '@/lib/axios';
import type { CreateResultRequest, CreateResultResponse, ResultTrendItem } from '@/types/result';

import type { AxiosResponse } from 'axios';

/**
 * Result API 서비스
 */
export const resultApi = {
  /**
   * Result 생성
   * POST /api/v1/result
   */
  createResult: async (data: CreateResultRequest): Promise<CreateResultResponse> => {
    const response: AxiosResponse<CreateResultResponse> = await axiosInstance.post(
      '/api/v1/result',
      data
    );
    return response.data;
  },

  /**
   * POST /api/v1/result/:resultId/nickname
   * nickname 업데이트
   */

  setNickname: async (resultId: string, nickname: string): Promise<ResultTrendItem> => {
    const response: AxiosResponse<ResultTrendItem> = await axiosInstance.post(
      `/api/v1/result/${resultId}/nickname`,
      { nickname }
    );
    return response.data;
  },
};
