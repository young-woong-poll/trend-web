/**
 * 테토/에겐 OG 메타데이터 총정리 (내부용)
 *
 * /ask/teto-egen 도메인 3개 페이지의 Title / Description / OG 이미지를 한 페이지에서 비교.
 *  - /ask/teto-egen          (랜딩)
 *  - /ask/teto-egen/my       (내 결과 — 본인 전용)
 *  - /ask/teto-egen/friend/[token] (친구 평가 — 카톡 viral 진입점)
 *
 * OG 미리보기는 카카오톡 인앱 사이즈(360×189) 기준.
 */
'use client';

import Image from 'next/image';

import styles from '@/app/dev/og/teto-egen/page.module.scss';
import egenImg from '@/assets/img/egen.png';
import tetoImg from '@/assets/img/teto.png';

const MOCK_DISPLAY_NAME = '지수';

type OgVariant = 'landing' | 'landing-fallback' | 'friend';

type PageEntry = {
  label: string;
  path: string;
  title: string;
  description: string;
  robots: string;
  ogVariant: OgVariant;
  note?: string;
};

const PAGES: PageEntry[] = [
  {
    label: '랜딩',
    path: '/ask/teto-egen',
    title: '나는 테토일까, 에겐일까?',
    description: '친구들한테 물어보자',
    robots: 'index, follow',
    ogVariant: 'landing',
  },
  {
    label: '내 결과',
    path: '/ask/teto-egen/my',
    title: '내 테토/에겐 결과',
    description: '친구들이 보는 나의 모습',
    robots: 'noindex, nofollow',
    ogVariant: 'landing-fallback',
    note: '본인 로그인 후에만 진입. 외부 공유 시 랜딩 OG로 fallback.',
  },
  {
    label: '친구 평가',
    path: '/ask/teto-egen/friend/[token]',
    title: `${MOCK_DISPLAY_NAME}님은 테토? 에겐?`,
    description: `고르면 ${MOCK_DISPLAY_NAME}님 + 친구들 생각 공개!`,
    robots: 'noindex, nofollow',
    ogVariant: 'friend',
    note: '이미지에는 이름을 넣지 않음. 이름은 title이 처리 (캐싱).',
  },
];

const LandingOg = () => (
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
);

const FriendOg = () => (
  <div className={styles.v5}>
    <div className={styles.v5Chars} aria-hidden>
      <Image src={tetoImg} alt="" className={styles.v5CharTeto} />
      <Image src={egenImg} alt="" className={styles.v5CharEgen} />
    </div>
    <div className={styles.v5Body}>
      <div className={styles.v5Pretitle}>저는</div>
      <div className={styles.v5Line}>
        <span className={styles.v5Teto}>테토</span>
        <span className={styles.v5Plain}>인가요?</span>
      </div>
      <div className={styles.v5Line}>
        <span className={styles.v5Egen}>에겐</span>
        <span className={styles.v5Plain}>인가요?</span>
      </div>
    </div>
  </div>
);

const Row = ({ label, value, muted }: { label: string; value: string; muted?: boolean }) => (
  <div className={styles.row}>
    <span className={styles.rowLabel}>{label}</span>
    <span className={`${styles.rowValue} ${muted ? styles.rowMuted : ''}`}>{value}</span>
  </div>
);

export default function TetoEgenOgSummary() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>OG 메타데이터 총정리 — 테토/에겐</h1>
        <p className={styles.pageSubtitle}>
          /ask/teto-egen 도메인 3개 페이지의 Title / Description / OG 이미지 정리. OG 미리보기는
          카카오톡 인앱 사이즈(360×189, 실제 OG는 1200×630).
        </p>
      </header>

      {PAGES.map((p) => (
        <section key={p.path} className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.tag}>{p.label}</span>
            <code className={styles.path}>{p.path}</code>
          </div>

          <div className={styles.body}>
            <div className={styles.metaCol}>
              <Row label="Title" value={p.title} />
              <Row label="Description" value={p.description} />
              <Row label="Robots" value={p.robots} />
              {p.note && <Row label="비고" value={p.note} muted />}
            </div>

            <div className={styles.previewCol}>
              <div className={styles.previewWrap}>
                <div className={styles.canvas}>
                  {p.ogVariant === 'friend' ? <FriendOg /> : <LandingOg />}
                </div>
              </div>
              {p.ogVariant === 'landing-fallback' && (
                <p className={styles.fallbackNote}>↑ 랜딩 OG 이미지 fallback</p>
              )}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
