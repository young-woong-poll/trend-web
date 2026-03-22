'use client';

import { useState } from 'react';

import styles from '@/components/features/About/FaqAccordion.module.scss';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

export const FaqAccordion = ({ items }: FaqAccordionProps) => {
  const [openIndexes, setOpenIndexes] = useState<Set<number>>(new Set());

  const toggle = (index: number) => {
    setOpenIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className={styles.accordion}>
      {items.map((item, index) => {
        const isOpen = openIndexes.has(index);
        return (
          <div key={item.question} className={styles.item}>
            <button
              className={styles.question}
              onClick={() => toggle(index)}
              aria-expanded={isOpen}
            >
              <span className={styles.questionText}>{item.question}</span>
              <span className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ''}`}>▶</span>
            </button>
            <div className={`${styles.answerWrapper} ${isOpen ? styles.answerOpen : ''}`}>
              <p className={styles.answer}>{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
