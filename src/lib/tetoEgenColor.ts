// src/lib/tetoEgenColor.ts
//
// Teto-Egen 결과 → 컬러 토큰 매핑.
// Hero gradient·페이지 배경 ambient·me row 강조 등 결과 색상에 묶이는 모든 요소가 같은 매핑을 따른다.
// 스펙: docs/superpowers/specs/2026-05-08-teto-egen-result-redesign-design.md

import type { TetoEgenAnswer } from '@/types/ask-teto-egen';

// SCSS 변수와 1:1 대응. _variables.scss의 $teto-blue / $egen-red.
const TETO_BASE = '#4d8bff';
const EGEN_BASE = '#ff4d6d';
const TETO_GRADIENT_END = '#00c2ff';
const EGEN_GRADIENT_END = '#ff7a00';

export type ResultColorTokens = {
  base: string; // 기본 색상 (빅워드 시작점, voter chip 등)
  gradient: string; // 빅워드 background-image
  glow: string; // 빅워드 text-shadow / 아바타 box-shadow
  ambient: {
    primary: string; // 페이지 배경 radial gradient stop
    secondary: string;
  };
};

export function getResultColorTokens(result: TetoEgenAnswer): ResultColorTokens {
  if (result === 'TETO') {
    return {
      base: TETO_BASE,
      gradient: `linear-gradient(135deg, ${TETO_BASE} 10%, ${TETO_GRADIENT_END} 90%)`,
      glow: 'rgba(77, 139, 255, 0.4)',
      ambient: {
        primary: 'rgba(77, 139, 255, 0.34)',
        secondary: 'rgba(0, 194, 255, 0.18)',
      },
    };
  }
  return {
    base: EGEN_BASE,
    gradient: `linear-gradient(135deg, ${EGEN_BASE} 10%, ${EGEN_GRADIENT_END} 90%)`,
    glow: 'rgba(255, 77, 109, 0.4)',
    ambient: {
      primary: 'rgba(255, 77, 109, 0.34)',
      secondary: 'rgba(255, 122, 0, 0.18)',
    },
  };
}
