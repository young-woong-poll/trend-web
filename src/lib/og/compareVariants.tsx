/**
 * Compare OG 디자인 variants
 *
 * 레이아웃 원칙: root = flex column + space-between + paddingBottom(96px for CTA 여유)
 *   - 상단 (top band) / 중앙 (hero) / 하단 (bottom band)
 *   - CTA 밴드는 absolute bottom:0 (72px)
 */
import type { ReactElement } from 'react';

import type { ChemistryInfo } from '@/constants/bundle';
import type { CategoryTheme } from '@/constants/categoryTheme';
import { OG_HEIGHT, OG_WIDTH, PlaceholderBox } from '@/lib/og/shared';

// ═══════════════════════════════════════════════════════════════════════
// ONE_TO_ONE PENDING (신청 링크)
// ═══════════════════════════════════════════════════════════════════════

export interface PendingOgProps {
  theme: CategoryTheme;
  origin?: string;
  bundleTitle?: string;
  creatorName?: string;
}

// PENDING/GROUP V2는 편지 봉투 디자인상 CTA 밴드 생략 (배경 자체가 브랜드 전달)

/**
 * V2 "Challenge Letter" (Option B = Level 3 편지 메타포 통합)
 *
 * GROUP V2(초대장)와 쌍을 이루는 "도전장 편지"
 *   - 어두운 봉투 배경 이미지 — `/og/envelop-dark-bg.png`
 *   - Layer 2 (상단 편지지): bundle.title (테마 색)
 *   - Layer 3 (중앙, 최상위): "도 전 장" 초거대 (GROUP V2의 "초대합니다"와 대응)
 *   - Layer 4 (하단): "from. {보낸사람}"
 */
export function PendingV2Duel({ origin, bundleTitle, creatorName }: PendingOgProps): ReactElement {
  const bgImageUrl = origin ? `${origin}/og/envelop-dark-bg.png` : null;
  const titleText = bundleTitle && bundleTitle.length > 0 ? bundleTitle : '가치관 대결';
  const senderText = creatorName && creatorName.length > 0 ? creatorName : '친구';

  return (
    <div
      style={{
        width: OG_WIDTH,
        height: OG_HEIGHT,
        display: 'flex',
        position: 'relative',
        background: '#3a3a3a',
        fontFamily: 'Pretendard',
      }}
    >
      {/* Layer 1: 도전장 봉투 배경 이미지 */}
      {bgImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bgImageUrl}
          alt=""
          width={1200}
          height={630}
          style={{ position: 'absolute', top: 0, left: 0 }}
        />
      ) : (
        <PlaceholderBox
          label={`[ 도전장 봉투 배경 ]\n어두운 봉투 + 크림 편지지\n1200×630 · PNG`}
          width={1200}
          height={630}
          accent="#F5EFE0"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            background: '#3a3a3a',
            borderStyle: 'dashed',
            borderRadius: 0,
            color: '#F5EFE0',
            fontSize: '18px',
            whiteSpace: 'pre-wrap',
          }}
        />
      )}

      {/* Layer 2: 상단 편지지 영역 — bundle.title (GROUP V2 동일 CSS) */}
      <div
        style={{
          position: 'absolute',
          top: '80px',
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: '60px',
            fontWeight: 900,
            color: '#3a3a3a',
            letterSpacing: '-1px',
            lineHeight: 1,
            transform: 'rotate(2deg)',
          }}
        >
          {titleText}
        </div>
      </div>

      {/* Layer 3: "도 전 장" 초거대 (GROUP V2 "초대합니다" 동일 CSS + 노란색) */}
      <div
        style={{
          position: 'absolute',
          top: '216px',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: '176px',
            fontWeight: 900,
            color: '#ffd900',
            lineHeight: 1,
            textShadow: '0 4px 32px rgba(0,0,0,1)',
          }}
        >
          도 전 장
        </div>
      </div>

      {/* Layer 4: "from. {보낸사람}" (GROUP V2 하단 라인 동일 CSS) */}
      <div
        style={{
          position: 'absolute',
          top: '440px',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'baseline',
          gap: '6px',
          color: '#ffffff',
          fontWeight: 500,
        }}
      >
        <span style={{ display: 'flex', fontSize: '48px' }}>From.</span>
        <span
          style={{
            paddingLeft: '4px',
            display: 'flex',
            fontSize: '60px',
            fontWeight: 900,
            color: '#fff',
            letterSpacing: '-1px',
          }}
        >
          {senderText}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ONE_TO_ONE DONE / MATCH (결과 공유)
// ═══════════════════════════════════════════════════════════════════════

export interface MatchOgProps {
  theme: CategoryTheme;
  chemistry: ChemistryInfo;
  matchRate: number;
  bundleTitle?: string;
  creatorName?: string;
  participantName?: string;
  origin?: string;
}

