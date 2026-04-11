'use client';

import { useEffect, useState, type FC } from 'react';

import { useRouter } from 'next/navigation';

import { createPortal } from 'react-dom';

import CloseIcon from '@/assets/icon/CloseIcon';
import { CategoryBadge } from '@/components/common/CategoryBadge/CategoryBadge';
import { Toast } from '@/components/common/Toast/Toast';
import styles from '@/components/features/Bundle/BundleResult/CreateGroupLink.module.scss';
import { isGenderCategory } from '@/constants/bundle';
import { getCategoryThemeVars } from '@/constants/categoryTheme';
import { useCreateCompareLink } from '@/hooks/api/useCompare';
import { useToast } from '@/hooks/useToast';
import { trackCompareCreate } from '@/lib/analytics';
import type { CategoryCode } from '@/types/hotpick';

interface CreateGroupLinkProps {
  slug: string;
  categoryCode?: CategoryCode;
  categoryMeta?: string | null;
  category?: string;
  bundleTitle?: string;
  onClose: () => void;
  source?: string;
}

const DANGEROUS_CHARS = /[<>"'&]/;

function sanitizeGroupName(value: string): string {
  return value.replace(/\s{2,}/g, ' ');
}

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

export const CreateGroupLink: FC<CreateGroupLinkProps> = ({
  slug,
  categoryCode,
  categoryMeta,
  category,
  bundleTitle,
  onClose,
  source = 'bundle_result',
}) => {
  const router = useRouter();
  const createMutation = useCreateCompareLink(slug);
  const [groupName, setGroupName] = useState('');
  const { toast, showToast } = useToast();

  // 배경 스크롤 잠금
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  const handleGroupNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGroupName(sanitizeGroupName(e.target.value));
  };

  const handleCreate = async () => {
    const error = validateGroupName(groupName);
    if (error) {
      showToast(error);
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        type: 'GROUP',
        groupName: groupName.trim(),
        showGenderContent: isGenderCategory(categoryCode),
      });
      trackCompareCreate(slug, 'GROUP', source);
      onClose();
      router.push(`/compare/group/${result.token}`);
    } catch {
      showToast('링크 생성에 실패했습니다. 번들을 먼저 완료해주세요.');
    }
  };

  return createPortal(
    <div
      className={styles.overlay}
      style={getCategoryThemeVars(categoryCode, categoryMeta)}
      onClick={onClose}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.title}>그룹 만들기</h2>
          <button type="button" className={styles.modalClose} onClick={onClose} aria-label="닫기">
            <CloseIcon width={16} height={16} />
          </button>
        </div>
        {bundleTitle && (
          <div className={styles.bundleInfo}>
            <CategoryBadge
              categoryCode={categoryCode}
              categoryMeta={categoryMeta}
              label={category}
            />
            <span className={styles.bundleTitle}>{bundleTitle}</span>
          </div>
        )}
        <div>
          <div className={styles.inputLabelRow}>
            <label className={styles.inputLabel}>그룹 이름</label>
            <span className={styles.inputHint}>최대 12자</span>
          </div>
          <input
            type="text"
            className={styles.groupNameInput}
            placeholder="예: 마케팅팀, 대학 친구들"
            value={groupName}
            onChange={handleGroupNameChange}
            maxLength={12}
          />
        </div>
        <button
          type="button"
          className={styles.createButton}
          onClick={handleCreate}
          disabled={createMutation.isPending || !groupName.trim()}
        >
          {createMutation.isPending ? '생성 중...' : '그룹 링크 만들기'}
        </button>
      </div>
      <Toast message={toast.message} isVisible={toast.isVisible} />
    </div>,
    document.body
  );
};
