'use client';

import { type FC } from 'react';

import CheckIcon from '@/assets/icon/CheckIcon';
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
  headline = '공유 링크가 준비됐어요',
  sub = '친구들에게 보내고 결과를 받아보세요',
}) => (
  <div className={styles.root}>
    <div className={styles.header}>
      <span className={styles.indicator}>
        <CheckIcon width={14} height={14} />
        <span>생성 완료</span>
      </span>
      <h2 className={styles.headline}>{headline}</h2>
      <p className={styles.sub}>{sub}</p>
    </div>

    <div className={styles.linkBox}>
      <span className={styles.linkText}>{shareUrl}</span>
    </div>

    <button type="button" className={styles.cta} onClick={onCopy}>
      <CopyIcon className={styles.copyIcon} />
      <span className={styles.ctaLabel}>링크 복사하기</span>
    </button>
  </div>
);

export default LinkShareCard;
