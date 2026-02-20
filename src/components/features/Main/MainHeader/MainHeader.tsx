import type { FC } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import mainLogo1x from '@/assets/img/main-logo@1x.png';
import styles from '@/components/features/Main/MainHeader/MainHeader.module.scss';

export const MainHeader: FC = () => (
  <header className={styles.header}>
    <Link href="/" className={styles.logoContainer} aria-label="메인으로 이동">
      <Image src={mainLogo1x} alt="HotPick" className={styles.logo} priority height={24} />
    </Link>
    <p className={styles.text}>
      <i>투표하면 결과가 나와요</i>
    </p>
  </header>
);