/**
 * V2 "Game Complete" — 어두운 배경 + 방사형 빛
 * V3와 동일한 문구 · V3 스케일에 맞춰 여백·정렬 정돈
 */
export function MatchV2Certificate({
  theme,
  chemistry,
  matchRate,
  bundleTitle,
  creatorName,
  participantName,
}: MatchOgProps): ReactElement {
  const titleText = bundleTitle && bundleTitle.length > 0 ? bundleTitle : '가치관 결과';
  const leftName = creatorName && creatorName.length > 0 ? creatorName : '친구1';
  const rightName = participantName && participantName.length > 0 ? participantName : '친구2';

  return (
    <div
      style={{
        width: OG_WIDTH,
        height: OG_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '60px',
        paddingBottom: '72px',
        position: 'relative',
        background: '#0a0a0a',
        fontFamily: 'Pretendard',
      }}
    >
      {/* 방사형 빛 오버레이 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          background: `radial-gradient(circle at center, ${theme.start}44 0%, transparent 65%)`,
        }}
      />

      {/* 상단 블록: bundle.title + 이름 (V3 동일 스케일) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: '60px',
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: '-1px',
            lineHeight: 1,
          }}
        >
          {titleText}
        </div>
        <div style={{ display: 'flex', marginTop: '24px', alignItems: 'baseline', gap: '14px' }}>
          <span style={{ display: 'flex', fontSize: '48px', fontWeight: 900, color: '#ffffff' }}>
            {leftName}
          </span>
          <span
            style={{
              display: 'flex',
              fontSize: '32px',
              fontWeight: 900,
              color: theme.start,
              letterSpacing: '4px',
            }}
          >
            X
          </span>
          <span style={{ display: 'flex', fontSize: '48px', fontWeight: 900, color: '#ffffff' }}>
            {rightName}
          </span>
        </div>
      </div>

      {/* 중앙 블록: 거대 등급 (V3의 220 대비 어두운 배경이라 240으로 약간 강조) */}
      <div
        style={{
          display: 'flex',
          fontSize: '240px',
          fontFamily: 'Archivo Black',
          color: 'transparent',
          backgroundImage: chemistry.gradient,
          backgroundClip: 'text',
          lineHeight: 1,
          letterSpacing: '-8px',
        }}
      >
        {chemistry.grade}
      </div>

      {/* 하단 블록: 매치율 + chemistry.title */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
        <span
          style={{
            display: 'flex',
            fontSize: '48px',
            fontWeight: 900,
            color: theme.start,
            letterSpacing: '-1px',
            lineHeight: 1,
          }}
        >
          {matchRate}%
        </span>
        <span
          style={{
            display: 'flex',
            fontSize: '48px',
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: '-1px',
            lineHeight: 1,
          }}
        >
          · {chemistry.title}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// GROUP (그룹 초대)
// ═══════════════════════════════════════════════════════════════════════

export interface GroupOgProps {
  theme: CategoryTheme;
  bundleTitle?: string;
  origin?: string;
}

// GROUP V2는 편지 봉투 디자인상 CTA 밴드 생략

/**
 * V2 "Envelope Invitation" — 편지 봉투 배경 + "초대합니다" + 번들 제목.
 *
 * 캐싱 키 = 번들(start/end/bundleTitle) 기준. token당 1장 고정.
 * 그룹명/인원수는 이미지에서 제거 → OG description에서만 동적 노출.
 */
export function GroupV2Invited({ theme, bundleTitle, origin }: GroupOgProps): ReactElement {
  const titleText = bundleTitle && bundleTitle.length > 0 ? bundleTitle : '가치관 비교';
  const bgImageUrl = origin ? `${origin}/og/envelope-bg.png` : null;

  return (
    <div
      style={{
        width: OG_WIDTH,
        height: OG_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '40px',
        position: 'relative',
        background: '#FDFBF2',
        fontFamily: 'Pretendard',
      }}
    >
      {/* Layer 1: 봉투 배경 이미지 */}
      {bgImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bgImageUrl}
          alt=""
          width={1200}
          height={630}
          style={{ position: 'absolute', top: 0, left: 0 }}
        />
      )}

      {/* Layer 2: "초대합니다" */}
      <div
        style={{
          display: 'flex',
          fontSize: '160px',
          fontWeight: 900,
          color: '#1a1208',
          letterSpacing: '-4px',
          lineHeight: 1,
          textShadow: '0 6px 18px rgba(0,0,0,0.18)',
        }}
      >
        초대합니다
      </div>

      {/* Layer 3: 번들 제목 — 카테고리 테마 색 */}
      <div
        style={{
          display: 'flex',
          maxWidth: '1000px',
          padding: '0 80px',
          fontSize: '60px',
          fontWeight: 900,
          color: theme.start,
          letterSpacing: '-1px',
          lineHeight: 1.1,
          textAlign: 'center',
          wordBreak: 'keep-all',
        }}
      >
        {titleText}
      </div>
    </div>
  );
}
