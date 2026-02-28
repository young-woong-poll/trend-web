// ──────────────────────────────────────────────────────────
// 새 HotpickDetailResponse 기반 확장 타입
//
// 새 Orval 생성 타입(HotpickCardResponse, ElectionViewResponse 등)에서
// 컴포넌트가 직접 참조할 확장 인터페이스를 정의합니다.
// ──────────────────────────────────────────────────────────

import type {
  ElectionItemViewResponse,
  ElectionViewResponse,
  HotpickCardResponse,
  HotpickDetailResponse,
} from '@/generated/models';
import type { HotpickStatus, HotpickType, VoteType } from '@/types/hotpick';

/**
 * HotpickCardResponse를 확장하여 FE 전용 필드를 추가
 */
export interface ExtendedHotpickCard extends HotpickCardResponse {
  voteType?: VoteType;
  status?: HotpickStatus;
}

/**
 * ElectionViewResponse를 확장 (컴포넌트 호환용)
 */
export type ExtendedElectionItem = ElectionViewResponse & {
  voteType?: VoteType;
  mainImageUrl?: string;
  options?: ElectionItemViewResponse[];
};

/**
 * HotpickDetailResponse를 확장 (컴포넌트 호환용)
 */
export type ExtendedHotpickDetail = HotpickDetailResponse & {
  trendId?: number;
  title?: string;
  type?: HotpickType;
  deadline?: string;
  status?: HotpickStatus;
  imageUrls?: string[];
  items?: ExtendedElectionItem[];
};
