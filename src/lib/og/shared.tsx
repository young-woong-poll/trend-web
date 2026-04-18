/**
 * OG ImageResponse 공용 컴포넌트 & 헬퍼
 *
 * Satori 제약사항:
 *   - display: 'flex' 필수 (block 미지원)
 *   - grid 미지원
 *   - position: absolute OK
 *   - SVG 인라인 OK
 */
import type { CSSProperties, ReactElement } from 'react';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/** 숫자 콤마 포맷 */
export function formatWithCommas(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** 5% 단위 반올림 (matchRate 캐시 키 안정화) */
export function roundMatchRate(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n / 5) * 5));
}

/** memberCount 구간 반올림 (1/3/6/10/20/50) */
export function roundMemberCount(n: number): number {
  if (n <= 1) {
    return 1;
  }
  if (n <= 3) {
    return 3;
  }
  if (n <= 6) {
    return 6;
  }
  if (n <= 10) {
    return 10;
  }
  if (n <= 20) {
    return 20;
  }
  return 50;
}

/** 브랜드 CTA 밴드 — 하단 고정. 맥락별 카피 차별화. */
export function BrandCtaBand({
  copy,
  tone = 'light',
}: {
  copy: string;
  tone?: 'light' | 'dark';
}): ReactElement {
  const isLight = tone === 'light';
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '72px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 48px',
        background: isLight
          ? 'linear-gradient(90deg, rgba(0,0,0,0.88), rgba(0,0,0,0.95))'
          : 'linear-gradient(90deg, rgba(255,255,255,0.95), rgba(255,255,255,0.88))',
        color: isLight ? '#ffffff' : '#0a0a0a',
        fontFamily: 'Pretendard',
        fontWeight: 900,
        fontSize: '26px',
        letterSpacing: '-0.3px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          fontFamily: 'Archivo Black',
          fontSize: '28px',
          letterSpacing: '-0.5px',
        }}
      >
        HotPick
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>{copy}</div>
    </div>
  );
}

/** 이미지 교체 예정 플레이스홀더 — 제작할 자리를 시각적으로 표시 */
export function PlaceholderBox({
  label,
  width,
  height,
  style,
  accent = '#ff00ff',
}: {
  label: string;
  width: number | string;
  height: number | string;
  style?: CSSProperties;
  accent?: string;
}): ReactElement {
  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `3px dashed ${accent}`,
        borderRadius: '16px',
        background: `${accent}14`,
        color: accent,
        fontFamily: 'Pretendard',
        fontWeight: 900,
        fontSize: '22px',
        letterSpacing: '-0.3px',
        textAlign: 'center',
        padding: '12px',
        ...style,
      }}
    >
      {label}
    </div>
  );
}

/** 카테고리 라벨 칩 (좌상단 배치용) */
export function CategoryChip({
  label,
  themeStart,
  themeEnd,
}: {
  label: string;
  themeStart: string;
  themeEnd: string;
}): ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 22px',
        borderRadius: '999px',
        background: `linear-gradient(90deg, ${themeStart}, ${themeEnd})`,
        color: '#ffffff',
        fontFamily: 'Pretendard',
        fontWeight: 900,
        fontSize: '24px',
        letterSpacing: '-0.3px',
        boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
      }}
    >
      {label}
    </div>
  );
}
