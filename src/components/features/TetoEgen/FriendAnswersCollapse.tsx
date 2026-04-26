'use client';

import { type FC, useEffect, useRef, useState } from 'react';

import ChevronDownIcon from '@/assets/icon/ChevronDownIcon';
import styles from '@/components/features/TetoEgen/FriendAnswersCollapse.module.scss';
import type { TetoEgenFriendVotes, TetoEgenVoter } from '@/types/ask-teto-egen';

type FriendAnswersCollapseProps = {
  friendVotes: TetoEgenFriendVotes;
  highlightSelfId?: string | null;
};

// 가로 스크롤 칩 리스트 — scroll position에 따라 좌/우 fade를 동적으로 토글.
// 모바일은 native touch scroll, PC는 마우스 drag로 동일한 UX 구현 (라이브러리 X).
const ChipScroller: FC<{ voters: TetoEgenVoter[]; highlightSelfId?: string | null }> = ({
  voters,
  highlightSelfId,
}) => {
  const ref = useRef<HTMLUListElement>(null);
  const dragState = useRef({ isDragging: false, startX: 0, startScroll: 0, moved: false });
  const [fadeLeft, setFadeLeft] = useState(false);
  const [fadeRight, setFadeRight] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      setFadeLeft(scrollLeft > 4);
      setFadeRight(scrollLeft + clientWidth < scrollWidth - 4);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, [voters.length]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) {
      return;
    }
    dragState.current = {
      isDragging: true,
      startX: e.pageX,
      startScroll: el.scrollLeft,
      moved: false,
    };
    el.style.cursor = 'grabbing';
    el.style.userSelect = 'none';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.current.isDragging) {
      return;
    }
    const el = ref.current;
    if (!el) {
      return;
    }
    const dx = e.pageX - dragState.current.startX;
    if (Math.abs(dx) > 4) {
      dragState.current.moved = true;
    }
    e.preventDefault();
    el.scrollLeft = dragState.current.startScroll - dx;
  };

  const endDrag = () => {
    if (!dragState.current.isDragging) {
      return;
    }
    dragState.current.isDragging = false;
    const el = ref.current;
    if (!el) {
      return;
    }
    el.style.cursor = '';
    el.style.userSelect = '';
  };

  return (
    <ul
      ref={ref}
      className={`${styles.chips} ${fadeLeft ? styles.fadeLeft : ''} ${fadeRight ? styles.fadeRight : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
    >
      {voters.map((v) => (
        <li
          key={v.userId}
          className={`${styles.chip} ${v.userId === highlightSelfId ? styles.chipMine : ''}`}
        >
          {v.displayName}
        </li>
      ))}
    </ul>
  );
};

const FriendAnswersCollapse: FC<FriendAnswersCollapseProps> = ({
  friendVotes,
  highlightSelfId,
}) => {
  const [open, setOpen] = useState(false);

  if (friendVotes.total === 0) {
    return null;
  }

  const tetoPercent = Math.round((friendVotes.tetoCount / friendVotes.total) * 100);
  const egenPercent = 100 - tetoPercent;
  const tetoVoters = friendVotes.voters.filter((v) => v.vote === 'TETO');
  const egenVoters = friendVotes.voters.filter((v) => v.vote === 'EGEN');
  const isMajorTeto = friendVotes.tetoCount > friendVotes.egenCount;
  const isMajorEgen = friendVotes.egenCount > friendVotes.tetoCount;

  return (
    <section className={styles.root}>
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={styles.toggleText}>친구 {friendVotes.total}명 답변 보기</span>
        <ChevronDownIcon className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} />
      </button>

      {open && (
        <div className={styles.body}>
          <div className={styles.group}>
            <div className={styles.groupHeader}>
              <span className={styles.groupLabel}>테토</span>
              <span className={styles.groupCount}>
                {friendVotes.tetoCount}명 · {tetoPercent}%
              </span>
            </div>
            <div className={styles.barTrack}>
              <div
                className={`${styles.barFill} ${isMajorTeto ? styles.barFillMajor : ''}`}
                style={{ width: `${tetoPercent}%` }}
              />
            </div>
            <ChipScroller voters={tetoVoters} highlightSelfId={highlightSelfId} />
          </div>

          <div className={styles.group}>
            <div className={styles.groupHeader}>
              <span className={styles.groupLabel}>에겐</span>
              <span className={styles.groupCount}>
                {friendVotes.egenCount}명 · {egenPercent}%
              </span>
            </div>
            <div className={styles.barTrack}>
              <div
                className={`${styles.barFill} ${isMajorEgen ? styles.barFillMajor : ''}`}
                style={{ width: `${egenPercent}%` }}
              />
            </div>
            <ChipScroller voters={egenVoters} highlightSelfId={highlightSelfId} />
          </div>
        </div>
      )}
    </section>
  );
};

export default FriendAnswersCollapse;
