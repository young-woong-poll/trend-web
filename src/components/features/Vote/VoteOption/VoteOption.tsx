'use client';

import type { FC } from 'react';

import styles from './VoteOption.module.scss';

interface VoteOptionProps {
  /**
   * 투표 옵션 텍스트
   */
  text: string;
  /**
   * 배경 이미지 URL
   */
  imageUrl: string;
  /**
   * 선택 여부
   */
  isSelected?: boolean;
  /**
   * 클릭 이벤트 핸들러
   */
  onClick?: () => void;
}

export const VoteOption: FC<VoteOptionProps> = ({
  text,
  imageUrl,
  isSelected = false,
  onClick,
}) => (
  <button
    type="button"
    className={`${styles.container} ${isSelected ? styles.selected : ''}`}
    onClick={onClick}
    style={{ backgroundImage: `url(${imageUrl})` }}
  >
    <div className={styles.overlay} />
    <span className={styles.text}>{text}</span>
  </button>
);
