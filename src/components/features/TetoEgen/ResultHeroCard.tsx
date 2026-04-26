'use client';

import { type FC } from 'react';

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
        <p className={styles.emojiBig} aria-hidden>
          🪄
        </p>
        <h1 className={styles.headline}>아직 친구가 평가하지 않았어요</h1>
        <p className={styles.sub}>친구들에게 공유하고 결과를 받아보세요</p>
      </section>
    );
  }

  const isHit = variant === 'hit';

  return (
    <section className={styles.root}>
      <p className={styles.emojiBig} aria-hidden>
        {isHit ? '👏' : '🎯'}
      </p>
      <h1 className={`${styles.headline} ${isHit ? styles.hit : styles.miss}`}>
        {isHit ? '적중!' : '의외!'}
      </h1>
      <p className={styles.summary}>
        친구 {totalFriends}명 중 {majorityCount}명이
        <br />
        {displayName ? `${displayName}님을 ` : '당신을 '}
        <strong>{labelOf(majorityAnswer)}</strong>으로 봤어요
      </p>
      <div className={styles.bigNumberWrapper}>
        <span className={styles.bigNumber}>{majorityPercent}%</span>
        <span className={styles.bigLabel}>({labelOf(majorityAnswer)})</span>
      </div>
    </section>
  );
};

export default ResultHeroCard;
