/**
 * Bundle OG 디자인 variants (v1/v2/v3)
 *
 * 공통 Props:
 *   - category, participants, questions, theme
 *
 * 디자인 B 이미지 placeholder 영역은 PlaceholderBox로 표시.
 * 확정 후 이미지/SVG로 교체 예정.
 */
import type { ReactElement } from 'react';

import type { CategoryTheme } from '@/constants/categoryTheme';
import {
  BrandCtaBand,
  CategoryChip,
  OG_HEIGHT,
  OG_WIDTH,
  PlaceholderBox,
  formatWithCommas,
} from '@/lib/og/shared';

export interface BundleOgProps {
  participants: number;
  questions: number;
  theme: CategoryTheme;
}

const CTA_COPY = '나도 테스트하기 →';

/** V1 "Poster" — 풀 카테고리 그라데 배경 + 3단 수직 레이아웃 */
export function BundleV1Poster({ participants, questions, theme }: BundleOgProps): ReactElement {
  return (
    <div
      style={{
        width: OG_WIDTH,
        height: OG_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '56px',
        paddingBottom: '96px',
        position: 'relative',
        background: `linear-gradient(135deg, ${theme.start} 0%, ${theme.end} 100%)`,
        fontFamily: 'Pretendard',
      }}
    >
      {/* 상단 라벨 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          fontSize: '30px',
          fontWeight: 400,
          color: 'rgba(255,255,255,0.85)',
          letterSpacing: '6px',
        }}
      >
        {theme.label.toUpperCase()} · HOTPICK TEST
      </div>

      {/* 중앙 카테고리 심볼 */}
      <PlaceholderBox
        label={`[ ${theme.label} 심볼 이미지 ]\n320×320 · SVG/PNG`}
        width={320}
        height={320}
        accent="#ffffff"
        style={{
          background: 'rgba(255,255,255,0.14)',
          borderColor: 'rgba(255,255,255,0.7)',
          color: '#ffffff',
          whiteSpace: 'pre-wrap',
        }}
      />

      {/* 하단 메타 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'baseline',
          gap: '14px',
          color: '#ffffff',
        }}
      >
        <span style={{ fontSize: '56px', fontWeight: 900, fontFamily: 'Archivo Black' }}>
          {formatWithCommas(participants)}
        </span>
        <span style={{ fontSize: '28px', fontWeight: 400 }}>명 참여 ·</span>
        <span style={{ fontSize: '56px', fontWeight: 900, fontFamily: 'Archivo Black' }}>
          {questions}
        </span>
        <span style={{ fontSize: '28px', fontWeight: 400 }}>문항</span>
      </div>

      <BrandCtaBand copy={CTA_COPY} tone="light" />
    </div>
  );
}

/** V2 "Badge/Sticker" — 베이지 바탕 + 원형 뱃지 */
export function BundleV2Badge({ participants, questions, theme }: BundleOgProps): ReactElement {
  return (
    <div
      style={{
        width: OG_WIDTH,
        height: OG_HEIGHT,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 96px',
        position: 'relative',
        background: '#FFF9F2',
        fontFamily: 'Pretendard',
      }}
    >
      {/* 좌측 텍스트 */}
      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '600px', gap: '16px' }}>
        <CategoryChip label={theme.label} themeStart={theme.start} themeEnd={theme.end} />
        <div
          style={{
            display: 'flex',
            fontSize: '80px',
            fontWeight: 900,
            color: '#0a0a0a',
            letterSpacing: '-2.5px',
            lineHeight: 1.05,
          }}
        >
          {questions}문항의
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: '80px',
            fontWeight: 900,
            color: '#0a0a0a',
            letterSpacing: '-2.5px',
            lineHeight: 1.05,
          }}
        >
          가치관 도전
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '10px',
            marginTop: '12px',
          }}
        >
          <span
            style={{
              fontSize: '44px',
              fontWeight: 900,
              color: theme.start,
              fontFamily: 'Archivo Black',
            }}
          >
            {formatWithCommas(participants)}
          </span>
          <span style={{ fontSize: '28px', fontWeight: 400, color: '#555' }}>
            명이 이미 참여했어요
          </span>
        </div>
      </div>

      {/* 우측 원형 뱃지 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '420px',
          height: '420px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${theme.start}, ${theme.end})`,
          boxShadow: `0 24px 60px ${theme.start}55`,
          position: 'relative',
        }}
      >
        <PlaceholderBox
          label={`[ ${theme.label} 심볼 이미지 ]\n원형 뱃지 안 · 240×240`}
          width={260}
          height={260}
          accent="#ffffff"
          style={{
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.18)',
            borderColor: 'rgba(255,255,255,0.7)',
            color: '#ffffff',
            whiteSpace: 'pre-wrap',
          }}
        />
      </div>

      <BrandCtaBand copy={CTA_COPY} tone="dark" />
    </div>
  );
}

/** V3 "Stats-first" — 좌측 초대형 숫자 + 우측 심볼 */
export function BundleV3Stats({ participants, questions, theme }: BundleOgProps): ReactElement {
  return (
    <div
      style={{
        width: OG_WIDTH,
        height: OG_HEIGHT,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        position: 'relative',
        fontFamily: 'Pretendard',
      }}
    >
      {/* 좌측 — 수치 중심 */}
      <div
        style={{
          flex: 1.2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px 64px',
          background: '#0a0a0a',
          color: '#ffffff',
          gap: '10px',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: '24px',
            fontWeight: 400,
            color: 'rgba(255,255,255,0.6)',
            letterSpacing: '4px',
          }}
        >
          PARTICIPANTS
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: '180px',
            fontWeight: 900,
            fontFamily: 'Archivo Black',
            lineHeight: 1,
            letterSpacing: '-4px',
            color: theme.start,
          }}
        >
          {formatWithCommas(participants)}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: '40px',
            fontWeight: 900,
            marginTop: '20px',
          }}
        >
          명이 답한
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '40px', fontWeight: 900, color: '#ffffff' }}>
            {theme.label} 테스트
          </span>
          <span
            style={{
              fontSize: '28px',
              fontWeight: 400,
              color: 'rgba(255,255,255,0.55)',
            }}
          >
            · {questions}문항
          </span>
        </div>
      </div>

      {/* 우측 — 카테고리 비주얼 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${theme.start}, ${theme.end})`,
        }}
      >
        <PlaceholderBox
          label={`[ ${theme.label} 심볼 이미지 ]\n360×360 · SVG/PNG`}
          width={360}
          height={360}
          accent="#ffffff"
          style={{
            background: 'rgba(255,255,255,0.16)',
            borderColor: 'rgba(255,255,255,0.7)',
            color: '#ffffff',
            whiteSpace: 'pre-wrap',
          }}
        />
      </div>

      <BrandCtaBand copy={CTA_COPY} tone="light" />
    </div>
  );
}
