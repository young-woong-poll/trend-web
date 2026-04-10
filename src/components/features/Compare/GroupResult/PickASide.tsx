'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FC } from 'react';

import { createPortal } from 'react-dom';

import styles from '@/components/features/Compare/GroupResult/PickASide.module.scss';
import { getMemberGradient } from '@/constants/profileColors';
import type { GroupCompareResult } from '@/types/group-compare';

interface StackMember {
  userId: string;
  nickname: string;
  memberIndex: number;
}

interface PickASideProps {
  result: GroupCompareResult;
  currentUserId: string;
}

/** 의견 쏠림 태그 판정 */
function getOpinionTag(
  countA: number,
  countB: number
): { label: string; type: 'unanimous' | 'dominant' | 'split' } | null {
  const total = countA + countB;
  if (total === 0) {
    return null;
  }
  if (countA === 0 || countB === 0) {
    return { label: '만장일치', type: 'unanimous' };
  }
  const ratio = Math.max(countA, countB) / total;
  if (ratio >= 0.8) {
    return { label: '압도적', type: 'dominant' };
  }
  if (ratio <= 0.6) {
    return { label: '논쟁', type: 'split' };
  }
  return null;
}

/** 겹치는 아바타 스택 + 클릭 시 포탈 툴팁 */
const TOOLTIP_WIDTH = 160;
const SCREEN_PAD = 12;

