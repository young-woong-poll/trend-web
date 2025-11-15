'use client';

import type { FC } from 'react';

import styles from './SaveUrlPrompt.module.scss';

interface SaveUrlPromptProps {
  onCopyUrl?: () => void;
}

export const SaveUrlPrompt: FC<SaveUrlPromptProps> = ({ onCopyUrl }) => (
  <div className={styles.container}>
    <h3 className={styles.title}>나중에 확인하고 싶다면?</h3>
    <p className={styles.description}>
      이 페이지를 URL을 저장해두면 언제든지 다시 확인할 수 있습니다.
    </p>
    <button className={styles.copyButton} onClick={onCopyUrl}>
      <svg
        className={styles.linkIcon}
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6.667 8.667a3.333 3.333 0 0 0 5.026.36l2-2a3.334 3.334 0 1 0-4.714-4.714l-1.146 1.14"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.333 7.333a3.333 3.333 0 0 0-5.026-.36l-2 2a3.334 3.334 0 0 0 4.714 4.714l1.14-1.14"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      URL 복사
    </button>
  </div>
);
