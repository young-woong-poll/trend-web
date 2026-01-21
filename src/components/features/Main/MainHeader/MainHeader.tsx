import type { FC } from 'react';

import Image from 'next/image';

import mainLogo1x from '@/assets/img/main-logo@1x.png';
import styles from '@/components/features/Main/MainHeader/MainHeader.module.scss';

export const MainHeader: FC = () => (
  <header className={styles.header}>
    <div className={styles.logoContainer}>
      <Image src={mainLogo1x} alt="HotPick" className={styles.logo} priority height={24} />
    </div>
    <p className={styles.text}>
      <i>오늘 대한민국은 이걸로 싸운다</i>
    </p>
  </header>
);
