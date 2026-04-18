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
import { BrandCtaBand, CategoryChip, OG_HEIGHT, OG_WIDTH, PlaceholderBox } from '@/lib/og/shared';

// ═══════════════════════════════════════════════════════════════════════
// ONE_TO_ONE PENDING (신청 링크)
// ═══════════════════════════════════════════════════════════════════════

export interface PendingOgProps {
  theme: CategoryTheme;
  origin?: string;
  bundleTitle?: string;
  creatorName?: string;
}

const CTA_PENDING = '도전 받아들이기 →';

/**
 * V1 "Boxing Poster + Frame" (Option A = Level 1 + Level 2)
 *
 * 권투 포스터 톤 유지 + 얇은 외곽 프레임(통일감) + 카테고리 색 accent
 *   - 검정 배경 + 골드 VS 엠블럼 (주인공)
 *   - 상단 배너는 카테고리 색 서브라벨 + 골드 메인 (GROUP V2와 accent 룰 공유)
 *   - 외곽 2중 골드 프레임 (포스터 · 카드 통일감)
 */
export function PendingV1Boxing({ theme }: PendingOgProps): ReactElement {
  return (
    <div
      style={{
        width: OG_WIDTH,
        height: OG_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '80px',
        paddingBottom: '104px',
        position: 'relative',
        background: '#0a0a0a',
        fontFamily: 'Pretendard',
      }}
    >
      {/* 외곽 2중 골드 프레임 (포스터 통일감) */}
      <div
        style={{
          position: 'absolute',
          top: '32px',
          left: '32px',
          right: '32px',
          bottom: '104px',
          display: 'flex',
          border: '1px solid rgba(255,215,0,0.4)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '42px',
          left: '42px',
          right: '42px',
          bottom: '114px',
          display: 'flex',
          border: '1px solid rgba(255,215,0,0.15)',
        }}
      />

      {/* 상단 배너 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: '18px',
            fontWeight: 700,
            color: theme.start,
            letterSpacing: '10px',
          }}
        >
          CHALLENGE · {theme.label.toUpperCase()}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: '30px',
            fontWeight: 900,
            color: '#FFD700',
            letterSpacing: '10px',
          }}
        >
          도전장 도착
        </div>
      </div>

      {/* 중앙 VS 엠블럼 */}
      <PlaceholderBox
        label={`[ VS 엠블럼 ]\n골드 그라데 · 권투 포스터\n280×280`}
        width={280}
        height={280}
        accent="#FFD700"
        style={{
          background: 'rgba(255,215,0,0.06)',
          color: '#FFD700',
          whiteSpace: 'pre-wrap',
        }}
      />

      {/* 하단 카피 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', fontSize: '44px', fontWeight: 900, color: '#ffffff' }}>
          받아들이시겠습니까?
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: '20px',
            fontWeight: 400,
            color: 'rgba(255,255,255,0.55)',
            letterSpacing: '2px',
          }}
        >
          {theme.label} 1:1 가치관 대결
        </div>
      </div>

      <BrandCtaBand copy={CTA_PENDING} tone="light" />
    </div>
  );
}

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
  const bgImageUrl = origin ? `${origin}/og/envelop-dark-bg4.png` : null;
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
            color: '3a3a3a',
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

/** V3 "Bold Minimal" — 거대 VS 타이포 + 한 줄 카피 */
export function PendingV3Minimal({ theme }: PendingOgProps): ReactElement {
  return (
    <div
      style={{
        width: OG_WIDTH,
        height: OG_HEIGHT,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        background: '#FFF9F2',
        fontFamily: 'Pretendard',
      }}
    >
      {/* 좌측 거대 VS */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '320px',
          fontFamily: 'Archivo Black',
          fontWeight: 900,
          color: 'transparent',
          backgroundImage: `linear-gradient(135deg, ${theme.start}, ${theme.end})`,
          backgroundClip: 'text',
          lineHeight: 1,
          letterSpacing: '-18px',
          paddingBottom: '72px',
        }}
      >
        VS
      </div>

      {/* 우측 카피 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '16px',
          paddingRight: '90px',
          paddingBottom: '72px',
        }}
      >
        <CategoryChip label={theme.label} themeStart={theme.start} themeEnd={theme.end} />
        <div
          style={{
            display: 'flex',
            fontSize: '66px',
            fontWeight: 900,
            color: '#0a0a0a',
            letterSpacing: '-2px',
            lineHeight: 1.08,
          }}
        >
          우리 얼마나
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: '66px',
            fontWeight: 900,
            color: '#0a0a0a',
            letterSpacing: '-2px',
            lineHeight: 1.08,
          }}
        >
          생각이 맞을까?
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: '22px',
            fontWeight: 400,
            color: '#555',
            marginTop: '6px',
          }}
        >
          1:1 가치관 대결 · 클릭해서 응답
        </div>
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
}

const CTA_MATCH = '우리도 해볼래? →';

/** V1 "Trophy" — 등급 그라데 풀 배경 + 중앙 등급·매치율 */
export function MatchV1Trophy({ theme, chemistry, matchRate }: MatchOgProps): ReactElement {
  return (
    <div
      style={{
        width: OG_WIDTH,
        height: OG_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '48px',
        paddingBottom: '96px',
        position: 'relative',
        background: chemistry.gradient,
        fontFamily: 'Pretendard',
      }}
    >
      {/* 상단 배너 */}
      <div
        style={{
          display: 'flex',
          fontSize: '28px',
          fontWeight: 700,
          color: 'rgba(255,255,255,0.95)',
          letterSpacing: '6px',
        }}
      >
        {theme.label.toUpperCase()} MATCH RESULT
      </div>

      {/* 중앙 등급 + 매치율 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '32px',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: '260px',
            fontWeight: 900,
            fontFamily: 'Archivo Black',
            color: '#ffffff',
            lineHeight: 1,
            letterSpacing: '-8px',
          }}
        >
          {chemistry.grade}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '4px',
          }}
        >
          <span
            style={{
              display: 'flex',
              fontSize: '140px',
              fontWeight: 900,
              fontFamily: 'Archivo Black',
              color: '#ffffff',
              lineHeight: 1,
              letterSpacing: '-4px',
            }}
          >
            {matchRate}
          </span>
          <span
            style={{
              display: 'flex',
              fontSize: '48px',
              fontWeight: 900,
              color: 'rgba(255,255,255,0.9)',
            }}
          >
            %
          </span>
        </div>
      </div>

      {/* 하단 타이틀 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <div
          style={{
            display: 'flex',
            fontSize: '46px',
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: '-1px',
          }}
        >
          {chemistry.title}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: '22px',
            fontWeight: 400,
            color: 'rgba(255,255,255,0.88)',
          }}
        >
          {chemistry.description}
        </div>
      </div>

      <BrandCtaBand copy={CTA_MATCH} tone="light" />
    </div>
  );
}

/** V2 "Certificate" — 흰 배경 + 외곽 테두리 + 엠블럼 */
export function MatchV2Certificate({ theme, chemistry, matchRate }: MatchOgProps): ReactElement {
  return (
    <div
      style={{
        width: OG_WIDTH,
        height: OG_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '64px',
        paddingBottom: '96px',
        paddingLeft: '80px',
        paddingRight: '80px',
        position: 'relative',
        background: '#FFFDF8',
        fontFamily: 'Pretendard',
      }}
    >
      {/* 외곽 테두리 장식 (CTA 밴드 영역은 침범하지 않도록 bottom:96) */}
      <div
        style={{
          position: 'absolute',
          top: '32px',
          left: '32px',
          right: '32px',
          bottom: '96px',
          display: 'flex',
          border: `2px solid ${theme.start}`,
          borderRadius: '6px',
        }}
      />

      {/* 상단 타이틀 */}
      <div
        style={{
          display: 'flex',
          fontSize: '24px',
          fontWeight: 700,
          color: theme.start,
          letterSpacing: '12px',
        }}
      >
        MATCH CERTIFICATE
      </div>

      {/* 중앙: 엠블럼 + 매치율 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <PlaceholderBox
          label={`[ ${chemistry.grade}등급 엠블럼 ]\n240×240`}
          width={240}
          height={240}
          accent={theme.start}
          style={{
            borderRadius: '50%',
            background: `${theme.start}10`,
            whiteSpace: 'pre-wrap',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span
            style={{
              display: 'flex',
              fontSize: '80px',
              fontWeight: 900,
              fontFamily: 'Archivo Black',
              color: '#0a0a0a',
              letterSpacing: '-2px',
              lineHeight: 1,
            }}
          >
            {matchRate}
          </span>
          <span style={{ display: 'flex', fontSize: '40px', fontWeight: 900, color: theme.start }}>
            %
          </span>
        </div>
      </div>

      {/* 하단 타이틀 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
        <div
          style={{
            display: 'flex',
            fontSize: '34px',
            fontWeight: 900,
            color: '#0a0a0a',
            letterSpacing: '-1px',
          }}
        >
          {chemistry.title}
        </div>
        <div style={{ display: 'flex', fontSize: '20px', fontWeight: 400, color: '#555' }}>
          {theme.label} · {chemistry.description}
        </div>
      </div>

      <BrandCtaBand copy={CTA_MATCH} tone="dark" />
    </div>
  );
}

/** V3 "Split" — 좌측 등급색 풀블록 + 우측 상세 */
export function MatchV3Split({ theme, chemistry, matchRate }: MatchOgProps): ReactElement {
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
      {/* 좌측 — 등급 대문짝 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: chemistry.gradient,
          position: 'relative',
          paddingBottom: '72px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '40px',
            left: '40px',
            display: 'flex',
            fontSize: '20px',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.8)',
            letterSpacing: '4px',
          }}
        >
          GRADE
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: '420px',
            fontWeight: 900,
            fontFamily: 'Archivo Black',
            color: '#ffffff',
            lineHeight: 0.85,
            letterSpacing: '-14px',
          }}
        >
          {chemistry.grade}
        </div>
      </div>

      {/* 우측 — 매치율 + 타이틀 + 설명 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 60px 140px 60px',
          gap: '10px',
          background: '#FFFDF8',
        }}
      >
        <CategoryChip label={theme.label} themeStart={theme.start} themeEnd={theme.end} />
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '6px',
            marginTop: '14px',
          }}
        >
          <span
            style={{
              display: 'flex',
              fontSize: '140px',
              fontWeight: 900,
              fontFamily: 'Archivo Black',
              color: '#0a0a0a',
              letterSpacing: '-5px',
              lineHeight: 1,
            }}
          >
            {matchRate}
          </span>
          <span
            style={{
              display: 'flex',
              fontSize: '64px',
              fontWeight: 900,
              color: theme.start,
            }}
          >
            %
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: '46px',
            fontWeight: 900,
            color: '#0a0a0a',
            letterSpacing: '-1.5px',
            lineHeight: 1.1,
            marginTop: '6px',
          }}
        >
          {chemistry.title}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: '22px',
            fontWeight: 400,
            color: '#555',
            lineHeight: 1.4,
          }}
        >
          {chemistry.description}
        </div>
      </div>

      <BrandCtaBand copy={CTA_MATCH} tone="light" />
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
  origin?: string;
}

const CTA_GROUP = '그룹에 참여하기 →';

/**
 * V1 "Opened Envelope" — 봉투가 열려 편지지가 나온 느낌
 *
 * 배경: 베이지 종이 톤 · 상단에 봉투 뚜껑 placeholder · 중앙에 흰 편지지 카드
 * 편지지 안에 wax seal + "초대합니다" + memberCount
 */
export function GroupV1Team({ theme, memberCount }: GroupOgProps): ReactElement {
  return (
    <div
      style={{
        width: OG_WIDTH,
        height: OG_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        background: 'linear-gradient(180deg, #E8D8BD 0%, #F5E9D0 50%, #FFF8ED 100%)',
        fontFamily: 'Pretendard',
        paddingBottom: '72px',
      }}
    >
      {/* 상단 봉투 뚜껑 자리 */}
      <PlaceholderBox
        label={`[ 봉투 뚜껑 (열린 사다리꼴) ]\n1200×160 · SVG`}
        width={1200}
        height={160}
        accent={theme.start}
        style={{
          background: `linear-gradient(180deg, ${theme.start}44 0%, ${theme.end}22 100%)`,
          borderRadius: 0,
          border: 'none',
          borderBottom: `2px dashed ${theme.start}66`,
          color: '#6b4a1f',
          whiteSpace: 'pre-wrap',
        }}
      />

      {/* 편지지 카드 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '860px',
          marginTop: '-40px',
          background: '#FFFEF8',
          borderRadius: '6px',
          boxShadow: '0 30px 60px rgba(0,0,0,0.18)',
          padding: '40px 60px 48px 60px',
          gap: '18px',
        }}
      >
        {/* Wax seal */}
        <PlaceholderBox
          label={`[ wax seal ]\n80×80`}
          width={80}
          height={80}
          accent={theme.start}
          style={{
            borderRadius: '50%',
            background: `radial-gradient(circle, ${theme.start}, ${theme.end})`,
            border: `2px solid ${theme.start}`,
            color: '#ffffff',
            fontSize: '12px',
            whiteSpace: 'pre-wrap',
          }}
        />
        <div
          style={{
            display: 'flex',
            fontSize: '88px',
            fontWeight: 900,
            color: '#1a1208',
            letterSpacing: '-2px',
            lineHeight: 1,
          }}
        >
          초대합니다
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '6px',
          }}
        >
          <span
            style={{
              display: 'flex',
              fontSize: '52px',
              fontWeight: 900,
              fontFamily: 'Archivo Black',
              color: theme.start,
              letterSpacing: '-2px',
            }}
          >
            {memberCount}
          </span>
          <span style={{ display: 'flex', fontSize: '30px', fontWeight: 700, color: '#3c2a15' }}>
            명과 {theme.label} 케미 비교
          </span>
        </div>
      </div>

      <BrandCtaBand copy={CTA_GROUP} tone="dark" />
    </div>
  );
}

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
  origin,
}: GroupOgProps): ReactElement {
  const displayName = groupName && groupName.length > 0 ? groupName : '그룹 비교';
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
       * Layer 2: 편지지 영역 내 텍스트 (배경 이미지의 상단 편지지 직사각형 위)
       * 배경 이미지의 편지지 영역 = 대략 x: 230~970, y: 0~80 (폭 740, 높이 80)
       */}
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
            color: theme.start,
            letterSpacing: '-1px',
            lineHeight: 1,
            transform: 'rotate(2deg)',
          }}
        >
          {displayName}{' '}
          <span
            style={{
              display: 'flex',
              paddingLeft: '8px',
              fontSize: '36px',
              fontWeight: 700,
              color: '#1a1208',
              lineHeight: 2,
            }}
          >
            에
          </span>
        </div>
      </div>

      {/* Layer 3: "초대합니다" 초거대 (봉투 상단 flap 영역) */}
      <div
        style={{
          position: 'absolute',
          top: '208px',
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

      {/* Layer 4: "현재 N명 참여 중" (봉투 하단 flap 영역 위) */}
      <div
        style={{
          position: 'absolute',
          top: '448px',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'baseline',
          gap: '6px',
          color: '#3c2a15',
          fontWeight: 700,
        }}
      >
        <span style={{ display: 'flex', fontSize: '60px' }}>현재 </span>
        <span
          style={{
            paddingLeft: '4px',
            display: 'flex',
            fontSize: '60px',
            fontFamily: 'Archivo Black',
            color: theme.start,
            letterSpacing: '-1px',
          }}
        >
          {memberCount}
        </span>
        <span style={{ display: 'flex', fontSize: '60px' }}>명 참여중</span>
      </div>
    </div>
  );
}

/**
 * V3 "Envelope + Letter Split" — 좌측 봉투(wax seal) · 우측 편지(초대합니다)
 *
 * 좌측은 카테고리 색 봉투, 우측은 크림 편지지
 */
export function GroupV3Count({ theme, memberCount }: GroupOgProps): ReactElement {
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
      {/* 좌측 — 봉투 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${theme.start}, ${theme.end})`,
          position: 'relative',
          paddingBottom: '72px',
          gap: '24px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '48px',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.85)',
            letterSpacing: '8px',
          }}
        >
          HOTPICK INVITES
        </div>

        {/* Wax seal */}
        <PlaceholderBox
          label={`[ wax seal ]\n원형 밀봉 · 200×200`}
          width={200}
          height={200}
          accent="#ffffff"
          style={{
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            border: '3px solid rgba(255,255,255,0.85)',
            color: '#ffffff',
            fontSize: '14px',
            whiteSpace: 'pre-wrap',
          }}
        />
        <div
          style={{
            display: 'flex',
            fontSize: '26px',
            fontWeight: 900,
            color: 'rgba(255,255,255,0.9)',
            letterSpacing: '2px',
          }}
        >
          {theme.label} GROUP
        </div>
      </div>

      {/* 우측 — 편지 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '72px 60px 140px 60px',
          background: '#FFFDF5',
          gap: '18px',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: '22px',
            fontWeight: 700,
            color: theme.start,
            letterSpacing: '10px',
          }}
        >
          INVITATION
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: '108px',
            fontWeight: 900,
            color: '#1a1208',
            letterSpacing: '-3px',
            lineHeight: 1,
          }}
        >
          초대합니다
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '6px',
            marginTop: '10px',
          }}
        >
          <span
            style={{
              display: 'flex',
              fontSize: '72px',
              fontWeight: 900,
              fontFamily: 'Archivo Black',
              color: theme.start,
              letterSpacing: '-2px',
            }}
          >
            {memberCount}
          </span>
          <span style={{ display: 'flex', fontSize: '32px', fontWeight: 700, color: '#3c2a15' }}>
            명과 함께
          </span>
        </div>
        <div style={{ display: 'flex', fontSize: '22px', fontWeight: 400, color: '#6b5840' }}>
          {theme.label} 가치관 비교하기
        </div>
      </div>

      <BrandCtaBand copy={CTA_GROUP} tone="light" />
    </div>
  );
}
