'use client';

import { useEffect, useRef, useState } from 'react';

import { createPortal } from 'react-dom';

import styles from '@/app/dev/mock-compare-links-bundle/page.module.scss';

// ─── 모의 데이터 ───
type CompareLink = {
  groupName: string;
  memberCount: number;
  token: string;
  createdAt: string;
};

const MOCK_LINKS: CompareLink[] = [
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

type Variant = 'sheet' | 'modal' | 'inline';

const VARIANT_LABELS: Record<Variant, string> = {
  sheet: '(가) 하프시트',
  modal: '(나) 중앙 모달',
  inline: '(다) 인라인 펼침',
};

// ─── 게이트 섹션 (BundleResult 시각 재현) ───
function GateSection({ children }: { children?: React.ReactNode }) {
  return (
    <section className={styles.gateSection} aria-label="친구들과 비교하기">
      <h1 className={styles.gateHeadline}>이제 진짜 시작이에요</h1>
      <p className={styles.gateSubtitle}>다른 친구들과 가치관을 비교하세요</p>

      <div className={styles.gateVisual} aria-hidden="true">
        <svg
          viewBox="0 0 280 160"
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
        >
          <defs>
            <linearGradient id="mockGateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff00ff" />
              <stop offset="100%" stopColor="#ff4500" />
            </linearGradient>
          </defs>
          <g stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="3 4" fill="none">
            <line x1="140" y1="80" x2="40" y2="40" />
            <line x1="140" y1="80" x2="240" y2="40" />
            <line x1="140" y1="80" x2="40" y2="120" />
            <line x1="140" y1="80" x2="240" y2="120" />
          </g>
          <g>
            {[
              [40, 40],
              [240, 40],
              [40, 120],
              [240, 120],
            ].map(([cx, cy]) => (
              <g key={`${cx}-${cy}`}>
                <circle
                  cx={cx}
                  cy={cy}
                  r="16"
                  fill="rgba(255,255,255,0.04)"
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={cx}
                  y={cy + 4}
                  textAnchor="middle"
                  fontSize="14"
                  fill="rgba(255,255,255,0.4)"
                  fontWeight="600"
                >
                  ?
                </text>
              </g>
            ))}
          </g>
          <circle cx="140" cy="80" r="26" fill="url(#mockGateGrad)" opacity="0.95" />
          <circle
            cx="140"
            cy="80"
            r="26"
            fill="none"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="1"
          />
          <g transform="translate(140 80)" stroke="#ffffff" strokeWidth="1.6" fill="none">
            <rect x="-7" y="-2" width="14" height="11" rx="2" fill="#ffffff" stroke="none" />
            <path d="M -4 -2 V -5 a 4 4 0 0 1 8 0 V -2" />
          </g>
        </svg>
      </div>

      <button
        type="button"
        className={styles.gateCta}
        onClick={() => alert('메인 CTA: 친구들과 가치관 비교하기 (mock)')}
      >
        친구들과 가치관 비교하기
      </button>

      {children}
    </section>
  );
}

// ─── 공용 리스트 항목 ───
function LinkRow({ link }: { link: CompareLink }) {
  return (
    <button
      type="button"
      className={styles.row}
      onClick={() => alert(`${link.groupName} 이동 (token: ${link.token})`)}
    >
      <span className={styles.rowName}>{link.groupName}</span>
      <span className={styles.rowMeta}>
        <span>{link.memberCount}명</span>
        <span className={styles.rowArrow}>›</span>
      </span>
    </button>
  );
}

// ─── (가) 하프시트 ───
function SheetVariant() {
  const [open, setOpen] = useState(false);

  // body scroll lock + ESC
  useEffect(() => {
    if (!open) {
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <GateSection>
        <div className={styles.entryArea}>
          <button type="button" className={styles.entryLink} onClick={() => setOpen(true)}>
            참여 중인 비교링크 <strong>{MOCK_LINKS.length}개</strong> ›
          </button>
        </div>
      </GateSection>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className={styles.sheetOverlay}
            role="dialog"
            aria-modal="true"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setOpen(false);
              }
            }}
          >
            <div className={styles.sheet}>
              <div className={styles.sheetHandleWrap}>
                <div className={styles.sheetHandle} />
              </div>
              <div className={styles.sheetHeader}>
                <h2 className={styles.sheetTitle}>참여 중인 비교링크 {MOCK_LINKS.length}개</h2>
                <button
                  type="button"
                  className={styles.sheetClose}
                  onClick={() => setOpen(false)}
                  aria-label="닫기"
                >
                  ×
                </button>
              </div>
              <div className={styles.sheetList}>
                {MOCK_LINKS.map((link) => (
                  <LinkRow key={link.token} link={link} />
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

// ─── (나) 작은 중앙 모달 ───
function ModalVariant() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <GateSection>
        <div className={styles.entryArea}>
          <button type="button" className={styles.entryLink} onClick={() => setOpen(true)}>
            참여 중인 비교링크 <strong>{MOCK_LINKS.length}개</strong> ›
          </button>
        </div>
      </GateSection>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className={styles.modalOverlay}
            role="dialog"
            aria-modal="true"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setOpen(false);
              }
            }}
          >
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>참여 중인 비교링크 {MOCK_LINKS.length}개</h2>
                <button
                  type="button"
                  className={styles.modalClose}
                  onClick={() => setOpen(false)}
                  aria-label="닫기"
                >
                  ×
                </button>
              </div>
              <div className={styles.modalList}>
                {MOCK_LINKS.map((link) => (
                  <LinkRow key={link.token} link={link} />
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

// ─── (다) 페이지 내 인라인 펼침 ───
function InlineVariant() {
  const [open, setOpen] = useState(false);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [maxH, setMaxH] = useState(0);

  useEffect(() => {
    if (open && innerRef.current) {
      setMaxH(innerRef.current.scrollHeight);
    } else {
      setMaxH(0);
    }
  }, [open]);

  return (
    <>
      <GateSection>
        <div className={styles.entryArea}>
          <div className={styles.inlineWrap}>
            <button
              type="button"
              className={styles.inlineToggle}
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
            >
              <span>
                참여 중인 비교링크
                <span className={styles.inlineCount}>{MOCK_LINKS.length}개</span>
              </span>
              <span
                className={`${styles.inlineChev} ${open ? styles.inlineChevOpen : ''}`}
                aria-hidden="true"
              >
                ▾
              </span>
            </button>
            <div className={styles.inlineCollapse} style={{ maxHeight: maxH }}>
              <div ref={innerRef} className={styles.inlineList}>
                {MOCK_LINKS.map((link) => (
                  <LinkRow key={link.token} link={link} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </GateSection>
    </>
  );
}

// ─── 페이지 ───
export default function MockCompareLinksBundlePage() {
  const [variant, setVariant] = useState<Variant>('sheet');

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.tabBar} role="tablist" aria-label="진입점 후보">
          {(Object.keys(VARIANT_LABELS) as Variant[]).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={variant === v}
              className={`${styles.tabBtn} ${variant === v ? styles.tabBtnActive : ''}`}
              onClick={() => setVariant(v)}
            >
              {VARIANT_LABELS[v]}
            </button>
          ))}
        </div>

        <div className={styles.label}>현재 보기 — {VARIANT_LABELS[variant]}</div>

        {variant === 'sheet' && <SheetVariant />}
        {variant === 'modal' && <ModalVariant />}
        {variant === 'inline' && <InlineVariant />}
      </div>
    </main>
  );
}
