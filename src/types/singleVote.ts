/**
 * 싱글 핫픽 인라인 투표 관련 타입 정의
 *
 * 서버는 voteCount(투표 수)를 반환하고, 퍼센티지는 FE에서 계산한다.
 * 옵션은 2~4개까지 가능하다.
 */

import type { ElectionViewResponse, VoteResultResponse } from '@/generated/models';

/** 싱글 핫픽 투표 옵션 */
export interface SingleVoteOption {
  id: string;
  text: string;
  imageUrl?: string; // IMAGE 타입 선거에서 옵션별 이미지
  voteCount: number;
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

/** voteCount → 퍼센티지 계산 */
export function calcPercentage(voteCount: number, totalVotes: number): number {
  if (totalVotes === 0) {
    return 0;
  }
  return Math.round((voteCount / totalVotes) * 100);
}

/**
 * ElectionViewResponse → SingleVoteData 변환
 * 새 API 응답을 FE 내부 표현으로 변환
 */
export function electionToSingleVoteData(election: ElectionViewResponse): SingleVoteData {
  return {
    electionId: String(election.electionId ?? ''),
    options: (election.items ?? []).map((item) => ({
      id: String(item.electionItemId ?? ''),
      text: item.title ?? '',
      imageUrl: item.imageUrl,
      voteCount: item.voteCount ?? 0,
    })),
    voted: election.voted ?? false,
    myChoiceId: election.myElectionItemId ? String(election.myElectionItemId) : null,
    totalVotes: election.voted ? (election.totalVoteCount ?? null) : null,
  };
}

/**
 * VoteResultResponse → SingleVoteData 업데이트
 * 투표 결과 응답으로 기존 SingleVoteData를 갱신
 */
export function voteResultToSingleVoteData(
  prev: SingleVoteData,
  result: VoteResultResponse
): SingleVoteData {
  return {
    ...prev,
    options: prev.options.map((opt) => {
      const serverItem = (result.items ?? []).find(
        (item) => String(item.electionItemId) === opt.id
      );
      return {
        ...opt,
        voteCount: serverItem?.voteCount ?? opt.voteCount,
      };
    }),
    voted: result.voted ?? true,
    myChoiceId: result.myElectionItemId ? String(result.myElectionItemId) : prev.myChoiceId,
    totalVotes: result.totalVoteCount ?? prev.totalVotes,
  };
}
