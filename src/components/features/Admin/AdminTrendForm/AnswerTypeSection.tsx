import type { FC } from 'react';

import type { TFormData } from '@/components/features/Admin/AdminTrendForm/AdminTrendForm';
import styles from '@/components/features/Admin/AdminTrendForm/AnswerTypeSection.module.scss';

import type { UseFormSetValue, UseFormWatch } from 'react-hook-form';

interface AnswerTypeSectionProps {
  setValue: UseFormSetValue<TFormData>;
  watch: UseFormWatch<TFormData>;
}

export const AnswerTypeSection: FC<AnswerTypeSectionProps> = ({ setValue, watch }) => {
  const electionIdList = watch('electionIdList');
  const answerTypes = watch('answerType');

  const totalInputCount = electionIdList.length + 1;

  const handleInputChange = (index: number, value: string) => {
    const newAnswerTypes = [...answerTypes];

    // 배열 길이가 부족하면 빈 객체로 채우기
    while (newAnswerTypes.length <= index) {
      newAnswerTypes.push({ label: '' });
    }

    newAnswerTypes[index] = { label: value };
    setValue('answerType', newAnswerTypes);
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>답변 타입</h2>
      <p className={styles.sectionDescription}>
        선거 일치 개수에 따른 답변 타입을 정의합니다 (총 {totalInputCount}개)
      </p>

      <div className={styles.inputList}>
        {Array.from({ length: totalInputCount }, (_, index) => (
          <div key={index} className={styles.inputItem}>
            <label className={styles.inputLabel}>{index}개 일치</label>
            <input
              type="text"
              value={answerTypes[index]?.label || ''}
              onChange={(e) => handleInputChange(index, e.target.value)}
              className={styles.input}
              placeholder={`${index}개 일치 시 답변 타입 라벨`}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

AnswerTypeSection.displayName = 'AnswerTypeSection';
