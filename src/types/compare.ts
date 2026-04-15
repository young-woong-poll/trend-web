// src/types/compare.ts
//
// BE generated 타입 기반 FE alias.
// BE에 아직 없는 FE 전용 필드는 Omit+확장으로 보존.

import type { CompareLinkInfoResponse } from '@/generated/models/compareLinkInfoResponse';
import type { OneToOneCompareResultResponse } from '@/generated/models/oneToOneCompareResultResponse';
import type { CategoryCode } from '@/types/hotpick';

/**
 * 비교 링크 타입
 */
export type CompareLinkType = 'ONE_TO_ONE' | 'GROUP';

/**
 * 비교 링크 정보 (랜딩 페이지용)
 * BE CompareLinkInfoResponse 기반 + FE 전용 필드 보존
 *
 * BE에 아직 없는 필드 (swagger 누락 가능성):
 * - creatorImageUrl: 생성자 캐릭터 이미지
 * - groupName: 그룹 이름
 * - memberCount: 그룹 멤버 수
 * - isClosed: 그룹 마감 여부
 */
export type CompareLink = Omit<CompareLinkInfoResponse, 'categoryCode'> & {
  categoryCode?: CategoryCode;
  // TODO: BE swagger에 누락된 필드 — BE에 추가 요청 필요
  creatorImageUrl?: string | null;
  groupName?: string | null;
  memberCount?: number;
  isClosed?: boolean;
};

/**
 * 비교 링크 생성 요청
 */
export type { CreateCompareLinkRequest } from '@/generated/models/createCompareLinkRequest';

/**
 * 비교 링크 생성 응답
 */
export type { CreateCompareLinkResponse } from '@/generated/models/createCompareLinkResponse';

/**
 * 1:1 비교 결과 (서버 응답)
 * 서버는 숫자만 리턴. 등급/캐릭터/문구/스토리텔링은 FE에서 매핑.
 */
export type CompareResult = Omit<OneToOneCompareResultResponse, 'categoryCode'> & {
  categoryCode?: CategoryCode;
};
