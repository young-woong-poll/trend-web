import type { ElectionItemSeriesResponse } from './electionItemSeriesResponse';

/**
 * 응답 데이터
 */
export interface ElectionSeriesResponse {
  hotpickId?: number;
  hotpickSlug?: string;
  electionId?: number;
  interval?: string;
  openedAt?: string;
  totalVoteCount?: number;
  items?: ElectionItemSeriesResponse[];
}
