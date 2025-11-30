'use client';

import { useState } from 'react';

import CheckIcon from '@/assets/icon/CheckIcon';
import HelpCircleIcon from '@/assets/icon/HelpCircleIcon';
import ShareIcon from '@/assets/icon/ShareIcon';
import { Button } from '@/components/common/Button';
import styles from '@/components/features/Result/CompareLinkCard/CompareLinkCard.module.scss';
import { COMPARE_LINK_COPIED_SUCCESS_FULL } from '@/constants/text';
import { useModal } from '@/contexts/ModalContext';
import { useSetNickname } from '@/hooks/api/useResult';
import type { InviteeResult, ResultDisplayResponse } from '@/types/result';

const ArrowIcon = () => (
  <svg
    className={styles.chevronIcon}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9 18l6-6-6-6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const CompareLinkCard = ({
  friendResults,
  myResult,
  resultId,
}: {
  friendResults?: InviteeResult[] | undefined;
  myResult: ResultDisplayResponse | undefined;
  resultId: string;
}) => {
  const hasError = false;
  const { showToast } = useModal();
  const { mutateAsync: updateNickname } = useSetNickname();
  const [name, setName] = useState<string | undefined>(myResult?.nickname);
  const [needNickname, setNeedNickname] = useState<boolean>(!myResult?.nickname);

  const handleCompareLinkCopy = async () => {
    const currentUrl = window.location.href;
    await navigator.clipboard.writeText(currentUrl);
    if (needNickname && name) {
      await updateNickname({ resultId, nickname: name });
      if (myResult) {
        myResult.nickname = name;
        setNeedNickname(false);
      }
    }
    showToast(COMPARE_LINK_COPIED_SUCCESS_FULL, <CheckIcon width={16} height={16} />);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>친구와 비교하기</h2>
      <p className={styles.description}>친구가 투표하면 나와 일치율 확인 가능!</p>

      <h4 className={styles.resultLabel}>
        친구결과 <span>(최근 10개)</span>
      </h4>
      <div className={styles.resultBox}>
        {friendResults?.length === 0 ? (
          <p className={styles.emptyBox}>친구들이 비교 링크로 투표하면 결과가 나와요</p>
        ) : (
          <ul className={styles.friendList}>
            {friendResults?.map((friend, index) => (
              <li key={index} className={styles.friendItem}>
                <div className={styles.friendInfo}>
                  <div className={styles.friendHeader}>
                    <span className={styles.friendNickname}>{friend.nickname}</span>
                    <span className={styles.friendTimestamp}>{friend.createdAt}</span>
                  </div>
                  <p className={styles.friendComment}>&quot;{friend.compareType}&quot;</p>
                </div>
                <ArrowIcon />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.inputSection}>
        <div className={styles.inputHeader}>
          <label className={styles.label} htmlFor="nickname">
            닉네임
          </label>
          <span className={styles.helpIcon}>
            <HelpCircleIcon stroke="#bcc1ca" />
          </span>
        </div>
        <input
          id="nickname"
          type="text"
          placeholder="닉네임"
          disabled={!needNickname}
          defaultValue={name}
          onChange={({ target }) => setName(target.value)}
          className={`${styles.input} ${hasError ? styles.error : ''}`}
        />
      </div>

      <Button
        variant="gradient"
        height={48}
        onClick={handleCompareLinkCopy}
        disabled={!name || (typeof name === 'string' && name.length === 0)}
        fullWidth
      >
        <ShareIcon />
        비교 링크 만들기
      </Button>
    </div>
  );
};
