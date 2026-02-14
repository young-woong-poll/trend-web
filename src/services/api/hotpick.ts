import axiosInstance from '@/lib/axios';
import type { HotpickElectionOptionsResponse } from '@/types/hotpick';

import type { AxiosResponse } from 'axios';

/**
 * Hotpick API 서비스
 */
export const hotpickApi = {
  /**
   * Hotpick 선거 옵션 카운트 조회
   * GET /api/v1/hotpick/{hotpickAlias}/election/{electionId}
   */
  getHotpickElectionOptionsCount: async (
    hotpickAlias: string,
    electionId: string,
    size?: number
  ): Promise<HotpickElectionOptionsResponse> => {
    const response: AxiosResponse<HotpickElectionOptionsResponse> = await axiosInstance.get(
      `/api/v1/hotpick/${hotpickAlias}/election/${electionId}`,
      { params: { size } }
    );
    return response.data;
  },
};
