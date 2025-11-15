'use client';

import styles from './TypeCard.module.scss';

type TypeCardProps = {
  questions: {
    question: string;
    options: [string, string];
    selectedIndex: number;
  }[];
};

export const TypeCard = ({ questions }: TypeCardProps) => (
  <div className={styles.content}>
    <p className={styles.subtitle}>당신의 성향은</p>
    <h1 className={styles.title}>낭만의 사랑꾼</h1>

    {questions.map(({ question, options, selectedIndex }) => (
      <div className={styles.section} key={question}>
        <p className={styles.question}>{question}</p>
        <div className={styles.options}>
          {options.map((option, index) => (
            <button
              key={option}
              className={`${styles.option} ${index === selectedIndex ? styles.selected : ''}`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    ))}
  </div>
);
