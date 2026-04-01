'use client';

import { useEffect, useRef, useCallback, type FC } from 'react';

import Image from 'next/image';

import { createPortal } from 'react-dom';

import styles from '@/components/features/Compare/CompareResult/PersonDetailSheet.module.scss';
import { calcPopularityScore, getPopularityByScore } from '@/constants/bundle';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import type { CompareResult } from '@/types/compare';

interface PersonDetailSheetProps {
  result: CompareResult;
  /** 'me' 또는 'target' */
  person: 'me' | 'target';
  onClose: () => void;
}

export const PersonDetailSheet: FC<PersonDetailSheetProps> = ({ result, person, onClose }) => {
  const personData = result[person];
  const score = calcPopularityScore(personData.answers, result.questionStats);
  const popularity = getPopularityByScore(score);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);

  // ESC 키로 닫기
  useEscapeKey(true, onClose);

  // 스크롤 잠금
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  // 스와이프 다운으로 닫기
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const sheet = sheetRef.current;
    if (!sheet) {
      return;
    }
    // 시트가 맨 위로 스크롤된 상태에서만 스와이프 닫기 허용
    if (sheet.scrollTop > 0) {
      return;
    }
    dragStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (dragStartY.current === null) {
        return;
      }
      const deltaY = e.changedTouches[0].clientY - dragStartY.current;
      dragStartY.current = null;
      // 80px 이상 아래로 스와이프하면 닫기
      if (deltaY > 80) {
        onClose();
      }
    },
    [onClose]
  );

  return createPortal(
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div
        className={styles.sheet}
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className={styles.handle} />

        {/* 히어로 (가로 배치: 이미지 왼쪽 + 정보 오른쪽) */}
        <div className={styles.hero}>
          <div className={styles.heroImage}>
            {popularity.imagePath ? (
              <Image
                src={popularity.imagePath}
                alt={popularity.title}
                width={110}
                height={110}
                className={styles.personImage}
              />
            ) : (
              <div
                className={styles.personPlaceholder}
                style={{ background: 'linear-gradient(135deg, #ff00ff, #ff4500)' }}
              >
                {popularity.grade[0]}
              </div>
            )}
          </div>
          <div className={styles.heroInfo}>
            <span className={styles.personName}>{personData.nickname}</span>
            <div className={styles.scoreRow}>
              <span className={styles.score}>{score}</span>
              <span className={styles.scoreUnit}>%</span>
            </div>
            <span className={styles.gradeTitle}>{popularity.title}</span>
          </div>
        </div>

        {/* 답변 리스트 */}
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>답변 {result.totalQuestions}개</span>
          <div className={styles.sectionLine} />
        </div>

        <div className={styles.answerList}>
          {result.questionStats.map((stat, idx) => {
            const answer = personData.answers.find((a) => a.electionId === stat.electionId);
            if (!answer) {
              return null;
            }

            const aRate = stat.optionARate;
            const bRate = stat.optionBRate;
            const myRate = answer.selected === 'A' ? aRate : bRate;
            const isMajority = myRate >= 50;

            return (
              <div key={stat.electionId} className={styles.answerCard}>
                <div className={styles.answerHeader}>
                  <div>
                    <div className={styles.questionIndex}>Q{idx + 1}</div>
                    <span className={styles.answerQuestion}>{stat.title}</span>
                  </div>
                  <span
                    className={`${styles.answerBadge} ${isMajority ? styles.majorityBadge : styles.minorityBadge}`}
                  >
                    {isMajority ? '다수파' : '소수파'}
                  </span>
                </div>

                <div className={styles.voteOptions}>
                  <div className={styles.optionRow}>
                    <span className={styles.optionLabel}>{stat.optionA}</span>
                    <div className={styles.optionBarTrack}>
                      <div
                        className={`${styles.optionBarFill} ${answer.selected === 'A' ? styles.myFill : ''}`}
                        style={{ width: `${aRate}%` }}
                      >
                        <span className={styles.optionPercent}>{aRate}%</span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.optionRow}>
                    <span className={styles.optionLabel}>{stat.optionB}</span>
                    <div className={styles.optionBarTrack}>
                      <div
                        className={`${styles.optionBarFill} ${answer.selected === 'B' ? styles.myFill : ''}`}
                        style={{ width: `${bRate}%` }}
                      >
                        <span className={styles.optionPercent}>{bRate}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>,
    document.body
  );
};
