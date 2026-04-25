'use client';

import { useEffect, useMemo, useRef, useState, type FC } from 'react';

import Image from 'next/image';

import { createPortal } from 'react-dom';

import kingOfViralImg from '@/assets/img/characters/king-of-viral.png';
import troubleMakerImg from '@/assets/img/characters/trouble-maker.png';
import styles from '@/components/features/Compare/GroupResult/GroupAwards.module.scss';
import { TOP_PRIORITY } from '@/constants/my-medals';
import type { GroupAward, GroupAwardType } from '@/types/group-compare';

interface GroupAwardsProps {
  awards: GroupAward[];
  currentUserId: string;
  /**
   * MyResultView Layer 1 훈장과 중복되는 본인 수상만 제거.
   * TOP_PRIORITY 타입(SOUL_CONNECTION/PEOPLES_CHAMPION/GROUP_LEADER/POLAR_OPPOSITES)
   * 중 본인이 수상한 것만 필터에서 빠진다.
   * CONTROVERSY_MAKER/GROUP_OUTSIDER 같은 부정 뉘앙스 어워드는 Layer 1에 안 나오므로
   * 본인이 수상해도 Layer 2 GroupAwards에서는 그대로 노출된다.
   */
  excludeCurrentUserAwards?: boolean;
  /** 표시할 어워드 타입 override. 미지정 시 기본 VISIBLE_AWARDS 사용. */
  visibleAwards?: readonly GroupAwardType[];
}

/** 표시할 어워드만 필터 */
const VISIBLE_AWARDS: GroupAwardType[] = ['CONTROVERSY_MAKER', 'PEOPLES_CHAMPION'];

const AWARD_IMAGES: Record<string, typeof troubleMakerImg> = {
  CONTROVERSY_MAKER: troubleMakerImg,
  PEOPLES_CHAMPION: kingOfViralImg,
};

const WinnerNames: FC<{
  nicknames: string[];
  winners: string[];
  currentUserId: string;
  value?: number;
  showValue?: boolean;
}> = ({ nicknames, winners, currentUserId, value, showValue }) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const extra = nicknames.length - 1;

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleOutside = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) {
        return;
      }
      setOpen(false);
    };
    const handleScroll = () => setOpen(false);
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open]);

  const handleClick = () => {
    if (extra <= 0) {
      return;
    }
    if (open) {
      setOpen(false);
      return;
    }
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      setPos({ top: rect.bottom + window.scrollY + 6, left: rect.left + rect.width / 2 });
    }
    setOpen(true);
  };

  return (
    <span className={styles.awardWinners}>
      {nicknames[0]}
      {winners[0] === currentUserId && <span className={styles.nicknameBadgeMe}>나</span>}
      {extra > 0 && (
        <button ref={btnRef} type="button" className={styles.extraBtn} onClick={handleClick}>
          외 {extra}명
        </button>
      )}
      {showValue && value !== null && <span className={styles.awardValue}> · {value}%</span>}
      {open &&
        pos &&
        createPortal(
          <div className={styles.winnersTooltip} style={{ top: pos.top, left: pos.left }}>
            {nicknames.map((name, i) => (
              <span key={i} className={styles.winnersTooltipItem}>
                {name}
                {winners[i] === currentUserId && ' (나)'}
              </span>
            ))}
          </div>,
          document.body
        )}
    </span>
  );
};

export const GroupAwards: FC<GroupAwardsProps> = ({
  awards,
  currentUserId,
  excludeCurrentUserAwards = false,
  visibleAwards,
}) => {
  const allowed = visibleAwards ?? VISIBLE_AWARDS;
  const filtered = useMemo(() => {
    const base = awards.filter((a) => allowed.includes(a.type));
    if (!excludeCurrentUserAwards) {
      return base;
    }
    // Layer 1 훈장과 겹치는 TOP_PRIORITY 본인 수상만 제거.
    // 그 외 본인 수상(CONTROVERSY_MAKER 등)은 그대로 둔다.
    return base.filter(
      (a) => !(TOP_PRIORITY.includes(a.type) && a.winners.includes(currentUserId))
    );
  }, [awards, allowed, currentUserId, excludeCurrentUserAwards]);

  if (filtered.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>그룹 어워드</span>
        <div className={styles.sectionLine} />
      </div>

      <div className={styles.awardList}>
        {filtered.map((award) => (
          <div key={award.type} className={styles.awardCard}>
            {AWARD_IMAGES[award.type] ? (
              <Image
                src={AWARD_IMAGES[award.type]}
                alt={award.title}
                width={56}
                height={56}
                className={`${styles.awardImage} ${award.type === 'PEOPLES_CHAMPION' ? styles.zoomIn : ''}`}
              />
            ) : (
              <div className={`${styles.awardImage} ${styles.awardImageFallback}`} aria-hidden />
            )}
            <div className={styles.awardTextGroup}>
              <span className={styles.awardTitle}>{award.title}</span>
              <WinnerNames
                nicknames={award.winnerNicknames}
                winners={award.winners}
                currentUserId={currentUserId}
                value={award.value}
                showValue={award.type === 'PEOPLES_CHAMPION'}
              />
              <span className={styles.awardDescription}>{award.description}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
