import type { FC } from 'react';

import styles from '@/components/features/Admin/AdminTrendForm/ResultLabelSection.module.scss';
import type { CreateTrendRequest } from '@/types/trend';

import type { UseFormRegister } from 'react-hook-form';

interface ResultLabelSectionProps {
  register: UseFormRegister<CreateTrendRequest>;
}

export const ResultLabelSection: FC<ResultLabelSectionProps> = ({ register }) => (
  <section className={styles.section}>
    <h2 className={styles.sectionTitle}>결과 상단문구</h2>

    <div className={styles.field}>
      <input
        id="resultLabel"
        type="text"
        {...register('meta.resultLabel', { required: true })}
        className={styles.input}
        placeholder="당신의 결과"
      />
    </div>
  </section>
);

ResultLabelSection.displayName = 'ResultLabelSection';
