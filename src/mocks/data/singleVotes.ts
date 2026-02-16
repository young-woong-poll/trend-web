/**
 * MSW 인메모리 싱글 투표 상태 저장소
 *
 * 개발 환경에서 투표 상태를 추적하기 위한 임시 저장소.
 * 페이지 새로고침 시 초기화됨.
 */

interface VoteRecord {
  optionId: string;
  tkuId: string;
}

/** tkuId:hotpickId → VoteRecord */
const voteStore = new Map<string, VoteRecord>();

function makeKey(tkuId: string, hotpickId: string): string {
  return `${tkuId}:${hotpickId}`;
}

export function recordVote(tkuId: string, hotpickId: string, optionId: string): void {
  voteStore.set(makeKey(tkuId, hotpickId), { optionId, tkuId });
}

export function getVote(tkuId: string, hotpickId: string): VoteRecord | undefined {
  return voteStore.get(makeKey(tkuId, hotpickId));
}

export function hasVoted(tkuId: string, hotpickId: string): boolean {
  return voteStore.has(makeKey(tkuId, hotpickId));
}

/**
 * 싱글 핫픽별 옵션 투표 수 (목 데이터)
 * hotpickId → { optionACount, optionBCount }
 */
export const singleVoteCounts: Record<string, { optionACount: number; optionBCount: number }> = {
  '201': { optionACount: 230, optionBCount: 190 },
  '202': { optionACount: 410, optionBCount: 480 },
  '203': { optionACount: 820, optionBCount: 680 },
  '204': { optionACount: 1600, optionBCount: 1600 },
  '205': { optionACount: 380, optionBCount: 290 },
  '206': { optionACount: 950, optionBCount: 1150 },
  '301': { optionACount: 650, optionBCount: 550 },
  '302': { optionACount: 340, optionBCount: 420 },
  '303': { optionACount: 510, optionBCount: 490 },
  '304': { optionACount: 720, optionBCount: 280 },
  '305': { optionACount: 430, optionBCount: 570 },
  '306': { optionACount: 890, optionBCount: 310 },
  '307': { optionACount: 660, optionBCount: 540 },
};

/**
 * 투표 후 투표 수 증가
 */
export function incrementVoteCount(hotpickId: string, optionId: string, optionAId: string): void {
  const counts = singleVoteCounts[hotpickId];
  if (!counts) {
    return;
  }

  if (optionId === optionAId) {
    counts.optionACount++;
  } else {
    counts.optionBCount++;
  }
}
