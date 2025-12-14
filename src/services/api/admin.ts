import axiosInstance from '@/lib/axios';
import type { ElectionDetail } from '@/types/election';
import type { PresignedUrlResponse } from '@/types/storage';
import type {
  CreateTrendRequest,
  TrendResponse,
  AdminTrendResponse,
  UpdateTrendRequest,
  TrendAliasCheckResponse,
} from '@/types/trend';

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
    const response: AxiosResponse<ElectionDetail> = await axiosInstance.get(
      `/admin/api/v1/item/${itemId}`
    );

    return response.data;
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

  /**
   * Admin: Trend ID 중복 체크
   * GET /admin/api/v1/trend/check?alias={alias}
   * @param alias - 체크할 trend alias
   * @returns exists 여부를 포함한 객체
   */
  checkTrendAlias: async (alias: string): Promise<TrendAliasCheckResponse> => {
    const response: AxiosResponse<{
      code: string;
      message: string;
      data: TrendAliasCheckResponse;
    }> = await axiosInstance.get('/admin/api/v1/trend/check', {
      params: { alias },
    });
    return response.data.data;
  },

  /**
   * Admin: 트렌드 목록 조회
   * GET /admin/api/v1/trend
   */
  getTrends: async (): Promise<AdminTrendResponse[]> => {
    const response: AxiosResponse<{
      code: string;
      message: string;
      data: AdminTrendResponse[];
    }> = await axiosInstance.get('/admin/api/v1/trend');
    return response.data.data;
  },

  /**
   * Admin: 트렌드 수정
   * PUT /admin/api/v1/trend/{trendId}
   */
  updateTrend: async (trendId: number, data: UpdateTrendRequest): Promise<AdminTrendResponse> => {
    const response: AxiosResponse<{
      code: string;
      message: string;
      data: AdminTrendResponse;
    }> = await axiosInstance.put(`/admin/api/v1/trend/${trendId}`, data);
    return response.data.data;
  },

  /**
   * Admin: 트렌드 삭제
   * DELETE /admin/api/v1/trend/{trendId}
   */
  deleteTrend: async (trendId: number): Promise<void> => {
    await axiosInstance.delete(`/admin/api/v1/trend/${trendId}`);
  },
};
