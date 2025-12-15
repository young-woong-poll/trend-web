'use client';

import { useSearchParams } from 'next/navigation';

import CheckIcon from '@/assets/icon/CheckIcon';
import { Header } from '@/components/common/Header/Header';
import { Skeleton } from '@/components/common/Skeleton/Skeleton';
import { CompareLinkCard } from '@/components/features/Result/CompareLinkCard/CompareLinkCard';
import { ComparisonWithFriend } from '@/components/features/Result/ComparisonWithFriend/ComparisonWithFriend';
import { CopyUrlCard } from '@/components/features/Result/CopyUrlCard/CopyUrlCard';
import styles from '@/components/features/Result/ResultView.module.scss';
import { TypeCard } from '@/components/features/Result/TypeCard/TypeCard';
import { VOTE_LINK_COPIED_SUCCESS_FULL } from '@/constants/text';
import { useModal } from '@/contexts/ModalContext';
import { useResultDisplay, useResultDisplayInvitee } from '@/hooks/api';

interface ResultViewProps {
  type: string;
}

// 기본 questions (fallback용)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const defaultQuestions = [
  {
    question: '당신은 어떤 이성에게 끌리나요?',
    options: ['안끌리는 모범생', '끌리는 양아치'] as [string, string],
    selectedIndex: 0,
  },
  {
    question: '스킨십은 언제부터 하는 것이 좋을까요?',
    options: ['100일 지나고 스킨십', '사귀기 전에 스킨십'] as [string, string],
    selectedIndex: 0,
  },
  {
    question: '연인에게 중요한 것은 무엇인가요?',
    options: ['평범한데 성격 좋음', '성격보단 얼굴'] as [string, string],
    selectedIndex: 1,
  },
  {
    question: '이번 스타일의 남자를 선호하나요?',
    options: ['가난한 진심남', '돈많은 헌팅남'] as [string, string],
    selectedIndex: 1,
  },
  {
    question: '연인과의 연락 빈도는 어느 정도가 적당한가요?',
    options: ['하루에 두번 전화', '한달에 한번 전화'] as [string, string],
    selectedIndex: 0,
  },
];

export interface ComparisonItem {
  myAnswer: string;
  friendAnswer: string;
  isMatch: boolean;
  question: string;
}

export const ResultView = ({ type: _type }: ResultViewProps) => {
  const searchParams = useSearchParams();
  const resultId = searchParams.get('id') as string;
  const compareId = searchParams.get('compareId') as string | undefined;
  const { showToast } = useModal();

  const {
    data: myResult,
    isPending,
    isError: resultError,
  } = useResultDisplay(resultId, compareId ?? '');
  const { data: resultOfFriends, isError: friendResultError } = useResultDisplayInvitee(resultId);

  if (isPending) {
    return (
      <div className={styles.container}>
        <Skeleton height={240} width="60%" borderRadius={8} />
      </div>
    );
  }

  if (resultError) {
    return <div>이 부분을 어떻게 보여줘야할지 </div>;
  }

  return (
    <div className={styles.container}>
      <Header />

      <div className={styles.content}>
        {compareId ? (
          <ComparisonWithFriend resultWithCompareId={myResult} compareId={compareId} />
        ) : (
          <TypeCard
            questions={myResult.trend}
            selectedOptions={myResult.selectedOptions}
            resultType={myResult.resultType}
          />
        )}
        {!friendResultError && (
          <CompareLinkCard
            friendResults={resultOfFriends?.results}
            myResult={myResult}
            resultId={resultId}
          />
        )}
        <CopyUrlCard
          onCopyUrl={async () => {
            const currentUrl = window.location.href;
            await navigator.clipboard.writeText(currentUrl);
            showToast(VOTE_LINK_COPIED_SUCCESS_FULL, <CheckIcon width={16} height={16} />);
          }}
        />
      </div>
    </div>
  );
};
