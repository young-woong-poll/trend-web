'use client';

import { useMemo, type FC } from 'react';

import styles from '@/components/features/Compare/MyResultView/MyExtremeAnswersSection.module.scss';
import { getMyExtremeAnswers } from '@/constants/my-extreme-answers';
import type { GroupCompareResult } from '@/types/group-compare';

interface MyExtremeAnswersSectionProps {
  result: GroupCompareResult;
  currentUserId: string;
}

export const MyExtremeAnswersSection: FC<MyExtremeAnswersSectionProps> = ({
  result,
  currentUserId,
}) => {
  const items = useMemo(() => getMyExtremeAnswers(result, currentUserId), [result, currentUserId]);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className={styles.section} aria-labelledby="extreme-title">
      <h3 id="extreme-title" className={styles.title}>
        혼자만 다르게 고른 답 TOP 3
      </h3>
      <ul className={styles.list}>
        {items.map((it) => (
          <li key={it.electionId} className={styles.item}>
            <p className={styles.question}>{it.questionTitle}</p>
            <div className={styles.answer}>
              <span className={styles.badge}>{it.myOptionTitle}</span>
              <span className={styles.caption}>
                {it.totalCount}명 중 {it.pickedCount}명만 이 답을 골랐어요
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};
