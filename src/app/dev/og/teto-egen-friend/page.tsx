/**
 * OG 이미지 시안 미리보기 (내부용)
 *
 * /ask/teto-egen/friend/[token] (친구 평가 페이지)의 OG 이미지(1200×630).
 * V5-MysteryCards 시안 1종 — 실제 OG 사이즈로 출력.
 *
 * 이미지에는 displayName(이름)을 넣지 않음. 이름은 OG title 메타데이터가 담당.
 * 이미지가 정적/캐싱 가능한 자산이 되어야 하기 때문.
 */
'use client';

import Image from 'next/image';

import styles from '@/app/dev/og/teto-egen-friend/page.module.scss';
import egenImg from '@/assets/img/egen.png';
import tetoImg from '@/assets/img/teto.png';

const MOCK_DISPLAY_NAME = '지수';
const META_TITLE = `${MOCK_DISPLAY_NAME}님은 테토? 에겐?`;
const META_DESCRIPTION = '내 답을 고르면 친구들의 답까지 한 번에 공개돼요';

export default function TetoEgenFriendOgPreview() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>OG 시안 — 친구 평가 (/ask/teto-egen/friend/[token])</h1>
        <p className={styles.pageSubtitle}>
          카카오톡 인앱 미리보기 사이즈(360×189, 실제 OG는 1200×630).
        </p>

        <div className={styles.copyBox}>
          <div className={styles.copyRow}>
            <span className={styles.copyLabel}>Title</span>
            <span className={styles.copyValue}>
              <code className={styles.copyCode}>{`\${displayName}`}</code>님은 테토? 에겐?
              <em className={styles.copyHint}>
                (예: <code className={styles.copyCode}>{META_TITLE}</code>)
              </em>
            </span>
          </div>
          <div className={styles.copyRow}>
            <span className={styles.copyLabel}>Description</span>
            <span className={styles.copyValue}>{META_DESCRIPTION}</span>
          </div>
          <div className={styles.copyRow}>
            <span className={styles.copyLabel}>이미지 정책</span>
            <span className={styles.copyValue}>
              이미지에는 이름을 넣지 않습니다. 이름은 title에서 처리. (캐싱 의도)
            </span>
          </div>
        </div>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.tag}>V5-MysteryCards</span>
          <span className={styles.sectionDesc}>
            뒤집힌 카드 + 봉인. 답하면 카드가 열린다는 보상 컨셉.
          </span>
        </div>
        <div className={styles.previewWrap}>
          <div className={styles.canvas}>
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
          </div>
        </div>
      </section>
    </div>
  );
}
