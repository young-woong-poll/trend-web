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
  // 기존 싱글
  '201': { optionACount: 230, optionBCount: 190 },
  '202': { optionACount: 410, optionBCount: 480 },
  '203': { optionACount: 820, optionBCount: 680 },
  '204': { optionACount: 1600, optionBCount: 1600 },
  '205': { optionACount: 380, optionBCount: 290 },
  '206': { optionACount: 950, optionBCount: 1150 },
  '301': { optionACount: 650, optionBCount: 550 },
  '302': { optionACount: 340, optionBCount: 420 },
  '303': { optionACount: 510, optionBCount: 490 },
  // IMAGE 타입 싱글
  '401': { optionACount: 920, optionBCount: 930 },
  '402': { optionACount: 1700, optionBCount: 1400 },
  '403': { optionACount: 1100, optionBCount: 1300 },
  '404': { optionACount: 850, optionBCount: 820 },
  '405': { optionACount: 670, optionBCount: 650 },
  // 무한스크롤 추가 싱글
  '406': { optionACount: 480, optionBCount: 440 },
  '407': { optionACount: 790, optionBCount: 750 },
  '408': { optionACount: 610, optionBCount: 580 },
  '409': { optionACount: 430, optionBCount: 440 },
  '410': { optionACount: 1400, optionBCount: 1200 },
  '411': { optionACount: 1800, optionBCount: 1600 },
  '412': { optionACount: 900, optionBCount: 880 },
  '413': { optionACount: 2200, optionBCount: 2000 },
  '414': { optionACount: 1000, optionBCount: 950 },
  '415': { optionACount: 560, optionBCount: 560 },
  '416': { optionACount: 1500, optionBCount: 1390 },
  '417': { optionACount: 720, optionBCount: 710 },
  '418': { optionACount: 830, optionBCount: 820 },
  // 멀티 카테고리 싱글
  '501': { optionACount: 490, optionBCount: 490 },
  '502': { optionACount: 1150, optionBCount: 1100 },
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
