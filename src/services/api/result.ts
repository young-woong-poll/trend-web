import axiosInstance from '@/lib/axios';
import type {
  CreateResultRequest,
  CreateResultResponse,
  ResultExistsResponse,
} from '@/types/result';

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
   * Result 존재 여부 확인
   * GET /api/v1/result/{resultId}/exists
   */
  checkResultExists: async (resultId: string): Promise<ResultExistsResponse> => {
    const response: AxiosResponse<ResultExistsResponse> = await axiosInstance.get(
      `/api/v1/result/${resultId}/exists`
    );
    return response.data;
  },

  /**
   * Nickname 최초 설정
   * POST /api/v1/result/{resultId}/nickname
   */
  setNickname: async (resultId: string, nickname: string): Promise<void> => {
    await axiosInstance.post(`/api/v1/result/${resultId}/nickname`, { nickname });
  },
};
