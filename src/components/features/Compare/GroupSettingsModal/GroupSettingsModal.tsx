'use client';

import { useState, type FC } from 'react';

import { Modal } from '@/components/common/Modal/Modal';
import styles from '@/components/features/Compare/GroupSettingsModal/GroupSettingsModal.module.scss';
import { getCategoryThemeVars } from '@/constants/categoryTheme';
import type { CategoryCode } from '@/types/hotpick';

export interface GroupSettings {
  groupName: string;
  showGenderContent: boolean;
}

interface GroupSettingsModalProps {
  isOpen: boolean;
  currentName: string;
  currentShowGenderContent: boolean;
  isCreator: boolean;
  categoryCode?: CategoryCode;
  categoryMeta?: string | null;
  onClose: () => void;
  onConfirm: (settings: GroupSettings) => void;
  isLoading?: boolean;
}

const DANGEROUS_CHARS = /[<>"'&]/;

function validateGroupName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return '그룹 이름을 입력해주세요';
  }
  if (DANGEROUS_CHARS.test(trimmed)) {
    return '< > " \' & 문자는 사용할 수 없어요';
  }
  return null;
}

export const GroupSettingsModal: FC<GroupSettingsModalProps> = ({
  isOpen,
  currentName,
  currentShowGenderContent,
  isCreator,
  categoryCode,
  categoryMeta,
  onClose,
  onConfirm,
  isLoading,
}) => {
  const [name, setName] = useState(currentName);
  const [showGender, setShowGender] = useState(currentShowGenderContent);

  const trimmed = name.trim();
  const nameError = isCreator && trimmed !== currentName ? validateGroupName(name) : null;
  const hasChanges =
    (trimmed !== '' && trimmed !== currentName) || showGender !== currentShowGenderContent;
  const canSave = hasChanges && !nameError;

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton maxWidth={400}>
      <div className={styles.container} style={getCategoryThemeVars(categoryCode, categoryMeta)}>
        <h2 className={styles.title}>그룹 설정</h2>

        <div className={styles.divider}>
          <span className={styles.dividerText}>그룹 이름</span>
        </div>

        <div className={styles.inputGroup}>
          <div className={styles.inputWrapper}>
            <input
              className={`${styles.input} ${nameError ? styles.inputError : ''}`}
              placeholder="그룹 이름을 입력하세요"
              value={name}
              onChange={(e) => setName(e.target.value.replace(/\s{2,}/g, ' '))}
              maxLength={12}
              disabled={!isCreator}
              autoFocus={isCreator}
            />
            <span className={styles.charCount}>{name.length}/12</span>
          </div>
          {nameError && <span className={styles.errorText}>{nameError}</span>}
        </div>

        <div className={styles.divider}>
          <span className={styles.dividerText}>콘텐츠 설정</span>
        </div>

        <div className={styles.toggleRow}>
          <div className={styles.toggleInfo}>
            <span className={styles.toggleLabel}>이성궁합 · 성별 대결 표시</span>
            <span className={styles.toggleDescription}>각 성별 2명 이상일 때 표시돼요</span>
          </div>
          <button
            type="button"
            className={`${styles.toggle} ${showGender ? styles.toggleOn : ''}`}
            onClick={() => setShowGender((v) => !v)}
            disabled={!isCreator}
            aria-label="이성 콘텐츠 표시 토글"
          />
        </div>

        {isCreator ? (
          <button
            type="button"
            className={styles.confirmButton}
            onClick={() => onConfirm({ groupName: trimmed, showGenderContent: showGender })}
            disabled={!canSave || isLoading}
          >
            {isLoading ? '저장 중...' : '저장하기'}
          </button>
        ) : (
          <p className={styles.readonlyNotice}>그룹 설정은 생성자만 변경할 수 있어요</p>
        )}
      </div>
    </Modal>
  );
};
