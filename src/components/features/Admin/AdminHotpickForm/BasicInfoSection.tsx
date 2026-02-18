import type { FC } from 'react';

import { ImageUpload } from '@/components/common/ImageUpload';
import { Tooltip } from '@/components/common/Tooltip';
import type {
  TFormData,
  HotpickAliasCheckStatus,
} from '@/components/features/Admin/AdminHotpickForm/AdminHotpickForm';
import styles from '@/components/features/Admin/AdminHotpickForm/BasicInfoSection.module.scss';
import { useModal } from '@/contexts/ModalContext';
import { useCheckHotpickAlias } from '@/hooks/api/useAdmin';
import type { CategoryCode, HotpickType } from '@/types/hotpick';

import type { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';

const CATEGORIES: { code: CategoryCode; label: string }[] = [
  { code: 'LOVE', label: '연애' },
  { code: 'MARRIAGE', label: '결혼' },
  { code: 'FINANCE', label: '재테크' },
  { code: 'WORK', label: '직장' },
  { code: 'SPORTS', label: '스포츠' },
  { code: 'FOOD', label: '음식' },
  { code: 'GAME', label: '게임' },
  { code: 'CAR', label: '자동차' },
  { code: 'HEALTH', label: '건강' },
  { code: 'TREND', label: '트렌드' },
];

interface BasicInfoSectionProps {
  register: UseFormRegister<TFormData>;
  setValue: UseFormSetValue<TFormData>;
  watch: UseFormWatch<TFormData>;
  checkStatus: HotpickAliasCheckStatus;
  setCheckStatus: (status: HotpickAliasCheckStatus) => void;
  mode?: 'create' | 'edit';
  hotpickType: HotpickType;
}

export const BasicInfoSection: FC<BasicInfoSectionProps> = ({
  register,
  setValue,
  watch,
  checkStatus,
  setCheckStatus,
  mode = 'create',
  hotpickType,
}) => {
  const imageUrls = watch('imageUrls');
  const hotpickAlias = watch('alias');
  const deadline = watch('deadline');

  const { showAlert } = useModal();
  const { mutateAsync: checkHotpickAlias, isPending } = useCheckHotpickAlias();

  const hasDeadline = !!deadline;

  const handleHotpickAliasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 영문 소문자와 숫자와 하이픈만 허용
    const sanitized = value.replace(/[^a-z0-9-]/g, '');
    setValue('alias', sanitized);
    setCheckStatus('unchecked');
  };

  const handleCheckDuplicate = async () => {
    const trimmedAlias = hotpickAlias.trim();

    if (!trimmedAlias) {
      return;
    }

    setValue('alias', trimmedAlias);
    setCheckStatus('checking');

    try {
      const result = await checkHotpickAlias(trimmedAlias);
      setCheckStatus(result.exists ? 'duplicate' : 'available');
    } catch (error: unknown) {
      setCheckStatus('idle');
      const message = error instanceof Error ? error.message : '';
      showAlert(`중복 체크에 실패했습니다. ${message}`);
      console.error('중복 체크 실패:', error);
    }
  };

  const handleAddImage = () => {
    setValue('imageUrls', [...imageUrls, '']);
  };

  const handleRemoveImage = (index: number) => {
    const updated = imageUrls.filter((_, i) => i !== index);
    setValue('imageUrls', updated);
  };

  const handleImageChange = (index: number, url: string | null) => {
    const updated = [...imageUrls];
    updated[index] = url || '';
    setValue('imageUrls', updated);
  };

  const handleDeadlineToggle = () => {
    if (hasDeadline) {
      setValue('deadline', undefined);
    } else {
      // 기본값: 7일 후
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      setValue('deadline', defaultDate.toISOString().slice(0, 16));
    }
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>기본 정보</h2>

      <div className={styles.field}>
        <div className={styles.labelWithTooltip}>
          <label htmlFor="hotpickAlias" className={styles.label}>
            Hotpick Alias <span className={styles.required}>*</span>
          </label>
          <Tooltip content="영문 소문자와 숫자와 하이픈(-)만 입력 가능합니다">
            <span className={styles.tooltipButton}>?</span>
          </Tooltip>
        </div>
        <div className={styles.inputWithButton}>
          <input
            id="hotpickAlias"
            type="text"
            value={hotpickAlias}
            onChange={handleHotpickAliasChange}
            className={`${styles.input} ${mode === 'edit' ? styles.disabled : ''}`}
            placeholder="love-hotpick-2025"
            disabled={mode === 'edit'}
          />
          {mode === 'create' && (
            <button
              type="button"
              onClick={handleCheckDuplicate}
              disabled={!hotpickAlias.trim() || isPending}
              className={styles.checkButton}
            >
              {isPending ? '확인중...' : '중복확인'}
            </button>
          )}
        </div>
        {checkStatus === 'available' && (
          <p className={styles.successMessage}>사용 가능한 ID입니다</p>
        )}
        {checkStatus === 'duplicate' && (
          <p className={styles.errorMessage}>이미 사용중인 ID입니다</p>
        )}
        {checkStatus === 'unchecked' && hotpickAlias.trim() && (
          <p className={styles.warningMessage}>중복 확인이 필요합니다</p>
        )}
      </div>

      {/* 제목 & 부제 - BUNDLE 타입만 */}
      {hotpickType === 'BUNDLE' && (
        <>
          <div className={styles.field}>
            <label htmlFor="title" className={styles.label}>
              제목 <span className={styles.required}>*</span>
            </label>
            <input
              id="title"
              type="text"
              {...register('title', { required: hotpickType === 'BUNDLE' })}
              className={styles.input}
              placeholder="2025 핫픽"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="label" className={styles.label}>
              부제 <span className={styles.required}>*</span>
            </label>
            <input
              id="label"
              type="text"
              {...register('label', { required: hotpickType === 'BUNDLE' })}
              className={styles.input}
              placeholder="HOTPICK2025"
            />
          </div>
        </>
      )}

      {/* 카테고리 (다중 선택) */}
      <div className={styles.field}>
        <label className={styles.label}>카테고리</label>
        <div className={styles.categoryGrid}>
          {CATEGORIES.map((cat) => {
            const categoryCodes = watch('categoryCodes');
            const isChecked = categoryCodes.includes(cat.code);
            return (
              <label
                key={cat.code}
                className={`${styles.categoryChip} ${isChecked ? styles.categoryChipActive : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {
                    const updated = isChecked
                      ? categoryCodes.filter((c) => c !== cat.code)
                      : [...categoryCodes, cat.code];
                    setValue('categoryCodes', updated);
                  }}
                  className={styles.toggleInput}
                />
                {cat.label}
              </label>
            );
          })}
        </div>
      </div>

      {/* 마감일 */}
      <div className={styles.field}>
        <label className={styles.label}>마감일</label>
        <div className={styles.toggleGroup}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={!hasDeadline}
              onChange={handleDeadlineToggle}
              className={styles.toggleInput}
            />
            <span className={styles.toggleSwitch} />
            <span className={styles.toggleText}>상시 (마감 없음)</span>
          </label>
          {!hasDeadline && <p className={styles.toggleHint}>마감 없이 상시 운영됩니다</p>}
        </div>
        {hasDeadline && (
          <input
            type="datetime-local"
            value={deadline || ''}
            onChange={(e) => setValue('deadline', e.target.value || undefined)}
            className={styles.input}
            style={{ marginTop: 8 }}
          />
        )}
      </div>

      {/* 커버 이미지 - BUNDLE 타입만 */}
      {hotpickType === 'BUNDLE' && (
        <div className={styles.field}>
          <label className={styles.label}>
            커버 이미지 <span className={styles.required}>*</span>
          </label>
          <p className={styles.toggleHint}>BUNDLE 타입은 커버 이미지가 1장 이상 필요합니다</p>
          {imageUrls.map((url, index) => (
            <div key={index} className={styles.imageItem}>
              <ImageUpload
                value={url || null}
                onChange={(newUrl) => handleImageChange(index, newUrl)}
                uploadOptions={{ prefix: 'hotpick' }}
              />
              {imageUrls.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className={styles.removeImageButton}
                >
                  삭제
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddImage}
            className={styles.checkButton}
            style={{ marginTop: 8 }}
          >
            + 이미지 추가
          </button>
        </div>
      )}

      {/* 공개 여부 */}
      <div className={styles.field}>
        <label className={styles.label}>공개 여부</label>
        <div className={styles.toggleGroup}>
          <label className={styles.toggleLabel}>
            <input type="checkbox" {...register('visible')} className={styles.toggleInput} />
            <span className={styles.toggleSwitch} />
            <span className={styles.toggleText}>공개</span>
          </label>
        </div>
      </div>
    </section>
  );
};

BasicInfoSection.displayName = 'BasicInfoSection';
