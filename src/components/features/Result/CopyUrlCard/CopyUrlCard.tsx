'use client';

import CheckIcon from '@/assets/icon/CheckIcon';
import ClipIcon from '@/assets/icon/ClipIcon';
import { Button } from '@/components/common/Button';
import styles from '@/components/features/Result/CopyUrlCard/CopyUrlCard.module.scss';
import { VOTE_LINK_COPIED_SUCCESS_FULL } from '@/constants/text';
import { useModal } from '@/contexts/ModalContext';

export const CopyUrlCard = () => {
  const { showToast } = useModal();

  const handleCopyUrl = async () => {
    const currentUrl = window.location.href;
    await navigator.clipboard.writeText(currentUrl);
    showToast(VOTE_LINK_COPIED_SUCCESS_FULL, <CheckIcon width={16} height={16} />);
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>나중에 확인하고 싶다면?</h3>
      <p className={styles.description}>
        이 페이지를 URL을 저장해두면 언제든지 다시 확인할 수 있습니다.
      </p>
      <Button
        variant="primary"
        height={48}
        onClick={handleCopyUrl}
        fullWidth
        className={styles.button}
      >
        <ClipIcon />
        URL 복사
      </Button>
    </div>
  );
};
