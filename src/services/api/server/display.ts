import { serverFetch } from '@/lib/serverFetch';
import type { ResultDisplayResponse, InviteeResultResponse } from '@/types/result';
import type { MainDisplayResponse, TrendDisplayResponse } from '@/types/trend';

/**
 * 서버 컴포넌트 전용 Display API
 */
export const serverDisplayApi = {
  /**
   * 메인 전시 조회 (서버 컴포넌트 전용)
   */
  getMainDisplay: async (): Promise<MainDisplayResponse> =>
    serverFetch<MainDisplayResponse>('/api/v1/display/main', {
      next: { revalidate: 60 }, // ISR: 60초마다 재검증
    }),

  /**
   * Trend 전시 조회 (서버 컴포넌트 전용)
   */
  getTrendDisplay: async (trendAlias: string): Promise<TrendDisplayResponse> =>
    serverFetch<TrendDisplayResponse>(`/api/v1/display/trend/${trendAlias}`, {
      next: { revalidate: 60 }, // ISR: 60초마다 재검증
    }),

  /**
   * Result 전시 조회 (서버 컴포넌트 전용)
   *
   * 캐싱 전략:
   * - 투표 결과 데이터는 불변(immutable)이므로 긴 캐싱 가능
   * - nickname은 한 번 설정되면 변경 불가하므로 캐싱 유지
   * - 1시간 캐싱으로 서버 부하 감소 및 성능 최적화
   */
  getResultDisplay: async ({
    resultId,
    compareId,
  }: {
    resultId: string;
    compareId?: string;
  }): Promise<ResultDisplayResponse> =>
    serverFetch<ResultDisplayResponse>(
      `/api/v1/display/result/${resultId}${compareId ? `?compareId=${compareId}` : ''}`,
      {
        next: { revalidate: 3600 }, // 1시간 캐싱 (투표 결과는 불변)
      }
    ),

  /**
   * 초대한 친구 결과 목록 조회 (서버 컴포넌트 전용)
   *
   * 캐싱 전략:
   * - 친구들이 계속 투표할 수 있으므로 짧은 캐싱
   * - 30초마다 재검증으로 최신 데이터 유지
   */
  getResultDisplayInvitee: async (resultId: string): Promise<InviteeResultResponse> =>
    serverFetch<InviteeResultResponse>(`/api/v1/display/result/${resultId}/invitee`, {
      next: { revalidate: 30 }, // 30초 캐싱 (자주 업데이트되는 데이터)
    }),
};
