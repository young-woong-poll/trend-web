'use client';

import { type FC } from 'react';

import CopyIcon from '@/assets/icon/CopyIcon';
import styles from '@/components/features/TetoEgen/LinkShareCard.module.scss';

type LinkShareCardProps = {
  shareUrl: string;
  onCopy: () => void;
  headline?: string;
  sub?: string;
};

const LinkShareCard: FC<LinkShareCardProps> = ({
  shareUrl,
  onCopy,
  headline = '투표 링크가 생성되었어요!',
  sub = '친구들에게 공유하고 결과를 확인하세요',
}) => (
  <div className={styles.root}>
    <div className={styles.header}>
      <span className={styles.emoji} aria-hidden>
        👏
      </span>
      <h2 className={styles.headline}>{headline}</h2>
      <p className={styles.sub}>{sub}</p>
    </div>

    <div className={styles.linkBox}>
      <span className={styles.linkText}>{shareUrl}</span>
    </div>

    <button type="button" className={styles.cta} onClick={onCopy}>
      <CopyIcon className={styles.copyIcon} />
      <span>링크 복사하기</span>
    </button>
  </div>
);

export default LinkShareCard;
