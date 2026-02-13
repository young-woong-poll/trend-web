import axiosInstance from '@/lib/axios';
import type { ElectionDetail } from '@/types/election';
import type {
  CreateHotpickRequest,
  HotpickResponse,
  AdminHotpickResponse,
  UpdateHotpickRequest,
  HotpickAliasCheckResponse,
} from '@/types/hotpick';
import type { PresignedUrlResponse } from '@/types/storage';

/**
 * Admin API 서비스
 */
export const adminApi = {
  /**
   * Admin: Hotpick 생성
   * POST /admin/api/v1/hotpick
   */
  createHotpick: async (data: CreateHotpickRequest): Promise<HotpickResponse> => {
    const response = await axiosInstance.post<HotpickResponse>('/admin/api/v1/hotpick', data);
    return response.data;
  },

  /**
   * Admin: 선거 상세 조회 (Election API)
   * GET /admin/api/v1/election/{electionId}
   */
  getElection: async (electionId: string): Promise<ElectionDetail> => {
    const response = await axiosInstance.get<ElectionDetail>(
      `/admin/api/v1/election/${electionId}`
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
    const response = await axiosInstance.get<PresignedUrlResponse>(
      '/admin/api/v1/storage/presigned',
      { params: { filename } }
    );
    return response.data;
  },

  /**
   * Admin: Hotpick Alias 중복 체크
   * GET /admin/api/v1/hotpick/check?alias={alias}
   * @param alias - 체크할 hotpick alias
   * @returns exists 여부를 포함한 객체
   */
  checkHotpickAlias: async (alias: string): Promise<HotpickAliasCheckResponse> => {
    const response = await axiosInstance.get<HotpickAliasCheckResponse>(
      '/admin/api/v1/hotpick/check',
      {
        params: { alias },
      }
    );
    return response.data;
  },

  /**
   * Admin: 핫픽 목록 조회
   * GET /admin/api/v1/hotpick
   */
  getHotpicks: async (): Promise<AdminHotpickResponse[]> => {
    const response = await axiosInstance.get<AdminHotpickResponse[]>('/admin/api/v1/hotpick');
    return response.data;
  },

  /**
   * Admin: 핫픽 수정
   * PUT /admin/api/v1/hotpick/{hotpickId}
   */
  updateHotpick: async (
    hotpickId: number,
    data: UpdateHotpickRequest
  ): Promise<AdminHotpickResponse> => {
    const response = await axiosInstance.put<AdminHotpickResponse>(
      `/admin/api/v1/hotpick/${hotpickId}`,
      data
    );
    return response.data;
  },

  /**
   * Admin: 핫픽 삭제
   * DELETE /admin/api/v1/hotpick/{hotpickId}
   */
  deleteHotpick: async (hotpickId: number): Promise<void> => {
    await axiosInstance.delete(`/admin/api/v1/hotpick/${hotpickId}`);
  },
};
