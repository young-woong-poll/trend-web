import type { FC } from 'react';

import styles from './Header.module.scss';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export const Header: FC<HeaderProps> = ({
  title = '논란의 중심',
  subtitle = '대한민국 트렌드 연구소',
}) => (
  <header className={styles.header}>
    <h1 className={styles.title}>{title}</h1>
    <p className={styles.subtitle}>
      <span className={styles.icon}>©</span> {subtitle}
    </p>
  </header>
);
