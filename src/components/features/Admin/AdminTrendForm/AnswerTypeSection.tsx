import { useState, type FC } from 'react';
import type { UseFormSetValue, UseFormWatch } from 'react-hook-form';

import { Button } from '@/components/common/Button';
import styles from '@/components/features/Admin/AdminTrendForm/AnswerTypeSection.module.scss';
import type { CreateTrendRequest } from '@/types/trend';

interface AnswerTypeSectionProps {
  setValue: UseFormSetValue<CreateTrendRequest>;
  watch: UseFormWatch<CreateTrendRequest>;
}

export const AnswerTypeSection: FC<AnswerTypeSectionProps> = ({ setValue, watch }) => {
  const [answerTypeInput, setAnswerTypeInput] = useState('');
  const answerTypes = watch('meta.answerType') || [];

  const handleAdd = () => {
    if (!answerTypeInput.trim()) {
      return;
    }
    setValue('meta.answerType', [...answerTypes, { label: answerTypeInput.trim() }]);
    setAnswerTypeInput('');
  };

  const handleRemove = (index: number) => {
    setValue(
      'meta.answerType',
      answerTypes.filter((_, i) => i !== index)
    );
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>답변 타입</h2>
      <p className={styles.sectionDescription}>각 질문 항목의 라벨을 정의합니다</p>

      <div className={styles.arrayInput}>
        <input
          type="text"
          value={answerTypeInput}
          onChange={(e) => setAnswerTypeInput(e.target.value)}
          className={styles.input}
          placeholder="답변 타입 라벨 (예: 열정 타입)"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button type="button" onClick={handleAdd} variant="primary" height={40}>
          추가
        </Button>
      </div>

      <div className={styles.tagList}>
        {answerTypes.map((item, index) => (
          <div key={index} className={styles.tag}>
            <span>{item.label}</span>
            <button type="button" onClick={() => handleRemove(index)} className={styles.tagRemove}>
              ×
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

AnswerTypeSection.displayName = 'AnswerTypeSection';