const AvatarStack: FC<{ members: StackMember[] }> = ({ members }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [ready, setReady] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const MAX_SHOW = 4;
  const visible = members.slice(0, MAX_SHOW);
  const overflow = members.length - MAX_SHOW;

  // fixed 포지셔닝 — transform 없이 JS에서 중앙+clamp 계산
  useLayoutEffect(() => {
    if (!open || !btnRef.current) {
      setReady(false);
      return;
    }
    const rect = btnRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    // 화면 가장자리 clamp — 툴팁이 화면 밖으로 나가지 않도록
    const half = TOOLTIP_WIDTH / 2;
    const clampedLeft = Math.max(
      SCREEN_PAD + half,
      Math.min(centerX, window.innerWidth - SCREEN_PAD - half)
    );
    setPos({
      top: rect.bottom + 8,
      left: clampedLeft - half,
    });
    setReady(true);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleOutside = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) {
        return;
      }
      if (tooltipRef.current?.contains(e.target as Node)) {
        return;
      }
      setOpen(false);
    };
    // 스크롤(스와이프) 시 툴팁 닫기 — 단, 툴팁 내부 스크롤은 제외
    const handleScroll = (e: Event) => {
      if (tooltipRef.current?.contains(e.target as Node)) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside as EventListener);
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside as EventListener);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [open]);

  if (members.length === 0) {
    return null;
  }

  return (
    <div className={styles.stackWrapper}>
      <button
        ref={btnRef}
        type="button"
        className={styles.stack}
        onClick={() => setOpen((v) => !v)}
      >
        {visible.map((m, i) => (
          <div
            key={m.userId}
            className={styles.stackCircle}
            style={{
              background: getMemberGradient(m.memberIndex, m.userId),
              zIndex: MAX_SHOW - i,
            }}
          >
            {m.nickname[0]}
          </div>
        ))}
      </button>
      {overflow > 0 && <span className={styles.stackOverflow}>+{overflow}</span>}

      {open &&
        ready &&
        createPortal(
          <div
            ref={tooltipRef}
            className={styles.stackTooltip}
            style={{ top: pos.top, left: pos.left }}
          >
            {members.map((m) => (
              <div key={m.userId} className={styles.stackTooltipRow}>
                <div
                  className={styles.stackTooltipCircle}
                  style={{
                    background: getMemberGradient(m.memberIndex, m.userId),
                  }}
                >
                  {m.nickname[0]}
                </div>
                <span className={styles.stackTooltipName}>{m.nickname}</span>
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
};

export const PickASide: FC<PickASideProps> = ({ result, currentUserId }) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const dragState = useRef({ isDragging: false, startX: 0, scrollLeft: 0 });

  const handleScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    const scrollLeft = el.scrollLeft;
    const cardWidth = el.scrollWidth / result.questionStats.length;
    const index = Math.round(scrollLeft / cardWidth);
    setActiveIndex(Math.min(index, result.questionStats.length - 1));
  }, [result.questionStats.length]);

  // PC 마우스 드래그 스크롤
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    dragState.current = { isDragging: true, startX: e.pageX, scrollLeft: el.scrollLeft };
    el.style.scrollSnapType = 'none';
    el.style.scrollBehavior = 'auto';
    el.style.cursor = 'grabbing';
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.current.isDragging) {
      return;
    }
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    e.preventDefault();
    const dx = e.pageX - dragState.current.startX;
    el.scrollLeft = dragState.current.scrollLeft - dx;
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!dragState.current.isDragging) {
      return;
    }
    dragState.current.isDragging = false;
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    // smooth를 먼저 켜고 snap을 복원 → 부드럽게 가장 가까운 카드로 이동
    el.style.scrollBehavior = 'smooth';
    el.style.scrollSnapType = 'x mandatory';
    el.style.cursor = '';
    // 스냅 애니메이션 끝나면 scrollBehavior 초기화
    const onEnd = () => {
      el.style.scrollBehavior = '';
      el.removeEventListener('scrollend', onEnd);
    };
    el.addEventListener('scrollend', onEnd);
    // scrollend 미지원 브라우저 폴백
    setTimeout(() => {
      el.style.scrollBehavior = '';
      el.removeEventListener('scrollend', onEnd);
    }, 400);
  }, []);

  const getMemberIndex = useCallback(
    (userId: string) => result.members.findIndex((m) => m.userId === userId),
    [result.members]
  );

  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>투표 현황</span>
        <div className={styles.sectionLine} />
      </div>

      <div
        ref={scrollerRef}
        className={styles.cardScroller}
        onScroll={handleScroll}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {result.questionStats.map((question) => {
          const stackA: StackMember[] = result.members
            .filter((m) =>
              m.answers.some((a) => a.electionId === question.electionId && a.selected === 'A')
            )
            .map((m) => ({
              userId: m.userId,
              nickname: m.displayName ?? m.nickname,
              memberIndex: getMemberIndex(m.userId),
            }))
            .sort((a, b) => (a.userId === currentUserId ? -1 : b.userId === currentUserId ? 1 : 0));

          const stackB: StackMember[] = result.members
            .filter((m) =>
              m.answers.some((a) => a.electionId === question.electionId && a.selected === 'B')
            )
            .map((m) => ({
              userId: m.userId,
              nickname: m.displayName ?? m.nickname,
              memberIndex: getMemberIndex(m.userId),
            }))
            .sort((a, b) => (a.userId === currentUserId ? -1 : b.userId === currentUserId ? 1 : 0));

          const tag = getOpinionTag(stackA.length, stackB.length);

          return (
            <div
              key={question.electionId}
              className={`${styles.card} ${tag ? styles[`card_${tag.type}`] : ''}`}
            >
              <div className={styles.cardHeader}>
                <span className={styles.questionTitle}>{question.title}</span>
                {tag && (
                  <span className={`${styles.tag} ${styles[`tag_${tag.type}`]}`}>{tag.label}</span>
                )}
              </div>
              <div className={styles.vsRow}>
                <div className={`${styles.side} ${styles.sideLeft}`}>
                  <span className={styles.optionName}>{question.optionA}</span>
                  <span className={styles.optionCount}>{stackA.length}명</span>
                  <AvatarStack members={stackA} />
                </div>

                <span className={styles.vsLabel}>VS</span>

                <div className={`${styles.side} ${styles.sideRight}`}>
                  <span className={styles.optionName}>{question.optionB}</span>
                  <span className={styles.optionCount}>{stackB.length}명</span>
                  <AvatarStack members={stackB} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {result.questionStats.length > 1 && (
        <div className={styles.dots}>
          {result.questionStats.map((q, i) => (
            <div
              key={q.electionId}
              className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ''}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
