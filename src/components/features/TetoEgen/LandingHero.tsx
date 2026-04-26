'use client';

import { type FC } from 'react';

import Image from 'next/image';

import egenImg from '@/assets/img/egen.png';
import tetoImg from '@/assets/img/teto.png';
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
          나는 테토일까,
          <br />
          에겐일까?
        </h1>
        <p className={styles.subtitle}>
          내 생각과 친구들 생각이 얼마나 같은지 1분 만에 확인해볼게요
        </p>
      </div>

      <div className={styles.visual} aria-hidden>
        <div className={`${styles.character} ${styles.characterTeto}`}>
          <Image src={tetoImg} alt="" priority className={styles.characterImg} />
          <span className={styles.characterLabel}>테토</span>
        </div>
        <div className={`${styles.character} ${styles.characterEgen}`}>
          <Image src={egenImg} alt="" priority className={styles.characterImg} />
          <span className={styles.characterLabel}>에겐</span>
        </div>
      </div>

      <div className={styles.bottomArea}>
        <p className={styles.count}>
          {isLoading || !data
            ? '— 명이 함께했어요'
            : `지금까지 ${data.count.toLocaleString()}명이 함께했어요`}
        </p>
        <button type="button" className={styles.cta} onClick={onStart}>
          시작하기
        </button>
      </div>
    </section>
  );
};

export default LandingHero;
