'use client';

import type { FC } from 'react';

import CameraIcon from '@/assets/icon/CameraIcon';
import CheckIcon from '@/assets/icon/CheckIcon';
import LinkIcon from '@/assets/icon/LinkIcon';
import StartArrowIcon from '@/assets/icon/StartArrowIcon';
import { Button } from '@/components/common/Button';
import styles from '@/components/features/Result/ActionButtons/ActionButtons.module.scss';
import { useModal } from '@/contexts/ModalContext';

interface ActionButtonsProps {
  hotpickAlias: string;
}

export const ActionButtons: FC<ActionButtonsProps> = ({ hotpickAlias }) => {
  const { showToast } = useModal();

  // 내 유형 저장하기 - 현재 페이지(ResultPage) URL 복사
  const handleSaveType = async () => {
    await navigator.clipboard.writeText(window.location.href);
    showToast('결과 링크가 복사되었습니다', <CheckIcon width={16} height={16} />);
  };

  // 투표 공유하기 - VotePage URL 복사
  const handleShareVote = async () => {
    const hotpickUrl = `${window.location.origin}/hotpick/${hotpickAlias}`;
    await navigator.clipboard.writeText(hotpickUrl);
    showToast('투표 링크가 복사되었습니다', <CheckIcon width={16} height={16} />);
  };

  return (
    <div className={styles.container}>
      <Button
        variant="gradient"
        fullWidth
        height={48}
        onClick={handleSaveType}
        className={styles.primaryButton}
      >
        <CameraIcon />내 유형 자랑하기
      </Button>

      <Button
        variant="outline"
        fullWidth
        height={48}
        onClick={handleShareVote}
        className={styles.secondaryButton}
      >
        <LinkIcon />
        투표 공유하기
      </Button>

      <button
        type="button"
        className={styles.backToMainButton}
        onClick={() => {
          window.location.href = '/';
        }}
      >
        더 많은 투표 보기
        <StartArrowIcon width={20} height={20} />
      </button>
    </div>
  );
};
