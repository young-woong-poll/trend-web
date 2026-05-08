// src/lib/tetoEgenAdjective.ts
//
// Teto-Egen 결과 화면의 빅워드 수식어 매핑.
// 비율 기반 자동 매핑 — BE 변경 없이 FE에서만 처리.
// 스펙: docs/superpowers/specs/2026-05-08-teto-egen-result-redesign-design.md
//
// 매핑 규칙:
//   85%+      : "쌉" (compound, 한 단어 — 쌉테토)
//   75~84%    : "찐" (compound, 한 단어 — 찐테토)
//   60~74%    : (수식어 없음, bare — 테토)
//   50~59%    : "은근 [반대]인" (spaced, 두 줄)
//   친구 1~2명: (수식어 없음, bare — 표본 부족)

import type { TetoEgenAnswer } from '@/types/ask-teto-egen';

export type AdjectiveDisplay = 'compound' | 'spaced' | 'bare';

export type AdjectiveResult = {
  modifier: string | null;
  result: TetoEgenAnswer;
  display: AdjectiveDisplay;
};

const SPARSE_THRESHOLD = 2;
const COMPOUND_STRONG_RATIO = 0.85;
const COMPOUND_MEDIUM_RATIO = 0.75;
const BARE_RATIO = 0.6;

const labelOf = (a: TetoEgenAnswer) => (a === 'TETO' ? '테토' : '에겐');

export function getResultAdjective(
  tetoCount: number,
  egenCount: number,
  selfAnswer: TetoEgenAnswer
): AdjectiveResult {
  const total = tetoCount + egenCount;

  // 호출자가 empty(0/0) 분기를 먼저 처리해야 한다. 방어적으로 bare 폴백.
  if (total === 0) {
    return { modifier: null, result: selfAnswer, display: 'bare' };
  }

  // 다수표 결정 (동률은 selfAnswer 우선 → hit 처리)
  let result: TetoEgenAnswer;
  let majorityCount: number;
  if (tetoCount === egenCount) {
    result = selfAnswer;
    majorityCount = tetoCount;
  } else if (tetoCount > egenCount) {
    result = 'TETO';
    majorityCount = tetoCount;
  } else {
    result = 'EGEN';
    majorityCount = egenCount;
  }

  // 표본 부족 — 수식어 미노출
  if (total <= SPARSE_THRESHOLD) {
    return { modifier: null, result, display: 'bare' };
  }

  const ratio = majorityCount / total;
  const opposite: TetoEgenAnswer = result === 'TETO' ? 'EGEN' : 'TETO';

  if (ratio >= COMPOUND_STRONG_RATIO) {
    return { modifier: '쌉', result, display: 'compound' };
  }
  if (ratio >= COMPOUND_MEDIUM_RATIO) {
    return { modifier: '찐', result, display: 'compound' };
  }
  if (ratio >= BARE_RATIO) {
    return { modifier: null, result, display: 'bare' };
  }
  return { modifier: `은근 ${labelOf(opposite)}인`, result, display: 'spaced' };
}

// Hero 빅워드 표시용 — display 분기에 따라 한 단어 또는 결과 단어만 반환.
// spaced 케이스의 수식어 줄은 별도 컴포넌트에서 modifier 값을 그대로 노출한다.
export function getBigword(adj: AdjectiveResult): string {
  const resultLabel = labelOf(adj.result);
  if (adj.display === 'compound' && adj.modifier) {
    return `${adj.modifier}${resultLabel}`;
  }
  return resultLabel;
}
