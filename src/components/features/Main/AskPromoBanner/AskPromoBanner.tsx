import type { FC } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import egenImg from '@/assets/img/egen.png';
import tetoImg from '@/assets/img/teto.png';
import styles from '@/components/features/Main/AskPromoBanner/AskPromoBanner.module.scss';

// 메인 상단 promo banner — H3 "테토/에겐" 진입점.
// MainHeader와 ContentTabs 사이에 위치한다.
const AskPromoBanner: FC = () => (
  <Link href="/ask/teto-egen" className={styles.root} aria-label="테토 에겐 친구 평가하러 가기">
    <div className={styles.characters} aria-hidden>
      <Image src={tetoImg} alt="" width={48} height={48} className={styles.character} />
      <Image src={egenImg} alt="" width={48} height={48} className={styles.character} />
    </div>

    <div className={styles.copy}>
      <p className={styles.title}>
        테토? 에겐? <br /> <strong>친구들이 보는 나</strong> 알아보기
      </p>
    </div>

    <svg
      className={styles.chevron}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M7.5 4L13.5 10L7.5 16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </Link>
);

export default AskPromoBanner;
