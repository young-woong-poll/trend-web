import type { FC } from 'react';

import { ImageUpload } from '@/components/common/ImageUpload';
import type { TFormData } from '@/components/features/Admin/AdminTrendForm/AdminTrendForm';
import styles from '@/components/features/Admin/AdminTrendForm/BasicInfoSection.module.scss';

import type { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';

interface BasicInfoSectionProps {
  register: UseFormRegister<TFormData>;
  setValue: UseFormSetValue<TFormData>;
  watch: UseFormWatch<TFormData>;
}

export const BasicInfoSection: FC<BasicInfoSectionProps> = ({ register, setValue, watch }) => {
  const imageUrl = watch('imageUrl');

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>기본 정보</h2>

      <div className={styles.field}>
        <label htmlFor="title" className={styles.label}>
          제목 <span className={styles.required}>*</span>
        </label>
        <input
          id="title"
          type="text"
          {...register('title', { required: true })}
          className={styles.input}
          placeholder="2025 트렌드"
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="label" className={styles.label}>
          부제 <span className={styles.required}>*</span>
        </label>
        <input
          id="label"
          type="text"
          {...register('label', { required: true })}
          className={styles.input}
          placeholder="TREND2025"
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>
          이미지 <span className={styles.required}>*</span>
        </label>
        <ImageUpload
          value={imageUrl || null}
          onChange={(url) => setValue('imageUrl', url || '')}
          uploadOptions={{ prefix: 'trend' }}
        />
      </div>
    </section>
  );
};

BasicInfoSection.displayName = 'BasicInfoSection';
