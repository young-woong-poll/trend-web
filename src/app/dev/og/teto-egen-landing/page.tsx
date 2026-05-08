/**
 * OG 이미지 시안 미리보기 (내부용)
 *
 * /ask/teto-egen 랜딩 페이지의 OG 이미지(1200×630).
 * V2-Typo 시안 1종 — 실제 OG 사이즈로 출력.
 */
'use client';

import Image from 'next/image';

import styles from '@/app/dev/og/teto-egen-landing/page.module.scss';
import egenImg from '@/assets/img/egen.png';
import tetoImg from '@/assets/img/teto.png';

const HEADLINE = '나는 테토일까, 에겐일까?';
const SUBLINE = '친구들의 시선으로 알아보는 진짜 나, 1분이면 충분해요';

export default function TetoEgenLandingOgPreview() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>OG 시안 — 랜딩 (/ask/teto-egen)</h1>
        <p className={styles.pageSubtitle}>
          카카오톡 인앱 미리보기 사이즈(360×189, 실제 OG는 1200×630).
        </p>

        <div className={styles.copyBox}>
          <div className={styles.copyRow}>
            <span className={styles.copyLabel}>Title</span>
            <span className={styles.copyValue}>{HEADLINE}</span>
          </div>
          <div className={styles.copyRow}>
            <span className={styles.copyLabel}>Description</span>
            <span className={styles.copyValue}>{SUBLINE}</span>
          </div>
        </div>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.tag}>V2-Typo</span>
          <span className={styles.sectionDesc}>거대한 헤드라인 3줄 + 친구 시선 eyebrow.</span>
        </div>
        <div className={styles.previewWrap}>
          <div className={styles.canvas}>
            <div className={styles.v2}>
              <div className={styles.v2Chars} aria-hidden>
                <Image src={tetoImg} alt="" className={styles.v2CharTeto} />
                <Image src={egenImg} alt="" className={styles.v2CharEgen} />
              </div>

              <div className={styles.v2Body}>
                <div className={styles.v2Pretitle}>남이 보는 나는</div>
                <div className={styles.v2Line}>
                  <span className={styles.v2Teto}>테토</span>
                  <span className={styles.v2Plain}>일까,</span>
                </div>
                <div className={styles.v2Line}>
                  <span className={styles.v2Egen}>에겐</span>
                  <span className={styles.v2Plain}>일까?</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
