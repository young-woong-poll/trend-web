// src/constants/my-medals.ts
import type { GroupAward, GroupAwardType } from '@/types/group-compare';

/**
 * TOP 슬롯 우선순위 (2026-04-25 스펙).
 *
 * 중립-긍정 뉘앙스 어워드만 노출 — 공유 거부 방지.
 * CONTROVERSY_MAKER(트러블 메이커), GROUP_OUTSIDER(그룹 이단아)는 부정 뉘앙스로 제외.
 * 제외된 어워드는 Layer 2 GroupAwards에서만 노출된다.
 */
const TOP_PRIORITY: GroupAwardType[] = [
  'SOUL_CONNECTION',
  'PEOPLES_CHAMPION',
  'GROUP_LEADER',
  'POLAR_OPPOSITES',
];

/**
 * TOP 수상 후보에서 영구 제외되는 어워드 타입.
 * TOP_PRIORITY에 이 타입을 추가하면 실제 TOP 슬롯에 노출되지 않는다는 것을
 * 런타임 assertion + 유지보수자 문서로 고정.
 *
 * 왜 별도 상수로 두는가: "왜 트러블 메이커/이단아는 Layer 1 TOP에서 안 보이지?"라는
 * 의문이 생겼을 때 TOP_PRIORITY만 보고는 알 수 없으므로 정답을 한 곳에 남긴다.
 */
export const TOP_EXCLUDED_FROM_TOP: readonly GroupAwardType[] = [
  'CONTROVERSY_MAKER',
  'GROUP_OUTSIDER',
] as const;

// 모듈 로드 시점에 TOP_PRIORITY와 TOP_EXCLUDED_FROM_TOP이 disjoint인지 assertion.
// 누가 TOP_PRIORITY에 실수로 CONTROVERSY_MAKER를 추가하면 개발 단계에서 즉시 터진다.
if (process.env.NODE_ENV !== 'production') {
  for (const t of TOP_PRIORITY) {
    if (TOP_EXCLUDED_FROM_TOP.includes(t)) {
      throw new Error(
        `[my-medals] TOP_PRIORITY contains excluded award type "${t}". ` +
          `Remove it or revisit the spec decision (2026-04-25).`
      );
    }
  }
}

/**
 * 케미 파트너 슬롯 우선순위.
 * SOUL_CONNECTION을 기본 노출, TOP과 중복 시 POLAR_OPPOSITES로 대체.
 * POLAR_OPPOSITES도 중복/미수상이면 슬롯을 비운다.
 */
const PAIR_PRIORITY: GroupAwardType[] = ['SOUL_CONNECTION', 'POLAR_OPPOSITES'];

export interface MyMedal {
  awardType: GroupAwardType | 'PERSONA_LABEL' | 'TOP_FALLBACK';
  title: string;
  oneLiner: string;
  partnerNickname?: string;
}

export interface MyMedals {
  /** 1단: primary (그라디언트 보더) — 반드시 존재 */
  top: MyMedal;
  /** 2단: 케미 파트너 — TOP과 중복 또는 미수상 시 null */
  chemistryPartner: MyMedal | null;
  /** 3단: 성향 라벨 (폴백, 항상 존재) */
  personaLabel: MyMedal;
}

/** 쌍 어워드에서 currentUserId가 아닌 다른 winner의 닉네임 */
function findPartnerNickname(award: GroupAward, currentUserId: string): string | undefined {
  const idx = award.winners.findIndex((id) => id !== currentUserId);
  return idx >= 0 ? award.winnerNicknames[idx] : undefined;
}

function toMedal(award: GroupAward, currentUserId: string): MyMedal {
  return {
    awardType: award.type,
    title: award.title,
    oneLiner: award.oneLiner,
    partnerNickname: findPartnerNickname(award, currentUserId),
  };
}

/**
 * 수상 어워드 기반 훈장 3단 계산.
 *
 * 규칙 (2026-04-25 스펙):
 * - TOP: TOP_PRIORITY 순서로 내가 winners에 포함된 첫 어워드. TOP_EXCLUDED 타입은 후보에서 제외.
 *   없으면 personaLabel을 TOP 자리로 승격(TOP_FALLBACK 마커).
 * - chemistryPartner: PAIR_PRIORITY 순서, 단 TOP과 같은 awardType은 스킵.
 * - personaLabel: 호출자가 넘긴 값 그대로.
 */
export function getMyMedals(
  awards: GroupAward[],
  currentUserId: string,
  personaLabel: MyMedal
): MyMedals {
  const mine = awards.filter((a) => a.winners.includes(currentUserId));

  // TOP_PRIORITY 자체가 TOP_EXCLUDED와 disjoint하므로 추가 필터 불필요.
  // 유지보수 시 TOP_EXCLUDED 상수를 참고하여 TOP_PRIORITY를 수정할 것.
  const topAward =
    TOP_PRIORITY.map((t) => mine.find((a) => a.type === t)).find((a): a is GroupAward =>
      Boolean(a)
    ) ?? null;

  const top: MyMedal = topAward
    ? toMedal(topAward, currentUserId)
    : { ...personaLabel, awardType: 'TOP_FALLBACK' };

  const pairAward =
    PAIR_PRIORITY.map((t) => mine.find((a) => a.type === t && a.type !== topAward?.type)).find(
      (a): a is GroupAward => Boolean(a)
    ) ?? null;

  const chemistryPartner: MyMedal | null = pairAward ? toMedal(pairAward, currentUserId) : null;

  return { top, chemistryPartner, personaLabel };
}

/** TOP이 폴백(성향 라벨)으로 채워졌는지 여부 */
export function isTopFallback(medals: MyMedals): boolean {
  return medals.top.awardType === 'TOP_FALLBACK';
}
