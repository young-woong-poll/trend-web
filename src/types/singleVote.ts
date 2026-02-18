/**
 * 싱글 핫픽 인라인 투표 관련 타입 정의
 *
 * 서버는 voteCount(투표 수)를 반환하고, 퍼센티지는 FE에서 계산한다.
 * 옵션은 2~4개까지 가능하다.
 */

/** 싱글 핫픽 투표 옵션 */
export interface SingleVoteOption {
  id: string;
  text: string;
  imageUrl?: string; // IMAGE 타입 선거에서 옵션별 이미지
  voteCount: number | null;
}

/** 옵션 라벨 (최대 4개) */
export const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;
export type OptionLabel = (typeof OPTION_LABELS)[number];

/** 피드 아이템 내 singleVote 필드 */
export interface SingleVoteData {
  electionId: string;
  options: SingleVoteOption[];
  voted: boolean;
  myChoiceId: string | null; // 선택한 옵션의 ID
  totalVotes: number | null;
}

/** POST /api/v1/single/{hotpickId}/vote 요청 */
export interface SingleVoteRequest {
  optionId: string;
}

/** POST /api/v1/single/{hotpickId}/vote 응답 */
export interface SingleVoteResponse {
  voted: boolean;
  myChoiceId: string;
  optionCounts: { id: string; count: number }[];
  totalVotes: number;
}

/** voteCount → 퍼센티지 계산 */
export function calcPercentage(voteCount: number, totalVotes: number): number {
  if (totalVotes === 0) {
    return 0;
  }
  return Math.round((voteCount / totalVotes) * 100);
}
