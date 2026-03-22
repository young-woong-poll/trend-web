'use client';

import { useState, useCallback, type FC } from 'react';

import Link from 'next/link';

import SparkleIcon from '@/assets/icon/SparkleIcon';
import { ImageUpload } from '@/components/common/ImageUpload/ImageUpload';
import { MainHeader } from '@/components/features/Main/MainHeader/MainHeader';
import styles from '@/components/features/Suggest/SuggestPage.module.scss';

const MAX_OPTIONS = 4;
const MIN_OPTIONS = 2;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

const CATEGORIES = [
  { id: 1, label: '연애' },
  { id: 2, label: '결혼' },
  { id: 3, label: '관계' },
  { id: 4, label: '재테크' },
  { id: 5, label: '직장' },
  { id: 6, label: '라이프' },
  { id: 7, label: '트렌드' },
];

interface SuggestFormData {
  title: string;
  options: string[];
  imageUrl: string | null;
  categoryIds: number[];
}

export const SuggestPage: FC = () => {
  const [formData, setFormData] = useState<SuggestFormData>({
    title: '',
    options: ['', ''],
    imageUrl: null,
    categoryIds: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const updateField = useCallback(
    <K extends keyof SuggestFormData>(key: K, value: SuggestFormData[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    []
  );

  const handleOptionChange = useCallback((index: number, value: string) => {
    setFormData((prev) => {
      const options = [...prev.options];
      options[index] = value;
      return { ...prev, options };
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next['options'];
      return next;
    });
  }, []);

  const handleAddOption = useCallback(() => {
    setFormData((prev) => {
      if (prev.options.length >= MAX_OPTIONS) {
        return prev;
      }
      return { ...prev, options: [...prev.options, ''] };
    });
  }, []);

  const handleRemoveOption = useCallback((index: number) => {
    setFormData((prev) => {
      if (prev.options.length <= MIN_OPTIONS) {
        return prev;
      }
      return { ...prev, options: prev.options.filter((_, i) => i !== index) };
    });
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '투표 질문을 입력해주세요';
    }

    const validOptions = formData.options.filter((opt) => opt.trim());
    if (validOptions.length < MIN_OPTIONS) {
      newErrors.options = `선택지를 ${MIN_OPTIONS}개 이상 입력해주세요`;
    } else {
      const uniqueOptions = new Set(validOptions.map((opt) => opt.trim()));
      if (uniqueOptions.size !== validOptions.length) {
        newErrors.options = '중복된 선택지가 있어요';
      }
    }

    if (formData.categoryIds.length === 0) {
      newErrors.categoryIds = '카테고리를 1개 이상 선택해주세요';
    }

    setErrors(newErrors);

    // 첫 번째 에러 필드로 스크롤
    if (Object.keys(newErrors).length > 0) {
      const firstErrorKey = Object.keys(newErrors)[0];
      const el =
        document.getElementById(`suggest-${firstErrorKey}`) ||
        document.querySelector(`[data-field="${firstErrorKey}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    // localStorage에 제안 데이터 저장 (운영용)
    try {
      const existing = JSON.parse(localStorage.getItem('hotpick-suggestions') || '[]');
      existing.push({
        title: formData.title.trim(),
        options: formData.options.filter((opt) => opt.trim()),
        categoryIds: formData.categoryIds,
        categoryLabels: formData.categoryIds.map(
          (id) => CATEGORIES.find((c) => c.id === id)?.label
        ),
        hasImage: !!formData.imageUrl,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('hotpick-suggestions', JSON.stringify(existing));
    } catch {
      // localStorage 실패해도 제안 화면은 보여줌
    }

    setIsSubmitted(true);
  };

  // 제출 완료 화면
  if (isSubmitted) {
    return (
      <>
        <MainHeader showSearch={false} />
        <div className={styles.container}>
          <div className={styles.successCard}>
            <div className={styles.successIconWrapper}>
              <SparkleIcon width={48} height={48} className={styles.successIcon} />
            </div>
            <h2 className={styles.successTitle}>제안이 접수되었어요!</h2>
            <p className={styles.successDescription}>
              소중한 아이디어 감사합니다.
              <br />
              검토 후 핫픽으로 등록될 예정이에요.
            </p>
            {!formData.imageUrl && (
              <div className={styles.successNote}>
                <p>이미지를 첨부하지 않으셨네요.</p>
                <p>주제에 어울리는 이미지가 자동으로 매칭됩니다!</p>
              </div>
            )}
            <div className={styles.successSummary}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>질문</span>
                <span className={styles.summaryValue}>{formData.title}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>선택지</span>
                <div className={styles.summaryOptions}>
                  {formData.options
                    .filter((opt) => opt.trim())
                    .map((opt, i) => (
                      <span key={i} className={styles.summaryOptionChip}>
                        {opt}
                      </span>
                    ))}
                </div>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>카테고리</span>
                <div className={styles.summaryOptions}>
                  {formData.categoryIds.map((id) => (
                    <span key={id} className={styles.summaryOptionChip}>
                      {CATEGORIES.find((c) => c.id === id)?.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.successActions}>
              <button
                type="button"
                className={styles.successButtonSecondary}
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({
                    title: '',
                    options: ['', ''],
                    imageUrl: null,
                    categoryIds: [],
                  });
                }}
              >
                새로운 제안하기
              </button>
              <Link href="/" className={styles.successButtonPrimary}>
                홈으로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <MainHeader showSearch={false} />
      <div className={styles.container}>
        {/* Hero */}
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>핫픽 제안</h1>
          <p className={styles.heroSub}>여러분의 아이디어가 핫픽이 됩니다!</p>
        </section>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* 투표 질문 */}
          <div className={styles.field}>
            <label htmlFor="suggest-title" className={styles.label}>
              투표 질문 <span className={styles.required}>*</span>
            </label>
            <p className={styles.hint}>사람들에게 물어보고 싶은 질문을 적어주세요</p>
            <input
              id="suggest-title"
              type="text"
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
              placeholder="예: 짜장면 vs 짬뽕, 당신의 선택은?"
              maxLength={100}
            />
            {errors.title && <p className={styles.errorText}>{errors.title}</p>}
            <span className={styles.charCount}>{formData.title.length}/100</span>
          </div>

          {/* 선택지 */}
          <div className={styles.field} data-field="options">
            <label className={styles.label}>
              선택지 <span className={styles.required}>*</span>
            </label>
            <p className={styles.hint}>
              투표 선택지를 입력해주세요 ({MIN_OPTIONS}~{MAX_OPTIONS}개)
            </p>
            <div className={styles.optionList}>
              {formData.options.map((option, index) => (
                <div key={index} className={styles.optionRow}>
                  <span className={styles.optionBadge}>{String.fromCharCode(65 + index)}</span>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className={`${styles.input} ${styles.optionInput} ${errors.options ? styles.inputError : ''}`}
                    placeholder={`선택지 ${String.fromCharCode(65 + index)}`}
                    maxLength={50}
                  />
                  {formData.options.length > MIN_OPTIONS && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className={styles.removeOptionButton}
                      aria-label={`선택지 ${index + 1} 삭제`}
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
            </div>
            {errors.options && <p className={styles.errorText}>{errors.options}</p>}
            {formData.options.length < MAX_OPTIONS && (
              <button type="button" onClick={handleAddOption} className={styles.addOptionButton}>
                + 선택지 추가
              </button>
            )}
          </div>

          {/* 카테고리 */}
          <div className={styles.field} data-field="categoryIds">
            <label className={styles.label}>
              카테고리 <span className={styles.required}>*</span>
            </label>
            <p className={styles.hint}>어울리는 카테고리를 선택해주세요 (복수 선택 가능)</p>
            <div className={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const isSelected = formData.categoryIds.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`${styles.categoryChip} ${isSelected ? styles.categoryChipActive : ''}`}
                    onClick={() => {
                      const updated = isSelected
                        ? formData.categoryIds.filter((id) => id !== cat.id)
                        : [...formData.categoryIds, cat.id];
                      updateField('categoryIds', updated);
                    }}
                  >
                    {isSelected && <span className={styles.categoryCheck}>&#10003;</span>}
                    {cat.label}
                  </button>
                );
              })}
            </div>
            {errors.categoryIds && <p className={styles.errorText}>{errors.categoryIds}</p>}
          </div>

          {/* 이미지 (선택) */}
          <div className={styles.field}>
            <label className={styles.label}>이미지</label>
            <p className={styles.hint}>
              투표에 어울리는 이미지를 올려주세요. 없으면 자동으로 매칭돼요!
            </p>
            <ImageUpload
              value={formData.imageUrl}
              onChange={(cdnUrl) => updateField('imageUrl', cdnUrl)}
              uploadOptions={{ prefix: 'suggest' }}
              maxSize={MAX_IMAGE_SIZE}
            />
          </div>

          {/* 안내 배너 */}
          <div className={styles.infoBanner}>
            <SparkleIcon width={20} height={20} className={styles.infoIcon} />
            <div>
              <p className={styles.infoTitle}>제안은 이렇게 처리돼요</p>
              <ul className={styles.infoList}>
                <li>제출된 제안은 운영팀이 검토해요</li>
                <li>이미지가 없으면 주제에 맞는 이미지가 자동 매칭돼요</li>
                <li>검토 후 핫픽으로 등록되면 바로 투표가 시작돼요</li>
              </ul>
            </div>
          </div>

          {/* 제출 버튼 */}
          <button type="submit" className={styles.submitButton}>
            핫픽 제안하기
          </button>
        </form>
      </div>
    </>
  );
};
