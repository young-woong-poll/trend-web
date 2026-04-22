'use client';

import { useState, useEffect } from 'react';

import { createPortal } from 'react-dom';

import styles from '@/app/dev/mock-compare-links-group/page.module.scss';

// ─────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────
type MockLink = {
  groupName: string;
  memberCount: number;
  token: string;
  createdAt: string;
};

const CURRENT_TOKEN = 'current-token';

const MOCK_LINKS: MockLink[] = [
  { groupName: '우리가족', memberCount: 4, token: 'mock-1', createdAt: '2026-04-20T10:00:00Z' },
  {
    groupName: '3학년5반동창',
    memberCount: 12,
    token: 'mock-2',
    createdAt: '2026-04-19T14:00:00Z',
  },
  {
    groupName: 'MBTI궁금이들',
    memberCount: 7,
    token: 'mock-3',
    createdAt: '2026-04-18T09:00:00Z',
  },
  {
    groupName: '팀 점심메뉴 합의',
    memberCount: 2,
    token: 'mock-4',
    createdAt: '2026-04-17T20:00:00Z',
  },
  { groupName: '썸타는 우리', memberCount: 3, token: 'mock-5', createdAt: '2026-04-16T11:00:00Z' },
];

// 현재 토큰 제외 (요구사항 — 동작 보장)
const VISIBLE_LINKS = MOCK_LINKS.filter((l) => l.token !== CURRENT_TOKEN);

type Variant = 'a' | 'b' | 'c';

// ─────────────────────────────────────────
// 공통 — 항목 row
// ─────────────────────────────────────────
function LinkRow({ link, onClick }: { link: MockLink; onClick: () => void }) {
  return (
    <button type="button" className={styles.row} onClick={onClick}>
      <span className={styles.rowName}>{link.groupName}</span>
      <span className={styles.rowMeta}>
        <span>{link.memberCount}명</span>
        <span className={styles.rowArrow}>›</span>
      </span>
    </button>
  );
}

function LinkList({ onPick }: { onPick: (link: MockLink) => void }) {
  return (
    <div className={styles.list}>
      {VISIBLE_LINKS.map((link) => (
        <LinkRow key={link.token} link={link} onClick={() => onPick(link)} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
// (가) 하프시트
// ─────────────────────────────────────────
function HalfSheetVariant() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePick = (link: MockLink) => {
    alert(`${link.groupName} 이동 (token: ${link.token})`);
  };

  return (
    <div className={styles.slot}>
      <button type="button" className={styles.entryLink} onClick={() => setOpen(true)}>
        참여 중인 비교링크 {VISIBLE_LINKS.length}개<span className={styles.entryArrow}>›</span>
      </button>
      {open &&
        mounted &&
        createPortal(
          <div className={styles.sheetOverlay} onClick={() => setOpen(false)}>
            <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
              <div className={styles.sheetHandle} />
              <div className={styles.sheetHeader}>
                <span className={styles.sheetTitle}>
                  참여 중인 비교링크 {VISIBLE_LINKS.length}개
                </span>
                <button
                  type="button"
                  className={styles.iconClose}
                  aria-label="닫기"
                  onClick={() => setOpen(false)}
                >
                  ×
                </button>
              </div>
              <div className={styles.sheetBody}>
                <LinkList onPick={handlePick} />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

// ─────────────────────────────────────────
// (나) 작은 중앙 모달
// ─────────────────────────────────────────
function CenterModalVariant() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePick = (link: MockLink) => {
    alert(`${link.groupName} 이동 (token: ${link.token})`);
  };

  return (
    <div className={styles.slot}>
      <button type="button" className={styles.entryLink} onClick={() => setOpen(true)}>
        참여 중인 비교링크 {VISIBLE_LINKS.length}개<span className={styles.entryArrow}>›</span>
      </button>
      {open &&
        mounted &&
        createPortal(
          <div className={styles.modalOverlay} onClick={() => setOpen(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <span className={styles.modalTitle}>
                  참여 중인 비교링크 {VISIBLE_LINKS.length}개
                </span>
                <button
                  type="button"
                  className={styles.iconClose}
                  aria-label="닫기"
                  onClick={() => setOpen(false)}
                >
                  ×
                </button>
              </div>
              <div className={styles.modalBody}>
                <LinkList onPick={handlePick} />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

// ─────────────────────────────────────────
// (다) 페이지 내 인라인 펼침 (기본 펼침)
// ─────────────────────────────────────────
function InlineExpandVariant() {
  const handlePick = (link: MockLink) => {
    alert(`${link.groupName} 이동 (token: ${link.token})`);
  };

  return (
    <div className={styles.slot}>
      <div className={styles.inlineCard}>
        <div className={styles.inlineHeader}>
          <span className={styles.inlineTitle}>참여 중인 비교링크 {VISIBLE_LINKS.length}개</span>
        </div>
        <LinkList onPick={handlePick} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Page
// ─────────────────────────────────────────
export default function MockCompareLinksGroupPage() {
  const [variant, setVariant] = useState<Variant>('a');

  return (
    <div className={styles.page}>
      <div>
        <h1 className={styles.title}>참여 중인 비교링크 진입점 mockup (그룹 결과)</h1>
        <p className={styles.subtitle}>
          ctaSection(`+ 새 비교링크 만들기`) 바로 위에 들어갈 후보 3개 비교
        </p>
      </div>

      <div className={styles.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={variant === 'a'}
          className={`${styles.tab} ${variant === 'a' ? styles.tabActive : ''}`}
          onClick={() => setVariant('a')}
        >
          (가) 하프시트
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={variant === 'b'}
          className={`${styles.tab} ${variant === 'b' ? styles.tabActive : ''}`}
          onClick={() => setVariant('b')}
        >
          (나) 중앙 모달
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={variant === 'c'}
          className={`${styles.tab} ${variant === 'c' ? styles.tabActive : ''}`}
          onClick={() => setVariant('c')}
        >
          (다) 인라인 펼침
        </button>
      </div>

      {/* 그룹 결과 페이지 분위기 더미 */}
      <div className={styles.contextBox}>
        <span className={styles.contextLabel}>위쪽 컨텐츠 (mock 컨텍스트)</span>
        <span className={styles.contextTitle}>그룹 결과 페이지</span>
        <span className={styles.contextHint}>
          위쪽엔 PickASide / GroupAwards / PopularityBarGraph / Spectrum 등이 들어옵니다.
        </span>
      </div>

      {/* 진입점 슬롯 (각 안 렌더) */}
      {variant === 'a' && <HalfSheetVariant />}
      {variant === 'b' && <CenterModalVariant />}
      {variant === 'c' && <InlineExpandVariant />}

      {/* 실제 ctaSection 재현 */}
      <div className={styles.ctaSection}>
        <button
          type="button"
          className={styles.newGroupCta}
          onClick={() => alert('새 비교링크 만들기 모달 (mock)')}
        >
          + 새 비교링크 만들기
        </button>
      </div>
    </div>
  );
}
