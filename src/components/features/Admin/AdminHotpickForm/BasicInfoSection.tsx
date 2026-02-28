import type { FC } from 'react';

import { ImageUpload } from '@/components/common/ImageUpload';
import { Tooltip } from '@/components/common/Tooltip';
import type {
  TFormData,
  HotpickAliasCheckStatus,
} from '@/components/features/Admin/AdminHotpickForm/AdminHotpickForm';
import styles from '@/components/features/Admin/AdminHotpickForm/BasicInfoSection.module.scss';
import { useModal } from '@/contexts/ModalContext';
import { useCheckHotpickAlias, useAdminCategories } from '@/hooks/api/useAdmin';
import type { HotpickType } from '@/types/hotpick';

import type { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';

/**
 * 카테고리 목록 (API 로딩 전 fallback)
 */
const FALLBACK_CATEGORIES: { id: number; label: string }[] = [
  { id: 1, label: '연애' },
  { id: 2, label: '결혼' },
  { id: 3, label: '재테크' },
  { id: 4, label: '직장' },
  { id: 5, label: '스포츠' },
  { id: 6, label: '음식' },
  { id: 7, label: '게임' },
  { id: 8, label: '자동차' },
  { id: 9, label: '건강' },
  { id: 10, label: '트렌드' },
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
  const imageUrl = watch('imageUrl');
  const hotpickSlug = watch('slug');
  const expiredAt = watch('expiredAt');

  const { showAlert } = useModal();
  const { mutateAsync: checkHotpickAlias, isPending } = useCheckHotpickAlias();
  const { data: apiCategories } = useAdminCategories();

  const hasExpiredAt = !!expiredAt;

  // API에서 카테고리 로드되면 사용, 아니면 fallback
  const categories =
    apiCategories && apiCategories.length > 0
      ? apiCategories.map((c) => ({ id: c.id ?? 0, label: c.name ?? '' }))
      : FALLBACK_CATEGORIES;

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 영문 소문자와 숫자와 하이픈만 허용
    const sanitized = value.replace(/[^a-z0-9-]/g, '');
    setValue('slug', sanitized);
    setCheckStatus('unchecked');
  };

  const handleCheckDuplicate = async () => {
    const trimmedSlug = hotpickSlug.trim();

    if (!trimmedSlug) {
      return;
    }

    setValue('slug', trimmedSlug);
    setCheckStatus('checking');

    try {
      const result = await checkHotpickAlias(trimmedSlug);
      setCheckStatus(result.exists ? 'duplicate' : 'available');
    } catch (error: unknown) {
      setCheckStatus('idle');
      const message = error instanceof Error ? error.message : '';
      showAlert(`중복 체크에 실패했습니다. ${message}`);
      console.error('중복 체크 실패:', error);
    }
  };

  const handleImageChange = (url: string | null) => {
    setValue('imageUrl', url || '');
  };

  const handleExpiredAtToggle = () => {
    if (hasExpiredAt) {
      setValue('expiredAt', undefined);
    } else {
      // 기본값: 7일 후 (KST)
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      const kstOffset = 9 * 60 * 60 * 1000;
      const kstDate = new Date(defaultDate.getTime() + kstOffset);
      setValue('expiredAt', kstDate.toISOString().slice(0, 16));
    }
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>기본 정보</h2>

      {/* 핫픽 유형 */}
      <div className={styles.field}>
        <label className={styles.label}>핫픽 유형</label>
        <div className={styles.typeSelector}>
          <label
            className={`${styles.typeOption} ${hotpickType === 'SINGLE' ? styles.typeOptionActive : ''}`}
          >
            <input
              type="radio"
              value="SINGLE"
              checked={hotpickType === 'SINGLE'}
              onChange={() => setValue('type', 'SINGLE')}
              className={styles.toggleInput}
            />
            <span className={styles.typeLabel}>SINGLE</span>
            <span className={styles.typeDesc}>단일 이지선다 투표</span>
          </label>
          <label className={`${styles.typeOption} ${styles.typeOptionDisabled}`}>
            <input type="radio" value="BUNDLE" disabled className={styles.toggleInput} />
            <span className={styles.typeLabel}>BUNDLE</span>
            <span className={styles.typeDesc}>준비 중</span>
          </label>
        </div>
      </div>

      {/* Hotpick Slug */}
      <div className={styles.field}>
        <div className={styles.labelWithTooltip}>
          <label htmlFor="hotpickSlug" className={styles.label}>
            Hotpick Slug <span className={styles.required}>*</span>
          </label>
          <Tooltip content="영문 소문자와 숫자와 하이픈(-)만 입력 가능합니다">
            <span className={styles.tooltipButton}>?</span>
          </Tooltip>
        </div>
        <div className={styles.inputWithButton}>
          <input
            id="hotpickSlug"
            type="text"
            value={hotpickSlug}
            onChange={handleSlugChange}
            className={`${styles.input} ${mode === 'edit' ? styles.disabled : ''}`}
            placeholder="love-hotpick-2025"
            disabled={mode === 'edit'}
          />
          {mode === 'create' && (
            <button
              type="button"
              onClick={handleCheckDuplicate}
              disabled={!hotpickSlug.trim() || isPending}
              className={styles.checkButton}
            >
              {isPending ? '확인중...' : '중복확인'}
            </button>
          )}
        </div>
        {checkStatus === 'available' && (
          <p className={styles.successMessage}>사용 가능한 Slug입니다</p>
        )}
        {checkStatus === 'duplicate' && (
          <p className={styles.errorMessage}>이미 사용중인 Slug입니다</p>
        )}
        {checkStatus === 'unchecked' && hotpickSlug.trim() && (
          <p className={styles.warningMessage}>중복 확인이 필요합니다</p>
        )}
      </div>

      {/* 카테고리 (다중 선택) */}
      <div className={styles.field}>
        <label className={styles.label}>카테고리</label>
        <div className={styles.categoryGrid}>
          {categories.map((cat) => {
            const categoryIds = watch('categoryIds');
            const isChecked = categoryIds.includes(cat.id);
            return (
              <label
                key={cat.id}
                className={`${styles.categoryChip} ${isChecked ? styles.categoryChipActive : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {
                    const updated = isChecked
                      ? categoryIds.filter((id) => id !== cat.id)
                      : [...categoryIds, cat.id];
                    setValue('categoryIds', updated);
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
              checked={!hasExpiredAt}
              onChange={handleExpiredAtToggle}
              className={styles.toggleInput}
            />
            <span className={styles.toggleSwitch} />
            <span className={styles.toggleText}>상시 (마감 없음)</span>
          </label>
          {!hasExpiredAt && <p className={styles.toggleHint}>마감 없이 상시 운영됩니다</p>}
        </div>
        {hasExpiredAt && (
          <input
            type="datetime-local"
            value={expiredAt || ''}
            onChange={(e) => setValue('expiredAt', e.target.value || undefined)}
            className={styles.input}
            style={{ marginTop: 8 }}
          />
        )}
      </div>

      {/* 대표 이미지 — SINGLE은 선거 이미지를 그대로 사용하므로 숨김 */}
      {hotpickType !== 'SINGLE' && (
        <div className={styles.field}>
          <label className={styles.label}>대표 이미지</label>
          <p className={styles.toggleHint}>핫픽 카드에 표시될 대표 이미지입니다</p>
          <div className={styles.imageItem}>
            <ImageUpload
              value={imageUrl || null}
              onChange={handleImageChange}
              uploadOptions={{ prefix: 'hotpick' }}
            />
          </div>
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
