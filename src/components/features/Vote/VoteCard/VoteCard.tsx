'use client';

import type { FC } from 'react';

import StartArrowIcon from '@/assets/icon/StartArrowIcon';
import { Button } from '@/components/common/Button';
import { ActionButtons } from '@/components/features/Vote/ActionButtons';
import { ResultVoteOption } from '@/components/features/Vote/ResultVoteOption';
import styles from '@/components/features/Vote/VoteCard/VoteCard.module.scss';
import { VoteOption } from '@/components/features/Vote/VoteOption';

interface VoteOptionType {
  id: number;
  text: string;
  imageUrl: string;
  // TODO : 제거
  show?: boolean;
}

interface VoteResult {
  optionId: number;
  voteCount: number;
  percentage: number;
}

interface VoteCardProps {
  /**
   * 카드 제목
   */
  title: string;
  /**
   * 카드 부제목
   */
  subtitle: string;
  /**
   * 투표 옵션 리스트
   */
  options: VoteOptionType[];
  /**
   * 선택된 옵션 ID
   */
  selectedOptionId: number | null;
  /**
   * 옵션 선택 핸들러
   */
  onOptionSelect: (id: number) => void;
  /**
   * 다음 버튼 클릭 핸들러
   */
  onNext: () => void;
  /**
   * 댓글 버튼 클릭 핸들러
   */
  onCommentClick?: () => void;
  /**
   * 링크 복사 버튼 클릭 핸들러
   */
  onLinkCopyClick?: () => void;
  /**
   * 댓글 수
   */
  commentCount?: number;
  /**
   * 투표 결과 데이터
   */
  results?: VoteResult[];
}

export const VoteCard: FC<VoteCardProps> = ({
  title,
  subtitle,
  options,
  selectedOptionId,
  onOptionSelect,
  onNext,
  onCommentClick,
  onLinkCopyClick,
  commentCount = 0,
  results = [],
}) => {
  const getResultForOption = (optionId: number) => results.find((r) => r.optionId === optionId);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>

      <div className={styles.options}>
        {options.map((option) => {
          if (option.show) {
            const result = getResultForOption(option.id);

            return (
              <ResultVoteOption
                key={option.id}
                text={option.text}
                imageUrl={option.imageUrl}
                voteCount={result?.voteCount || 0}
                percentage={result?.percentage || 0}
                isSelected={true}
              />
            );
          } else {
            return (
              <VoteOption
                key={option.id}
                text={option.text}
                imageUrl={option.imageUrl}
                isSelected={selectedOptionId === option.id}
                onClick={() => onOptionSelect(option.id)}
              />
            );
          }
        })}
      </div>

      <Button variant="gradient" height={48} onClick={onNext} fullWidth className={styles.button}>
        다음
        <StartArrowIcon />
      </Button>

      <ActionButtons
        commentCount={commentCount}
        onCommentClick={onCommentClick}
        onLinkCopyClick={onLinkCopyClick}
      />
    </div>
  );
};
