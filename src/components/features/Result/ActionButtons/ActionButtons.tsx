'use client';

import type { FC } from 'react';

import CameraIcon from '@/assets/icon/CameraIcon';
import CheckIcon from '@/assets/icon/CheckIcon';
import LinkIcon from '@/assets/icon/LinkIcon';
import { Button } from '@/components/common/Button';
import styles from '@/components/features/Result/ActionButtons/ActionButtons.module.scss';
import { useModal } from '@/contexts/ModalContext';

interface ActionButtonsProps {
  trendAlias: string;
}

export const ActionButtons: FC<ActionButtonsProps> = ({ trendAlias }) => {
  const { showToast } = useModal();

  // 내 유형 저장하기 - 현재 페이지(ResultPage) URL 복사
  const handleSaveType = async () => {
    await navigator.clipboard.writeText(window.location.href);
    showToast('링크가 복사되었습니다', <CheckIcon width={16} height={16} />);
  };

  // 투표 공유하기 - VotePage URL 복사
  const handleShareVote = async () => {
    const voteUrl = `${window.location.origin}/vote/${trendAlias}`;
    await navigator.clipboard.writeText(voteUrl);
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
    </div>
  );
};
