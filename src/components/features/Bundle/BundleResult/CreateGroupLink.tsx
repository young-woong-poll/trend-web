'use client';

import { useEffect, useState, type FC } from 'react';

import { createPortal } from 'react-dom';

import CloseIcon from '@/assets/icon/CloseIcon';
import { Toast } from '@/components/common/Toast/Toast';
import styles from '@/components/features/Bundle/BundleResult/CreateGroupLink.module.scss';
import { getCategoryThemeVars } from '@/constants/categoryTheme';
import { useCreateCompareLink } from '@/hooks/api/useCompare';
import { useToast } from '@/hooks/useToast';
import type { CategoryCode } from '@/types/hotpick';

interface CreateGroupLinkProps {
  slug: string;
  categoryCode?: CategoryCode;
  onClose: () => void;
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

export const CreateGroupLink: FC<CreateGroupLinkProps> = ({ slug, categoryCode, onClose }) => {
  const createMutation = useCreateCompareLink(slug);
  const [groupName, setGroupName] = useState('');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
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
      });
      setShareUrl(`${window.location.origin}/compare/group/${result.token}`);
    } catch {
      showToast('링크 생성에 실패했습니다');
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('링크가 복사되었습니다');
    } catch {
      showToast('복사에 실패했습니다');
    }
  };

  return createPortal(
    <div className={styles.overlay} style={getCategoryThemeVars(categoryCode)} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.modalClose} onClick={onClose} aria-label="닫기">
          <CloseIcon width={16} height={16} />
        </button>

        {!shareUrl ? (
          <>
            <h2 className={styles.title}>그룹 비교 만들기</h2>
            <p className={styles.description}>
              그룹 이름을 정하고 링크를 공유하면
              <br />
              여러 명의 가치관을 한눈에 비교할 수 있어요!
            </p>
            <div>
              <div className={styles.inputLabelRow}>
                <label className={styles.inputLabel}>그룹 이름</label>
                <span className={styles.inputHint}>1~20자</span>
              </div>
              <input
                type="text"
                className={styles.groupNameInput}
                placeholder="예: 마케팅팀, 대학 친구들"
                value={groupName}
                onChange={handleGroupNameChange}
                maxLength={20}
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
          </>
        ) : (
          <>
            <h2 className={styles.title}>그룹 링크가 생성되었어요!</h2>
            <p className={styles.description}>
              아래 링크를 단체 채팅방에 보내면
              <br />
              함께 비교 결과를 확인할 수 있어요 (최대 50명)
            </p>
            <div className={styles.linkBox}>
              <span className={styles.linkText}>{shareUrl}</span>
            </div>
            <button type="button" className={styles.createButton} onClick={handleCopy}>
              링크 복사하기
            </button>
          </>
        )}
      </div>
      <Toast message={toast.message} isVisible={toast.isVisible} />
    </div>,
    document.body
  );
};
