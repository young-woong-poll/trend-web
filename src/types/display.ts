/**
 * Orval 생성 타입 확장
 *
 * BE API 스펙이 업데이트되기 전까지, 기존 Orval 타입에 없는
 * voteType, mainImageUrl, deadline, status 등의 필드를 확장한다.
 * Phase 3(마이그레이션)에서 Orval 재생성 후 제거 예정.
 */

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
