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

/** 옵션별 투표 수: { optionId: count } */
export type OptionCounts = Record<string, number>;

/**
 * 싱글 핫픽별 옵션 투표 수 (목 데이터)
 * hotpickId → { optionId: count }
 */
export const singleVoteCounts: Record<string, OptionCounts> = {
  // 기존 싱글 (2개 옵션)
  '201': { 's1-o1': 230, 's1-o2': 190 },
  '202': { 'st1-o1': 410, 'st1-o2': 480, 'st1-o3': 140 },
  '203': { 'ss1-o1': 820, 'ss1-o2': 680 },
  '204': { 'sf1-o1': 1600, 'sf1-o2': 1600 },
  '205': { 'sw1-o1': 380, 'sw1-o2': 290 },
  '206': { 'str1-o1': 950, 'str1-o2': 1150, 'str1-o3': 450 },
  '301': { 'sds1-o1': 650, 'sds1-o2': 550 },
  '302': { 'sc1-o1': 340, 'sc1-o2': 420, 'sc1-o3': 200 },
  '303': { 'ssa1-o1': 510, 'ssa1-o2': 490 },
  // IMAGE 타입 싱글
  '401': { 'sic1-o1': 920, 'sic1-o2': 930 },
  '402': { 'sip1-o1': 1700, 'sip1-o2': 1400, 'sip1-o3': 800 },
  '403': { 'sit1-o1': 1100, 'sit1-o2': 1300, 'sit1-o3': 900, 'sit1-o4': 700 },
  '404': { 'sicar1-o1': 850, 'sicar1-o2': 820 },
  '405': { 'sif1-o1': 670, 'sif1-o2': 650 },
  // 무한스크롤 추가 싱글
  '406': { 'smv1-o1': 480, 'smv1-o2': 440 },
  '407': { 'smr1-o1': 790, 'smr1-o2': 750 },
  '408': { 'shl1-o1': 610, 'shl1-o2': 580 },
  '409': { 'svc1-o1': 430, 'svc1-o2': 440 },
  '410': { 'ssn1-o1': 1400, 'ssn1-o2': 1200, 'ssn1-o3': 900 },
  '411': { 'sgm1-o1': 1800, 'sgm1-o2': 1600 },
  '412': { 'smu1-o1': 900, 'smu1-o2': 880 },
  '413': { 'sbr1-o1': 2200, 'sbr1-o2': 2000, 'sbr1-o3': 1500, 'sbr1-o4': 800 },
  '414': { 'sap1-o1': 1000, 'sap1-o2': 950 },
  '415': { 'swd1-o1': 560, 'swd1-o2': 560 },
  '416': { 'scr1-o1': 1500, 'scr1-o2': 1390 },
  '417': { 'sdi1-o1': 720, 'sdi1-o2': 710 },
  '418': { 'swe1-o1': 830, 'swe1-o2': 820 },
  // 멀티 카테고리 싱글
  '501': { 'slf1-o1': 490, 'slf1-o2': 490 },
  '502': { 'ssf1-o1': 1150, 'ssf1-o2': 1100 },
};

/**
 * 투표 후 투표 수 증가
 */
export function incrementVoteCount(hotpickId: string, optionId: string): void {
  const counts = singleVoteCounts[hotpickId];
  if (!counts) {
    return;
  }

  counts[optionId] = (counts[optionId] ?? 0) + 1;
}

/**
 * 옵션별 투표 수를 배열로 반환
 */
export function getOptionCounts(hotpickId: string): { id: string; count: number }[] {
  const counts = singleVoteCounts[hotpickId];
  if (!counts) {
    return [];
  }

  return Object.entries(counts).map(([id, count]) => ({ id, count }));
}

/**
 * 전체 투표 수 합산
 */
export function getTotalVotes(hotpickId: string): number {
  const counts = singleVoteCounts[hotpickId];
  if (!counts) {
    return 0;
  }

  return Object.values(counts).reduce((sum, c) => sum + c, 0);
}
