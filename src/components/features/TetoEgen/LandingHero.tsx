'use client';

import { type FC } from 'react';

import styles from '@/components/features/TetoEgen/LandingHero.module.scss';
import { useScenario } from '@/components/features/TetoEgen/useScenario';
import { useTetoEgenCount } from '@/hooks/api/useAskTetoEgen';

type LandingHeroProps = {
  onStart: () => void;
};

const LandingHero: FC<LandingHeroProps> = ({ onStart }) => {
  const scenario = useScenario();
  const { data, isLoading } = useTetoEgenCount(scenario);

  return (
    <section className={styles.root}>
      <div className={styles.titleArea}>
        <h1 className={styles.title}>
          당신은 테토인가요?
          <br />
          에겐인가요?
        </h1>
        <p className={styles.subtitle}>내 생각 ↔ 친구들 생각 맞는지 테스투</p>
      </div>

      <div className={styles.illustration} aria-hidden>
        <span>🤔</span>
      </div>

      <div className={styles.bottomArea}>
        <p className={styles.count}>
          {isLoading || !data ? '— 명 참여' : `${data.count.toLocaleString()}명 참여`}
        </p>
        <button type="button" className={styles.cta} onClick={onStart}>
          시작하기
        </button>
      </div>
    </section>
  );
};

export default LandingHero;
