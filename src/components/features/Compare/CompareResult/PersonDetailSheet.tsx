'use client';

import { useEffect, type FC } from 'react';

import Image from 'next/image';

import { createPortal } from 'react-dom';

import CloseIcon from '@/assets/icon/CloseIcon';
import styles from '@/components/features/Compare/CompareResult/PersonDetailSheet.module.scss';
import { calcPopularityScore, getPopularityByScore } from '@/constants/bundle';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import type { CompareResult } from '@/types/compare';

interface PersonDetailSheetProps {
  result: CompareResult;
  person: 'me' | 'target';
  onClose: () => void;
}

export const PersonDetailSheet: FC<PersonDetailSheetProps> = ({ result, person, onClose }) => {
  const personData = result[person] ?? {};
  const answers = personData.answers ?? [];
  const questionStats = result.questionStats ?? [];
  const score = calcPopularityScore(answers, questionStats);
  const popularity = getPopularityByScore(score);

  useEscapeKey(true, onClose);

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

  return createPortal(
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.sheet}>
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="닫기">
          <CloseIcon width={16} height={16} />
        </button>

        {/* 히어로 */}
        <div className={styles.hero}>
          <div className={styles.heroImage}>
            {popularity.imagePath ? (
              <Image
                src={popularity.imagePath}
                alt={popularity.title}
                width={150}
                height={150}
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
            <span className={styles.personName}>{personData.nickname ?? ''}</span>
            <span className={styles.scoreLabel}>대중성 지수</span>
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
          {questionStats.map((stat, idx) => {
            const answer = answers.find((a) => a.electionId === stat.electionId);
            if (!answer) {
              return null;
            }

            const options = stat.optionStats ?? [];
            const totalVotes = options.reduce((sum, o) => sum + (o.voteCount ?? 0), 0);
            const selectedOption = options.find((o) => o.electionItemId === answer.electionItemId);
            const selectedRate =
              totalVotes > 0
                ? Math.round(((selectedOption?.voteCount ?? 0) / totalVotes) * 100)
                : 50;
            const isMajority = selectedRate >= 50;

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
                  {options.map((opt) => {
                    const rate =
                      totalVotes > 0 ? Math.round(((opt.voteCount ?? 0) / totalVotes) * 100) : 50;
                    const isSelected = opt.electionItemId === answer.electionItemId;
                    return (
                      <div key={opt.electionItemId} className={styles.optionRow}>
                        <span className={styles.optionLabel}>{opt.title}</span>
                        <div className={styles.optionBarTrack}>
                          <div
                            className={`${styles.optionBarFill} ${isSelected ? styles.myFill : ''}`}
                            style={{ width: `${rate}%` }}
                          >
                            <span className={styles.optionPercent}>{rate}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
