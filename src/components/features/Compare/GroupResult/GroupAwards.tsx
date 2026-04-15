'use client';

import { useEffect, useMemo, useRef, useState, type FC } from 'react';

import Image from 'next/image';

import { createPortal } from 'react-dom';

import kingOfViralImg from '@/assets/img/characters/king-of-viral.png';
import troubleMakerImg from '@/assets/img/characters/trouble-maker.png';
import styles from '@/components/features/Compare/GroupResult/GroupAwards.module.scss';
import type { GroupAward, GroupAwardType } from '@/types/group-compare';

interface GroupAwardsProps {
  awards: GroupAward[];
  currentUserId: string;
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

export const GroupAwards: FC<GroupAwardsProps> = ({ awards, currentUserId }) => {
  const filtered = useMemo(() => awards.filter((a) => VISIBLE_AWARDS.includes(a.type)), [awards]);

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
            <Image
              src={AWARD_IMAGES[award.type]}
              alt={award.title}
              width={56}
              height={56}
              className={`${styles.awardImage} ${award.type === 'PEOPLES_CHAMPION' ? styles.zoomIn : ''}`}
            />
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
