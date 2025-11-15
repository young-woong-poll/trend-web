'use client';

import type { FC } from 'react';

import styles from './CompareSection.module.scss';

interface FriendResult {
  nickname: string;
  timestamp: string;
  matchRate?: number;
  comment?: string;
}

interface CompareSectionProps {
  friendResults?: FriendResult[];
}

export const CompareSection: FC<CompareSectionProps> = ({ friendResults = [] }) => (
  <div className={styles.container}>
    <h2 className={styles.title}>친구와 비교하기</h2>
    <p className={styles.description}>친구가 투표하면 나와 일치율 확인 가능!</p>

    <div className={styles.resultBox}>
      <p className={styles.resultLabel}>친구결과 (최근 10개)</p>
      {friendResults.length === 0 ? (
        <p className={styles.emptyMessage}>친구들이 비교 링크로 투표하면 결과가 나와요</p>
      ) : (
        <div className={styles.friendList}>
          {friendResults.map((friend, index) => (
            <div key={index} className={styles.friendItem}>
              <div className={styles.friendInfo}>
                <div className={styles.friendHeader}>
                  <span className={styles.friendNickname}>{friend.nickname}</span>
                  <span className={styles.friendTimestamp}>{friend.timestamp}</span>
                </div>
                {friend.comment && (
                  <p className={styles.friendComment}>&quot{friend.comment}&quot</p>
                )}
                {friend.matchRate !== undefined && (
                  <div className={styles.matchBar}>
                    {Array.from({ length: 5 }).map((_, barIndex) => (
                      <div
                        key={barIndex}
                        className={`${styles.matchBarItem} ${
                          barIndex < Math.ceil(friend.matchRate! / 20) ? styles.active : ''
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
              <svg
                className={styles.chevronIcon}
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 18l6-6-6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          ))}
        </div>
      )}
    </div>

    <div className={styles.inputSection}>
      <label className={styles.label}>
        닉네임 (수정불가)
        <span className={styles.helpIcon}>?</span>
      </label>
      <input type="text" placeholder="웅쓰" className={styles.input} />
    </div>

    <button className={styles.shareButton}>
      <svg
        className={styles.shareIcon}
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 5.333a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM4 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM12 14.667a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.727 9.06 10.287 11.94M10.273 4.06 5.727 6.94"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      비교 링크 복사
    </button>
  </div>
);
