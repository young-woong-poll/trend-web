'use client';

import { type FC, useEffect, useRef, useState } from 'react';

import styles from '@/components/features/TetoEgen/DistCard.module.scss';

type DistCardProps = {
  tetoCount: number;
  egenCount: number;
};

// 분포 카드 — Hero/Detail 양쪽 끝에 결과 색상 글자 배치.
// 막대는 in-view 진입 시 width 0→target%로 트랜지션.
const DistCard: FC<DistCardProps> = ({ tetoCount, egenCount }) => {
  const total = tetoCount + egenCount;
  const tetoPercent = total > 0 ? Math.round((tetoCount / total) * 100) : 0;
  const egenPercent = total > 0 ? 100 - tetoPercent : 0;

  // IntersectionObserver를 부모(Detail)에서 처리하면 좋지만, 카드 자체로도 동작하도록 자체 관찰.
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={styles.root}>
      <div className={styles.bars}>
        <div
          className={`${styles.bar} ${styles.barTeto}`}
          style={{ width: inView ? `${tetoPercent}%` : '0%' }}
          aria-hidden
        >
          <div className={styles.shimmer} />
        </div>
        <div
          className={`${styles.bar} ${styles.barEgen}`}
          style={{ width: inView ? `${egenPercent}%` : '0%' }}
          aria-hidden
        >
          <div className={styles.shimmer} />
        </div>
      </div>
      <div className={styles.legend} aria-label={`테토 ${tetoCount}명, 에겐 ${egenCount}명`}>
        <div className={styles.legendItem}>
          <span className={`${styles.name} ${styles.nameTeto}`}>테토</span>
          <span className={styles.cnt}>
            {tetoCount}명 · {tetoPercent}%
          </span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.cnt}>
            {egenCount}명 · {egenPercent}%
          </span>
          <span className={`${styles.name} ${styles.nameEgen}`}>에겐</span>
        </div>
      </div>
    </div>
  );
};

export default DistCard;
