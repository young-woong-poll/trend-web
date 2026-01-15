import type { FC } from 'react';

import Image from 'next/image';

import styles from '@/components/features/Result/PickHistory/PickHistory.module.scss';
import type { SelectedOption } from '@/types/result';

interface PickHistoryProps {
  selectedOptions: SelectedOption[];
}

export const PickHistory: FC<PickHistoryProps> = ({ selectedOptions }) => (
  <div className={styles.container}>
    <h2 className={styles.title}>MY PICK HISTORY</h2>

    <div className={styles.list}>
      {selectedOptions.map((option) => (
        <div key={option.itemId} className={styles.item}>
          <div className={styles.imageWrapper}>
            {option.optionImageUrl && (
              <Image
                src={option.optionImageUrl}
                alt={option.optionTitle}
                width={48}
                height={48}
                className={styles.image}
              />
            )}
          </div>
          <div className={styles.content}>
            <p className={styles.question}>{option.itemTitle}</p>
            <p className={styles.answer}>{option.optionTitle}</p>
          </div>
          <span className={styles.percent}>{Math.round(option.percent)}%</span>
        </div>
      ))}
    </div>
  </div>
);
