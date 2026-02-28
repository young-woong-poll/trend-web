import type { FC } from 'react';

import { ImageUpload } from '@/components/common/ImageUpload';
import type {
  TFormData,
  TElectionItem,
} from '@/components/features/Admin/AdminHotpickForm/AdminHotpickForm';
import styles from '@/components/features/Admin/AdminHotpickForm/ElectionListSection.module.scss';
import type { VoteType } from '@/types/hotpick';

import type { UseFormSetValue, UseFormWatch } from 'react-hook-form';

const MAX_OPTIONS = 4;
const MIN_OPTIONS = 2;

interface ElectionInlineSectionProps {
  setValue: UseFormSetValue<TFormData>;
  watch: UseFormWatch<TFormData>;
}

/**
 * 인라인 선거 편집 섹션
 * 기존 선거 검색/선택 방식에서 인라인 편집으로 변경
 */
export const ElectionInlineSection: FC<ElectionInlineSectionProps> = ({ setValue, watch }) => {
  const election = watch('election');
  const items = election.items;
  const voteType = election.voteType;

  const handleVoteTypeChange = (type: VoteType) => {
    if (type === voteType) {
      return;
    }

    // 타입 전환 시 해당 타입에서 불필요한 이미지 데이터 초기화
    if (type === 'TEXT') {
      // TEXT로 전환: 선택지 이미지 제거
      const clearedItems = items.map((item) => ({ title: item.title }));
      setValue('election', { ...election, voteType: type, items: clearedItems });
    } else {
      // IMAGE로 전환: 선거 대표 이미지 제거
      setValue('election', { ...election, voteType: type, imageUrl: undefined });
    }
  };

  const handleTitleChange = (value: string) => {
    setValue('election', { ...election, title: value });
  };

  const handleElectionImageChange = (url: string | null) => {
    setValue('election', { ...election, imageUrl: url || undefined });
  };

  const handleItemChange = (index: number, field: keyof TElectionItem, value: string) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setValue('election', { ...election, items: updatedItems });
  };

  const handleItemImageChange = (index: number, url: string | null) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], imageUrl: url || undefined };
    setValue('election', { ...election, items: updatedItems });
  };

  const handleAddItem = () => {
    if (items.length >= MAX_OPTIONS) {
      return;
    }
    setValue('election', { ...election, items: [...items, { title: '' }] });
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= MIN_OPTIONS) {
      return;
    }
    const updatedItems = items.filter((_, i) => i !== index);
    setValue('election', { ...election, items: updatedItems });
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>선거 정보</h2>
      <p className={styles.sectionDescription}>
        투표 질문과 선택지를 입력하세요. 옵션은 {MIN_OPTIONS}~{MAX_OPTIONS}개까지 등록 가능합니다.
      </p>

      {/* 투표 타입 선택 */}
      <div className={styles.field}>
        <label className={styles.label}>
          투표 타입 <span className={styles.required}>*</span>
        </label>
        <div className={styles.voteTypeSelector}>
          <label
            className={`${styles.voteTypeOption} ${voteType === 'IMAGE' ? styles.voteTypeOptionActive : ''}`}
          >
            <input
              type="radio"
              value="IMAGE"
              checked={voteType === 'IMAGE'}
              onChange={() => handleVoteTypeChange('IMAGE')}
              className={styles.voteTypeInput}
            />
            <span className={styles.voteTypeLabel}>IMAGE</span>
            <span className={styles.voteTypeDesc}>이미지로 선택지 표시</span>
          </label>
          <label
            className={`${styles.voteTypeOption} ${voteType === 'TEXT' ? styles.voteTypeOptionActive : ''}`}
          >
            <input
              type="radio"
              value="TEXT"
              checked={voteType === 'TEXT'}
              onChange={() => handleVoteTypeChange('TEXT')}
              className={styles.voteTypeInput}
            />
            <span className={styles.voteTypeLabel}>TEXT</span>
            <span className={styles.voteTypeDesc}>텍스트로 선택지 표시</span>
          </label>
        </div>
      </div>

      {/* 선거 제목 */}
      <div className={styles.field}>
        <label htmlFor="electionTitle" className={styles.label}>
          투표 질문 <span className={styles.required}>*</span>
        </label>
        <input
          id="electionTitle"
          type="text"
          value={election.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className={styles.input}
          placeholder="예: 짜장면 vs 짬뽕, 당신의 선택은?"
        />
      </div>

      {/* 선거 대표 이미지 — TEXT 타입일 때만 표시 */}
      {voteType === 'TEXT' && (
        <div className={styles.field}>
          <label className={styles.label}>투표 이미지</label>
          <p className={styles.fieldHint}>텍스트 투표일 때 질문 옆에 표시되는 이미지입니다</p>
          <ImageUpload
            value={election.imageUrl || null}
            onChange={handleElectionImageChange}
            uploadOptions={{ prefix: 'election' }}
          />
        </div>
      )}

      {/* 선택지 목록 */}
      <div className={styles.field}>
        <label className={styles.label}>
          선택지 <span className={styles.required}>*</span>
        </label>
        <div className={styles.itemList}>
          {items.map((item, index) => (
            <div key={index} className={styles.itemRow}>
              <div className={styles.itemHeader}>
                <span className={styles.itemIndex}>옵션 {index + 1}</span>
                {items.length > MIN_OPTIONS && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className={styles.removeButton}
                  >
                    삭제
                  </button>
                )}
              </div>
              <input
                type="text"
                value={item.title}
                onChange={(e) => handleItemChange(index, 'title', e.target.value)}
                className={styles.input}
                placeholder={`옵션 ${index + 1} 제목`}
              />
              {/* 선택지 이미지 — IMAGE 타입일 때만 표시 */}
              {voteType === 'IMAGE' && (
                <div className={styles.itemImage}>
                  <ImageUpload
                    value={item.imageUrl || null}
                    onChange={(url) => handleItemImageChange(index, url)}
                    uploadOptions={{ prefix: 'election-item' }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {items.length < MAX_OPTIONS && (
          <button type="button" onClick={handleAddItem} className={styles.addButton}>
            + 옵션 추가
          </button>
        )}
      </div>
    </section>
  );
};
