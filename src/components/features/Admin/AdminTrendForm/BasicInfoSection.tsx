import type { FC } from 'react';

import { ImageUpload } from '@/components/common/ImageUpload';
import { Tooltip } from '@/components/common/Tooltip';
import type {
  TFormData,
  TrendIdCheckStatus,
} from '@/components/features/Admin/AdminTrendForm/AdminTrendForm';
import styles from '@/components/features/Admin/AdminTrendForm/BasicInfoSection.module.scss';
import { useCheckTrendId } from '@/hooks/api/useAdmin';

import type { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';

interface BasicInfoSectionProps {
  register: UseFormRegister<TFormData>;
  setValue: UseFormSetValue<TFormData>;
  watch: UseFormWatch<TFormData>;
  checkStatus: TrendIdCheckStatus;
  setCheckStatus: (status: TrendIdCheckStatus) => void;
}

export const BasicInfoSection: FC<BasicInfoSectionProps> = ({
  register,
  setValue,
  watch,
  checkStatus,
  setCheckStatus,
}) => {
  const imageUrl = watch('imageUrl');
  const trendId = watch('id');

  const { mutateAsync: checkTrendId, isPending } = useCheckTrendId();

  const handleTrendIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 영문 소문자와 숫자와 하이픈만 허용
    const sanitized = value.replace(/[^a-z0-9-]/g, '');
    setValue('id', sanitized);
    setCheckStatus('unchecked');
  };

  const handleCheckDuplicate = async () => {
    const trimmedId = trendId.trim();

    if (!trimmedId) {
      return;
    }

    setValue('id', trimmedId);
    setCheckStatus('checking');

    try {
      const result = await checkTrendId(trimmedId);
      setCheckStatus(result.exists ? 'duplicate' : 'available');
    } catch (error) {
      setCheckStatus('idle');
      console.error('중복 체크 실패:', error);
    }
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>기본 정보</h2>

      <div className={styles.field}>
        <div className={styles.labelWithTooltip}>
          <label htmlFor="trendId" className={styles.label}>
            Trend ID <span className={styles.required}>*</span>
          </label>
          <Tooltip content="영문 소문자와 숫자와 하이픈(-)만 입력 가능합니다">
            <span>?</span>
          </Tooltip>
        </div>
        <div className={styles.inputWithButton}>
          <input
            id="trendId"
            type="text"
            value={trendId}
            onChange={handleTrendIdChange}
            className={styles.input}
            placeholder="love-trend-2025"
          />
          <button
            type="button"
            onClick={handleCheckDuplicate}
            disabled={!trendId.trim() || isPending}
            className={styles.checkButton}
          >
            {isPending ? '확인중...' : '중복확인'}
          </button>
        </div>
        {checkStatus === 'available' && (
          <p className={styles.successMessage}>사용 가능한 ID입니다</p>
        )}
        {checkStatus === 'duplicate' && (
          <p className={styles.errorMessage}>이미 사용중인 ID입니다</p>
        )}
        {checkStatus === 'unchecked' && trendId.trim() && (
          <p className={styles.warningMessage}>중복 확인이 필요합니다</p>
        )}
      </div>

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
