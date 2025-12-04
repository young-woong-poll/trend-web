import axiosInstance from '@/lib/axios';
import type { ElectionDetail, ElectionDetailResponse } from '@/types/election';
import type { PresignedUrlResponse } from '@/types/storage';
import type { CreateTrendRequest, TrendResponse } from '@/types/trend';

import type { AxiosResponse } from 'axios';

/**
 * Admin API 서비스
 */
export const adminApi = {
  /**
   * Admin: Trend 생성
   * POST /admin/api/v1/trend
   */
  createTrend: async (data: CreateTrendRequest): Promise<TrendResponse> => {
    const response: AxiosResponse<TrendResponse> = await axiosInstance.post(
      '/admin/api/v1/trend',
      data
    );
    return response.data;
  },

  /**
   * Admin: 선거 상세 조회 (Item API)
   * GET /admin/api/v1/item/{itemId}
   */
  getElection: async (itemId: string): Promise<ElectionDetail> => {
    const response: AxiosResponse<ElectionDetailResponse> = await axiosInstance.get(
      `/admin/api/v1/item/${itemId}`
    );
    return response.data.data;
  },

  /**
   * Admin: S3 Pre-signed URL 발급
   * GET /admin/api/v1/storage/presigned
   * @param filename - 업로드할 파일명
   * @returns uploadUrl과 cdnUrl을 포함한 객체
   */
  generatePresignedUrl: async (filename: string): Promise<PresignedUrlResponse> => {
    const response: AxiosResponse<PresignedUrlResponse> = await axiosInstance.get(
      '/admin/api/v1/storage/presigned',
      { params: { filename } }
    );
    return response.data;
  },
};
