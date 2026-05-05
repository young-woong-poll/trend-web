'use client';

import { type FC } from 'react';

import CheckIcon from '@/assets/icon/CheckIcon';
import ShareIcon from '@/assets/icon/ShareIcon';
import SparkleIcon from '@/assets/icon/SparkleIcon';
import styles from '@/components/features/TetoEgen/ResultHeroCard.module.scss';

type ResultHeroCardProps = {
  variant: 'hit' | 'miss' | 'empty';
  majorityAnswer?: 'TETO' | 'EGEN';
  majorityPercent?: number;
  totalFriends?: number;
  majorityCount?: number;
  displayName?: string;
};

const labelOf = (a?: 'TETO' | 'EGEN') => (a === 'TETO' ? '테토' : a === 'EGEN' ? '에겐' : '');

const ResultHeroCard: FC<ResultHeroCardProps> = ({
  variant,
  majorityAnswer,
  majorityPercent,
  totalFriends,
  majorityCount,
  displayName,
}) => {
  if (variant === 'empty') {
    return (
      <section className={styles.root}>
        <span className={styles.indicator}>
          <ShareIcon className={styles.indicatorIcon} />
          <span>공유 대기</span>
        </span>
        <h1 className={styles.headline}>
          아직 친구가
          <br />
          평가하지 않았어요
        </h1>
        <p className={styles.summary}>친구들에게 공유하고 결과를 받아보세요</p>
      </section>
    );
  }

  const isHit = variant === 'hit';
  const subject = displayName ? `${displayName}님` : '나';
  // 받침 따라 조사 분기: 테토(받침 X) → "로", 에겐(받침 ㄴ) → "으로"
  const particleRo = majorityAnswer === 'EGEN' ? '으로' : '로';

  return (
    <section className={styles.root}>
      <span className={`${styles.indicator} ${isHit ? styles.indicatorHit : ''}`}>
        {isHit ? (
          <CheckIcon width={14} height={14} />
        ) : (
          <SparkleIcon className={styles.indicatorIcon} />
        )}
        <span>{isHit ? '적중' : '의외'}</span>
      </span>
      <h1 className={styles.headline}>
        친구들은 {subject}을
        <br />
        <strong>{labelOf(majorityAnswer)}</strong>
        {particleRo} 봤어요
      </h1>
      <p className={styles.summary}>
        총 {totalFriends}명 중 {majorityCount}명이 같은 답을 골랐어요
      </p>
      <div className={styles.bigNumberRow}>
        <span className={styles.bigNumber}>{majorityPercent}</span>
        <span className={styles.bigUnit}>%</span>
        <span className={styles.bigLabel}>· {labelOf(majorityAnswer)}</span>
      </div>
    </section>
  );
};

export default ResultHeroCard;
