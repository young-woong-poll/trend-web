'use client';

import { useEffect, useState, type FC } from 'react';

import { useRouter } from 'next/navigation';

import { createPortal } from 'react-dom';

import CloseIcon from '@/assets/icon/CloseIcon';
import { CategoryBadge } from '@/components/common/CategoryBadge/CategoryBadge';
import { Toast } from '@/components/common/Toast/Toast';
import styles from '@/components/features/Bundle/BundleResult/CreateCompareLink.module.scss';
import { isGenderCategory } from '@/constants/bundle';
import { getCategoryThemeVars } from '@/constants/categoryTheme';
import { useCreateCompareLink } from '@/hooks/api/useCompare';
import { useMyCompareLinks } from '@/hooks/api/useMyCompareLinks';
import { useToast } from '@/hooks/useToast';
import { trackCompareCreate } from '@/lib/analytics';
import type { CategoryCode } from '@/types/hotpick';

interface CreateCompareLinkProps {
  slug: string;
  categoryCode?: CategoryCode;
  categoryMeta?: string | null;
  category?: string;
  bundleTitle?: string;
  onClose: () => void;
  source?: string;
}

const DANGEROUS_CHARS = /[<>"'&]/;

function sanitizeName(value: string): string {
  return value.replace(/\s{2,}/g, ' ');
}

function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return '케미 이름을 입력해 주세요';
  }
  if (DANGEROUS_CHARS.test(trimmed)) {
    return '< > " \' & 문자는 사용할 수 없어요';
  }
  return null;
}

/**
 * 케미 테스트 공유 모달 — 단일 그룹 생성 모달.
 * 스펙(2026-04-19) Task 3: 기존 CreateGroupLink 흡수, 1:1(ONE_TO_ONE) 생성 폐기.
 * 이전 케미 리스트 노출(스크롤) — 같은 번들로 만든 그룹이 있으면 다시 진입 가능.
 */
export const CreateCompareLink: FC<CreateCompareLinkProps> = ({
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
  const { data: myLinks } = useMyCompareLinks(slug);
  const [name, setName] = useState('');
  const { toast, showToast } = useToast();

  // 배경 스크롤 잠금 (iOS position: fixed 패턴)
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

  // 같은 번들로 이미 만든 그룹 리스트 (최근 생성순)
  const existingGroups = (myLinks ?? [])
    .filter((l) => l.type === 'GROUP' && !!l.token)
    .sort((a, b) => {
      const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bt - at;
    });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(sanitizeName(e.target.value));
  };

  const handleCreate = async () => {
    const error = validateName(name);
    if (error) {
      showToast(error);
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        type: 'GROUP',
        groupName: name.trim(),
        showGenderContent: isGenderCategory(categoryCode),
      });
      trackCompareCreate(slug, 'GROUP', source);
      onClose();
      router.push(`/compare/group/${result.token}`);
    } catch {
      showToast('링크 생성에 실패했어요. 번들을 먼저 완료해 주세요.');
    }
  };

  const handleOpenExisting = (token: string) => {
    onClose();
    router.push(`/compare/group/${token}`);
  };

  return createPortal(
    <div
      className={styles.overlay}
      style={getCategoryThemeVars(categoryCode, categoryMeta)}
      onClick={onClose}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.title}>케미 테스트 공유</h2>
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

        {/* 새 케미 입력 폼 */}
        <div>
          <div className={styles.inputLabelRow}>
            <label className={styles.inputLabel} htmlFor="compare-link-name">
              케미 이름
            </label>
            <span className={styles.inputHint}>최대 12자</span>
          </div>
          <input
            id="compare-link-name"
            type="text"
            className={styles.nameInput}
            placeholder="예: 단톡방 케미, 동아리 케미"
            value={name}
            onChange={handleNameChange}
            maxLength={12}
          />
        </div>

        <button
          type="button"
          className={styles.createButton}
          onClick={handleCreate}
          disabled={createMutation.isPending || !name.trim()}
        >
          {createMutation.isPending ? '만드는 중...' : '링크 만들기'}
        </button>

        {/* 이전 케미 리스트 (있을 때만) */}
        {existingGroups.length > 0 && (
          <div className={styles.existingSection}>
            <div className={styles.existingHeader}>
              <span className={styles.existingLabel}>이전 케미 {existingGroups.length}개</span>
            </div>
            <div className={styles.existingList} role="list">
              {existingGroups.map((g) => {
                const token = g.token ?? '';
                return (
                  <button
                    key={token}
                    type="button"
                    className={styles.existingRow}
                    onClick={() => handleOpenExisting(token)}
                    role="listitem"
                  >
                    <span className={styles.existingName} title={g.groupName}>
                      {g.groupName ?? '이름 없음'}
                    </span>
                    <span className={styles.existingMeta}>
                      {g.memberCount ?? 0}명 참여
                      <span className={styles.existingArrow} aria-hidden>
                        ›
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <Toast message={toast.message} isVisible={toast.isVisible} />
    </div>,
    document.body
  );
};
