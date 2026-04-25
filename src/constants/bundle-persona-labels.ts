import type { MyMedal } from '@/constants/my-medals';

/**
 * 번들별 성향 라벨 마스터.
 * key: bundleSlug, value: 라벨 풀 (4~8개)
 *
 * 규칙 (스펙 2026-04-25):
 * - 라벨 title은 **최대 8자** — 모바일 카드 한 줄 수용.
 * - 중립-긍정 뉘앙스만. 부정 뉘앙스 라벨 지양.
 *
 * 라벨 선정 로직:
 * - BE 매칭 태깅(matchType: same/different)이 붙으면 sameCount/differentCount 비율로 결정.
 * - 현재는 답변 패턴 해시 기반 fallback — 같은 사용자는 항상 같은 라벨.
 */
const BUNDLE_PERSONA_LABELS: Record<string, MyMedal[]> = {
  // 연애 가치관 번들 (첫 번들)
  'love-values': [
    {
      awardType: 'PERSONA_LABEL',
      title: '자유로운 탐험가',
      oneLiner: '관계보다 경험을 택하는 로맨틱 모험가',
    },
    {
      awardType: 'PERSONA_LABEL',
      title: '안정 추구형',
      oneLiner: '오래가는 관계의 가치를 아는 사람',
    },
    {
      awardType: 'PERSONA_LABEL',
      title: '감정 표현형',
      oneLiner: '마음을 숨기지 않고 다 꺼내는 직진파',
    },
    {
      awardType: 'PERSONA_LABEL',
      title: '신중한 로맨틱',
      oneLiner: '사랑에 진지한 자기 페이스 유지형',
    },
  ],
};

const DEFAULT_LABELS: MyMedal[] = [
  {
    awardType: 'PERSONA_LABEL',
    title: '균형 타입',
    oneLiner: '양쪽 의견을 모두 이해하려 하는 타입',
  },
  {
    awardType: 'PERSONA_LABEL',
    title: '뚝심 타입',
    oneLiner: '자신의 기준을 끝까지 지키는 타입',
  },
  {
    awardType: 'PERSONA_LABEL',
    title: '공감형',
    oneLiner: '분위기와 흐름을 읽는 타입',
  },
];

/** 라벨 title 최대 글자 수 (개발 중 가드용) */
export const PERSONA_LABEL_MAX_LENGTH = 8;

/** djb2 해시 — 같은 input이면 항상 같은 uint 반환 */
function stringHash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
  }
  return h >>> 0;
}

/**
 * bundleSlug + currentUserId + answers 해시로 결정되는 성향 라벨.
 * 같은 사용자는 같은 답변일 때 항상 같은 라벨을 받는다.
 */
export function getPersonaLabel(
  bundleSlug: string | undefined,
  currentUserId: string,
  answers: Array<{ electionId: string; electionItemId: string }>
): MyMedal {
  const pool =
    bundleSlug && bundleSlug in BUNDLE_PERSONA_LABELS
      ? BUNDLE_PERSONA_LABELS[bundleSlug]
      : DEFAULT_LABELS;
  const seed = answers
    .slice()
    .sort((a, b) => a.electionId.localeCompare(b.electionId))
    .map((a) => `${a.electionId}:${a.electionItemId}`)
    .join('|');
  const idx = stringHash(`${currentUserId}|${seed}`) % pool.length;
  return pool[idx];
}
