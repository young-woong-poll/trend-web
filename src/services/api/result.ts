import axiosInstance from '@/lib/axios';
import type { CreateResultRequest, CreateResultResponse } from '@/types/result';

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
};
