import axiosInstance from '@/lib/axios';
import type {
  Election,
  CreateElectionRequest,
  UpdateElectionRequest,
  ElectionListResponse,
  ElectionListParams,
} from '@/types/election';

// ──────────────────────────────────────────────────────────
// [DEPRECATED] 수동 API 함수 — BE API 연동 후 Orval 생성 함수로 교체 예정.
// 이 파일 전체를 삭제하고, Orval 생성된 election API로 대체하세요.
// 관련 파일: src/hooks/api/useElection.ts (함께 교체)
// ──────────────────────────────────────────────────────────
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
