import { serverFetch } from '@/lib/serverFetch';
import type { HotpickVoteCountResponse } from '@/types/hotpick';

/**
 * 서버 컴포넌트 전용 Hotpick API
 */
export const serverHotpickApi = {
  /**
   * Hotpick 투표 수 조회 (서버 컴포넌트 전용)
   */
  getHotpickVoteCount: async (hotpickId: string): Promise<HotpickVoteCountResponse> =>
    serverFetch<HotpickVoteCountResponse>(`/api/v1/hotpick/${hotpickId}`, {
      next: { revalidate: 60 }, // ISR: 60초마다 재검증
    }),
};
