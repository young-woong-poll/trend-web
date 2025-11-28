'use client';

import { createContext, useContext, useState, type ReactNode, type FC } from 'react';

import { useSearchParams } from 'next/navigation';

import CheckIcon from '@/assets/icon/CheckIcon';
import InfoIcon from '@/assets/icon/InfoIcon';
import { NicknameInputModal } from '@/components/features/Vote/NicknameInputModal';
import type { TSelectedItemMap } from '@/components/features/Vote/VoteView';
import { useModal } from '@/contexts/ModalContext';
import { useTrendVoteCount } from '@/hooks/api/useTrend';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useVoteSubmission } from '@/hooks/useVoteSubmission';
import type { TrendItem } from '@/types/trend';

type VoteState = {
  currentItemIndex: number;
  selectedItemMap: TSelectedItemMap;
  voteCountMap: Record<string, number>;
  handleOptionSelect: (itemId: string, optionId: string) => void;
  handleNext: () => Promise<void>;
  handleCommentClick: () => void;
  handleLinkCopyClick: () => Promise<void>;
};

const VoteStateContext = createContext<VoteState | null>(null);

export const useVoteState = () => {
  const context = useContext(VoteStateContext);
  if (!context) {
    throw new Error('useVoteState must be used within VoteStateManager');
  }
  return context;
};

type VoteStateManagerProps = {
  trendId: string;
  items: TrendItem[];
  children: ReactNode;
};

export const VoteStateManager: FC<VoteStateManagerProps> = ({ trendId, items, children }) => {
  const searchParams = useSearchParams();
  const compare = searchParams.get('compare');

  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [selectedItemMap, setSelectedItemMap] = useState<TSelectedItemMap>({});
  const { showToast, showModal } = useModal();

  // 클라이언트에서 실시간 투표 수 조회
  const { data: voteCountMap = {} } = useTrendVoteCount(trendId);

  const { submit } = useVoteSubmission();
  const handleError = useErrorHandler();

  const handleOptionSelect = (itemId: string, optionId: string) => {
    setSelectedItemMap((prev) => ({
      ...prev,
      [itemId]: optionId,
    }));
  };

  const handleNext = async () => {
    if (currentItemIndex < items.length - 1) {
      setCurrentItemIndex((prev) => prev + 1);

      return;
    }

    if (!!compare) {
      showModal(
        <NicknameInputModal
          onSubmit={(nickname) => handleSubmit(nickname)}
          onSkip={() => handleSubmit()}
        />
      );

      return;
    }

    await handleSubmit();
  };

  const handleSubmit = async (nickname?: string) => {
    try {
      await submit(selectedItemMap, items.length, nickname);
    } catch (err) {
      handleError(err);
    }
  };

  const handleCommentClick = () => {
    const currentItem = items[currentItemIndex];

    if (!selectedItemMap[currentItem.id]) {
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

  const value: VoteState = {
    currentItemIndex,
    selectedItemMap,
    voteCountMap,
    handleOptionSelect,
    handleNext,
    handleCommentClick,
    handleLinkCopyClick,
  };

  return <VoteStateContext.Provider value={value}>{children}</VoteStateContext.Provider>;
};
