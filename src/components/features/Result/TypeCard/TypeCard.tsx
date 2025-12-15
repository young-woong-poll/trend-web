import styles from '@/components/features/Result/TypeCard/TypeCard.module.scss';
import type { ResultTrend } from '@/types/result';

type TypeCardProps = {
  questions: ResultTrend | undefined;
  selectedOptions: string[] | undefined;
  resultType: string;
};

export const TypeCard = ({ questions, selectedOptions, resultType }: TypeCardProps) => (
  <>
    <div className={styles.content}>
      <p className={styles.subtitle}>당신의 성향은</p>
      <h1 className={styles.title}>{resultType}</h1>

      {questions?.items.map(({ title, options }) => (
        <div className={styles.section} key={title}>
          <p className={styles.question}>{title}</p>
          <div className={styles.options}>
            {options.map((option, _i) => (
              <button
                key={`${option.id}_` + `${_i}`}
                className={`${styles.option} ${selectedOptions?.includes(option.id) ? styles.selected : ''}`}
              >
                {option.title}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  </>
);
