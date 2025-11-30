'use client';

import { useSearchParams } from 'next/navigation';

import CheckIcon from '@/assets/icon/CheckIcon';
import { Header } from '@/components/common/Header/Header';
import { CompareLinkCard } from '@/components/features/Result/CompareLinkCard/CompareLinkCard';
import { ComparisonCard } from '@/components/features/Result/ComparisonCard/ComparisonCard';
import { CopyUrlCard } from '@/components/features/Result/CopyUrlCard/CopyUrlCard';
import styles from '@/components/features/Result/ResultView.module.scss';
import { TypeCard } from '@/components/features/Result/TypeCard/TypeCard';
import { VOTE_LINK_COPIED_SUCCESS_FULL } from '@/constants/text';
import { useModal } from '@/contexts/ModalContext';
import { useResultDisplay, useResultDisplayInvitee } from '@/hooks/api';
import type { ResultDisplayResponse } from '@/types/result';

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

const ComparisonWithFriend = ({ myResult }: { myResult: ResultDisplayResponse | undefined }) => {
  const idTitle: { [key: string]: string } = {};

  myResult?.trend.items.forEach((item) => {
    item.options.forEach((option) => {
      idTitle[option.id] = option.title;
    });
  });

  return (
    <ComparisonCard
      myName={myResult?.nickname}
      friendNickname={myResult?.inviterNickname}
      matchCount={myResult?.matchCount ?? 0}
      totalCount={myResult?.totalCount ?? 0}
      compareType={myResult?.compareType}
      comparisons={(() => {
        const myAnswers = myResult?.selectedOptions;
        const friendAnswers = myResult?.inviterSelectedOptions;
        const data: ComparisonItem[] = [];
        for (let i = 0; i < (myResult?.trend.items.length ?? 0); i += 1) {
          data.push({
            question: myResult?.trend.items[i].title ?? '',
            myAnswer: idTitle[myAnswers ? myAnswers[i] : ''] ?? '',
            friendAnswer: idTitle[friendAnswers ? friendAnswers[i] : ''] ?? '',
            isMatch: myAnswers && friendAnswers ? myAnswers[i] === friendAnswers[i] : false,
          });
        }
        return data;
      })()}
    />
  );
};

export const ResultView = ({ type: _type }: ResultViewProps) => {
  const searchParams = useSearchParams();
  const resultId = searchParams.get('id') as string;
  const { showToast } = useModal();

  const { data: myResult } = useResultDisplay(resultId);
  const { data: resultOfFriends } = useResultDisplayInvitee(resultId);

  return (
    <div className={styles.container}>
      <Header />

      <div className={styles.content}>
        {resultId.includes('invite') ? (
          <ComparisonWithFriend myResult={myResult as ResultDisplayResponse} />
        ) : (
          <TypeCard questions={myResult?.trend} selectedOptions={myResult?.selectedOptions} />
        )}
        <CompareLinkCard
          friendResults={resultOfFriends?.results}
          myResult={myResult}
          resultId={resultId}
        />
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
