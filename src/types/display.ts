// ──────────────────────────────────────────────────────────
// [DEPRECATED] Orval 생성 타입의 수동 확장 — BE API 스펙 업데이트 후 이 파일 전체를 삭제하세요.
//
// BE API 스펙이 업데이트되기 전까지, 기존 Orval 타입에 없는
// voteType, mainImageUrl, deadline, status 등의 필드를 확장한다.
// Orval 재생성 후 생성된 타입에 이 필드들이 포함되면, 이 파일을 삭제하고
// import를 Orval 생성 타입으로 교체하세요.
//
// 사용처:
// - src/components/features/Hotpick/VoteView.tsx (ExtendedElectionItem, ExtendedHotpickDetail)
// - src/components/features/Hotpick/VoteCard/VoteCard.tsx (VoteType)
// ──────────────────────────────────────────────────────────

import type { DisplayTrendDetailResponse, DisplayTrendItemResponse } from '@/generated/models';
import type { VoteType } from '@/types/election';
import type { HotpickStatus, HotpickType } from '@/types/hotpick';

export interface ExtendedElectionItem extends DisplayTrendItemResponse {
  voteType?: VoteType;
  mainImageUrl?: string;
}

export interface ExtendedHotpickDetail extends Omit<DisplayTrendDetailResponse, 'items'> {
  items?: ExtendedElectionItem[];
  type?: HotpickType;
  deadline?: string;
  status?: HotpickStatus;
}
