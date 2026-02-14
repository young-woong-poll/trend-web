import axiosInstance from '@/lib/axios';
import type {
  Election,
  CreateElectionRequest,
  UpdateElectionRequest,
  ElectionListResponse,
  ElectionListParams,
} from '@/types/election';

/**
 * Election Admin API 서비스
 * BE API 미구현 시 mock 데이터로 대체 가능
 */
export const electionApi = {
  /**
   * 선거 목록 조회
   * GET /admin/api/v1/election
   */
  getElections: async (params?: ElectionListParams): Promise<ElectionListResponse> => {
    const response = await axiosInstance.get<ElectionListResponse>('/admin/api/v1/election', {
      params,
    });
    return response.data;
  },

  /**
   * 선거 상세 조회
   * GET /admin/api/v1/election/{electionId}
   */
  getElection: async (electionId: string): Promise<Election> => {
    const response = await axiosInstance.get<Election>(`/admin/api/v1/election/${electionId}`);
    return response.data;
  },

  /**
   * 선거 생성
   * POST /admin/api/v1/election
   */
  createElection: async (data: CreateElectionRequest): Promise<Election> => {
    const response = await axiosInstance.post<Election>('/admin/api/v1/election', data);
    return response.data;
  },

  /**
   * 선거 수정
   * PUT /admin/api/v1/election/{electionId}
   */
  updateElection: async (electionId: string, data: UpdateElectionRequest): Promise<Election> => {
    const response = await axiosInstance.put<Election>(
      `/admin/api/v1/election/${electionId}`,
      data
    );
    return response.data;
  },

  /**
   * 선거 삭제
   * DELETE /admin/api/v1/election/{electionId}
   */
  deleteElection: async (electionId: string): Promise<void> => {
    await axiosInstance.delete(`/admin/api/v1/election/${electionId}`);
  },
};
