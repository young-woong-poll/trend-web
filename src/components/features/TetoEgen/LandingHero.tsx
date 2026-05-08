'use client';

import { type FC, useEffect } from 'react';

import Image from 'next/image';

import egenImg from '@/assets/img/egen.png';
import tetoImg from '@/assets/img/teto.png';
import styles from '@/components/features/TetoEgen/LandingHero.module.scss';
import { useTetoEgenCount } from '@/hooks/api/useAskTetoEgen';
import { trackAskView } from '@/lib/analytics';

type LandingHeroProps = {
  onStart: () => void;
};

const LandingHero: FC<LandingHeroProps> = ({ onStart }) => {
  const { data, isLoading } = useTetoEgenCount();

  useEffect(() => {
    // 1순위: querystring `?src=...` (메인 banner / 공유 링크가 명시적으로 박는 값)
    const params = new URLSearchParams(window.location.search);
    const src = params.get('src');
    let entryPoint: 'direct' | 'relay' | 'share_link' | 'main_banner' = 'direct';
    if (src === 'main_banner' || src === 'share_link' || src === 'relay' || src === 'direct') {
      entryPoint = src;
    } else {
      // 2순위: referrer가 동일 호스트면 relay, 아니면 direct
      const isInternal =
        typeof document !== 'undefined' &&
        !!document.referrer &&
        document.referrer.includes(window.location.host);
      entryPoint = isInternal ? 'relay' : 'direct';
    }
    trackAskView('teto-egen', entryPoint);
  }, []);

  return (
    <section className={styles.root}>
      <div className={styles.titleArea}>
        <h1 className={styles.title}>
          나는 <strong>테토</strong>일까,
          <br />
          <strong>에겐</strong>일까?
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
