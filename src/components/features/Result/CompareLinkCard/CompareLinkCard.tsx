'use client';

import { useState } from 'react';

import CheckIcon from '@/assets/icon/CheckIcon';
import HelpCircleIcon from '@/assets/icon/HelpCircleIcon';
import ShareIcon from '@/assets/icon/ShareIcon';
import { Button } from '@/components/common/Button';
import styles from '@/components/features/Result/CompareLinkCard/CompareLinkCard.module.scss';
import { ComparisonWithFriend } from '@/components/features/Result/ComparisonWithFriend/ComparisonWithFriend';
import { COMPARE_LINK_COPIED_SUCCESS_FULL } from '@/constants/text';
import { useModal } from '@/contexts/ModalContext';
import { useResultDisplay } from '@/hooks/api';
import { useSetNickname } from '@/hooks/api/useResult';
import { validateNickname } from '@/lib/utils';
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

const ComparisonWithFriendModal = ({
  resultId,
  compareId,
}: {
  resultId: string;
  compareId: string;
}) => {
  const { data: myResult, isPending, isError } = useResultDisplay(resultId, compareId);
  const { hideModal } = useModal();

  if (isPending) {
    return <div>Loading...</div>;
  }
  if (isError) {
    return <div>에러 발생</div>;
  }

  return (
    <div onClick={hideModal}>
      <ComparisonWithFriend resultWithCompareId={myResult} />
    </div>
  );
};

export const CompareLinkCard = ({
  friendResults,
  myResult,
  resultId,
}: {
  friendResults?: InviteeResult[] | undefined;
  myResult: ResultDisplayResponse;
  resultId: string;
}) => {
  const hasError = false;
  const { showToast, showModal } = useModal();
  const { mutateAsync: updateNickname, isPending, isSuccess } = useSetNickname();
  const [name, setName] = useState<string | undefined>(myResult.nickname);
  const [needNickname, setNeedNickname] = useState<boolean>(!myResult.nickname);

  const handleLinkCopy = async () => {
    const currentUrl = window.location.href;
    await navigator.clipboard.writeText(currentUrl);
    showToast(COMPARE_LINK_COPIED_SUCCESS_FULL, <CheckIcon width={16} height={16} />);
  };

  const handleUpdateNickname = async () => {
    const { isValid, error, trimmedValue } = validateNickname(name ?? '');
    if (!isValid && error) {
      showToast(error);
    }
    await updateNickname({ resultId, nickname: trimmedValue });
    myResult.nickname = name;
    setNeedNickname(false);
  };

  const showComparisonWithFriendModal = (resultId: string, friendResultId: string) => {
    showModal(<ComparisonWithFriendModal resultId={resultId} compareId={friendResultId} />);
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
              <li
                key={index}
                className={styles.friendItem}
                onClick={() => showComparisonWithFriendModal(resultId, friend.resultId)}
              >
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

      {!needNickname || isSuccess ? (
        <Button variant="gradient" height={48} onClick={handleLinkCopy} fullWidth>
          <ShareIcon />
          비교 링크 복사
        </Button>
      ) : (
        <Button
          variant="gradient"
          height={48}
          onClick={async () => {
            await handleUpdateNickname();
            await handleLinkCopy();
          }}
          disabled={isPending}
          fullWidth
        >
          <ShareIcon />
          {isPending ? '비교 링크 생성중' : '비교 링크 만들기'}
        </Button>
      )}
    </div>
  );
};
