'use client';

import { useEffect, useState, type FC } from 'react';

import { useRouter } from 'next/navigation';

import CheckIcon from '@/assets/icon/CheckIcon';
import InfoIcon from '@/assets/icon/InfoIcon';
import StartArrowIcon from '@/assets/icon/StartArrowIcon';
import { Button } from '@/components/common/Button';
import { FlexibleLayout } from '@/components/common/FlexibleLayout/FlexibleLayout';
import { ProgressBar } from '@/components/common/ProgressBar';
import { ActionButtons } from '@/components/features/Vote/ActionButtons';
import { VoteCard } from '@/components/features/Vote/VoteCard';
import styles from '@/components/features/Vote/VoteView.module.scss';
import { useModal } from '@/contexts/ModalContext';
import { useTrendDisplay, useTrendVoteCount } from '@/hooks/api';

type TVoteViewProps = {
  type: string;
};

const DEFAULT_NUM_OF_ITEMS = 5;

export const VoteView: FC<TVoteViewProps> = ({ type }) => {
  const router = useRouter();

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string | null>>({});
  const { showToast, showConfirm, showAlert } = useModal();

  const { data: { items = [] } = {} } = useTrendDisplay(type);
  const { data: voteCountMap = {} } = useTrendVoteCount(type);

  // 뒤로가기 이벤트 처리
  useEffect(() => {
    let isConfirming = false;

    const handlePopState = () => {
      if (isConfirming) {
        return;
      }

      isConfirming = true;

      showConfirm('투표가 저장되지 않습니다.', {
        message: '투표를 그만두시겠습니까?',
        confirmText: '그만두기',
        cancelText: '취소',
        onConfirm: () => {
          isConfirming = true;
          // popstate 리스너를 제거한 후 뒤로가기
          window.removeEventListener('popstate', handlePopState);
          router.back();
        },
      });

      // 취소를 누르면 다시 히스토리 추가
      window.history.pushState(null, '', window.location.href);
      isConfirming = false;
    };

    // 페이지 진입 시 히스토리 추가
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [router, showConfirm]);

  const handleOptionSelect = (cardId: string, optionId: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [cardId]: optionId,
    }));
  };

  const handleNext = () => {
    if (currentCardIndex < items.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
      return;
    }

    showAlert('닉네임 입력', {
      message: '링크를 보낸 친구에게 보여질 이름을 입력해주세요!',
      inputType: 'text',
      inputPlaceholder: '닉네임을 입력해주세요',
      confirmText: '확인',
      cancelText: '나중에 하기',
      onConfirm: (nickname) => {
        const trimmed = nickname?.trim();
        if (!trimmed) {
          showToast('닉네임을 입력해주세요');
          return;
        }

        const voteResults = items.map((item) => {
          const selectedOptionId = selectedOptions[item.id];
          const selectedOption = item.options.find((opt) => opt.id === selectedOptionId);
          return {
            itemId: item.id,
            question: item.title,
            options: item.options.map((opt) => opt.title),
            selectedOptionId: selectedOptionId || null,
            selectedOptionTitle: selectedOption?.title || null,
          };
        });

        const storageKey = `vote_${type}_${Date.now()}`;
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            type,
            nickname: trimmed,
            results: voteResults,
            timestamp: Date.now(),
          })
        );

        localStorage.setItem(`vote_${type}_latest`, storageKey);

        // TODO: 서버에 결과 생성 API 연동 후 resultId로 이동
        router.push(`/vote/${type}/result?key=${storageKey}`);
      },
    });
  };

  const handleCommentClick = () => {
    const currentItem = items[currentCardIndex];
    if (!selectedOptions[currentItem.id]) {
      showToast('투표하면 댓글을 확인할 수 있습니다', <InfoIcon />);
      return;
    }
    // eslint-disable-next-line no-console
    console.log('댓글 버튼 클릭');
  };

  const handleLinkCopyClick = async () => {
    try {
      const currentUrl = window.location.href;
      await navigator.clipboard.writeText(currentUrl);
      showToast('투표 링크가 복사되었습니다', <CheckIcon />);
    } catch (_error) {
      showToast('링크 복사에 실패했습니다', <InfoIcon />);
    }
  };

  return (
    <FlexibleLayout>
      <div className={styles.container}>
        <ProgressBar
          currentStep={currentCardIndex}
          totalSteps={items.length || DEFAULT_NUM_OF_ITEMS}
        />
        <div
          className={styles.content}
          style={{
            transform: `translateX(calc(-${currentCardIndex} * 100%))`,
          }}
        >
          {items.length > 0 &&
            items.map((item) => (
              <div key={item.id} className={styles.cardContainer}>
                <VoteCard
                  title={item.title}
                  label={item.label}
                  options={item.options}
                  selectedOptionId={selectedOptions[item.id] || null}
                  onOptionSelect={(optionId) => handleOptionSelect(item.id, optionId)}
                  voteCountMap={voteCountMap}
                />

                <Button
                  variant="gradient"
                  height={48}
                  onClick={handleNext}
                  fullWidth
                  className={styles.button}
                  disabled={!selectedOptions[item.id]}
                >
                  다음
                  <StartArrowIcon />
                </Button>

                <ActionButtons
                  commentCount={101}
                  onCommentClick={handleCommentClick}
                  onLinkCopyClick={handleLinkCopyClick}
                  commentDisabled={!selectedOptions[item.id]}
                />
              </div>
            ))}
        </div>
      </div>
    </FlexibleLayout>
  );
};
