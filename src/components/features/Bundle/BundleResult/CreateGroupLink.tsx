'use client';

import { useState, type FC } from 'react';

import { Toast } from '@/components/common/Toast/Toast';
import styles from '@/components/features/Bundle/BundleResult/CreateGroupLink.module.scss';
import { useCreateCompareLink } from '@/hooks/api/useCompare';
import { useToast } from '@/hooks/useToast';

interface CreateGroupLinkProps {
  slug: string;
  onClose: () => void;
}

export const CreateGroupLink: FC<CreateGroupLinkProps> = ({ slug, onClose }) => {
  const createMutation = useCreateCompareLink(slug);
  const [groupName, setGroupName] = useState('');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const { toast, showToast } = useToast();

  const handleCreate = async () => {
    if (!groupName.trim()) {
      showToast('그룹 이름을 입력해주세요');
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        type: 'GROUP',
        groupName: groupName.trim(),
      });
      setShareUrl(`${window.location.origin}/compare/${result.token}`);
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

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {!shareUrl ? (
          <>
            <h2 className={styles.title}>그룹 비교 만들기</h2>
            <p className={styles.description}>
              그룹 이름을 정하고 링크를 공유하면
              <br />
              여러 명의 가치관을 한눈에 비교할 수 있어요!
            </p>
            <div>
              <label className={styles.inputLabel}>그룹 이름</label>
              <input
                type="text"
                className={styles.groupNameInput}
                placeholder="예: 마케팅팀, 대학 친구들"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                maxLength={20}
              />
            </div>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.createButton}
                onClick={handleCreate}
                disabled={createMutation.isPending || !groupName.trim()}
              >
                {createMutation.isPending ? '생성 중...' : '그룹 링크 만들기'}
              </button>
              <button type="button" className={styles.closeButton} onClick={onClose}>
                닫기
              </button>
            </div>
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
              <button type="button" className={styles.copyButton} onClick={handleCopy}>
                복사
              </button>
            </div>
            <div className={styles.actions}>
              <button type="button" className={styles.closeButton} onClick={onClose}>
                닫기
              </button>
            </div>
          </>
        )}
      </div>
      <Toast message={toast.message} isVisible={toast.isVisible} />
    </div>
  );
};
