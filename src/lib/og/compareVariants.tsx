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
  memberCount: number;
  groupName?: string;
  bundleTitle?: string;
  origin?: string;
}

// GROUP V2는 편지 봉투 디자인상 CTA 밴드 생략

/**
 * V2 "Torn-open Envelope with Letter" — 봉투가 뜯어져 편지지가 빠져나온 구조
 *
 * 레이어 (back → front):
 *   1. 흰 배경
 *   2. 봉투 몸통 (좌/우/하 테두리 + 대각선 flap 라인) — 상단은 뜯어져 열림
 *   3. 편지지 카드 (봉투 안에서 위로 빠져나와 상단에 걸림) — TEAM 라벨 + groupName
 *   4. "초대합니다" 초거대 타이포 (최상위, 편지지·봉투 위로 떠 있음)
 *   5. "현재 N명 참여 중" (초대합니다 아래)
 *   6. CTA 밴드
 */
export function GroupV2Invited({
  theme,
  memberCount,
  groupName,
  bundleTitle,
  origin,
}: GroupOgProps): ReactElement {
  const displayName = groupName && groupName.length > 0 ? groupName : '그룹';
  const titleText = bundleTitle && bundleTitle.length > 0 ? bundleTitle : '가치관 비교';
  const bgImageUrl = origin ? `${origin}/og/envelope-bg.png` : null;

  return (
    <div
      style={{
        width: OG_WIDTH,
        height: OG_HEIGHT,
        display: 'flex',
        position: 'relative',
        background: '#FDFBF2',
        fontFamily: 'Pretendard',
      }}
    >
      {/* Layer 1: 봉투 배경 이미지 (풀 캔버스) — origin 없으면 fallback 단색 */}
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

      {/*
       * Layer 2: 편지지 영역 — {groupName}
       * 팀 이름 강조 · 카테고리 색 · 편지지 기울어진 느낌 rotate 2deg
       */}
      <div
        style={{
          position: 'absolute',
          top: '88px',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          transform: 'rotate(2deg)',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: '60px',
            fontWeight: 900,
            color: '#1a1208',
            letterSpacing: '-1px',
            lineHeight: 1,
          }}
        >
          {displayName}
          <span
            style={{
              fontSize: '60px',
              paddingLeft: '8px',
              fontWeight: 500,
              color: '#1a1208',
              letterSpacing: '-1px',
              lineHeight: 1,
            }}
          >
            에
          </span>
        </div>
      </div>

      {/* Layer 3: "초대합니다" 초거대 (봉투 상단 flap 영) */}
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
      </div>

      {/*
       * Layer 4: "{bundle.title} ⋅ {N}명" — 봉투 하단 flap 위
       *   bundle.title: 주제(#1a1208, 44px)
       *   ⋅: 구분자(#8a7748, 44px)
       *   {N}명: 인원 (숫자는 theme.start 강조 · 56px / "명"은 서브 36px)
       */}
      <div
        style={{
          position: 'absolute',
          top: '448px',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'baseline',
          gap: '14px',
        }}
      >
        {/* bundle.title */}
        <span
          style={{
            display: 'flex',
            fontSize: '60px',
            fontWeight: 900,
            color: theme.start,
            letterSpacing: '-1px',
            lineHeight: 1,
          }}
        >
          {titleText}
        </span>

        {/* N명 */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
          <span
            style={{
              display: 'flex',
              fontSize: '56px',
              fontWeight: 500,
              color: '#1a1208',
              letterSpacing: '-1px',
              lineHeight: 1,
            }}
          >
            / 현재{' '}
            <span
              style={{
                fontWeight: 900,
                paddingLeft: '8px',
              }}
            >
              {memberCount}명
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
