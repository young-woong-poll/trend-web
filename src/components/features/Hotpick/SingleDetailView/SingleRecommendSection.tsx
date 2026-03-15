'use client';

import { memo } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import StartArrowIcon from '@/assets/icon/StartArrowIcon';
import styles from '@/components/features/Hotpick/SingleDetailView/SingleDetailView.module.scss';
import type { HotpickCardResponse } from '@/generated/models';
import { OPTION_LABELS } from '@/types/singleVote';

interface SingleRecommendSectionProps {
  hotpickAlias: string;
  relatedHotpicks?: HotpickCardResponse[];
}

// eslint-disable-next-line react/display-name
export const SingleRecommendSection = memo<SingleRecommendSectionProps>(({ relatedHotpicks }) => {
  if (!relatedHotpicks || relatedHotpicks.length === 0) {
    return null;
  }

  return (
    <div className={styles.recommendSection} data-testid="recommend-section">
      <h2 className={styles.recommendTitle}>이런 투표는 어때요?</h2>
      <div className={styles.recommendCards} data-testid="recommend-cards">
        {relatedHotpicks.map((hotpick) => {
          const slug = hotpick.slug ?? '';
          const election = hotpick.election;
          if (!election) {
            return null;
          }

          const options = (election.items ?? []).map((item) => ({
            id: String(item.electionItemId ?? ''),
            text: item.title ?? '',
          }));
          const count = election.totalVoteCount ?? 0;
          const imageUrl = election.imageUrl ?? hotpick.imageUrl;

          return (
            <Link
              key={hotpick.hotpickId}
              href={`/hotpick/${slug}`}
              className={styles.recommendCard}
            >
              {imageUrl && (
                <div className={styles.recommendCardImageWrap}>
                  <Image
                    src={imageUrl}
                    alt={election.title ?? ''}
                    width={40}
                    height={40}
                    className={styles.recommendCardImage}
                  />
                </div>
              )}
              <div className={styles.recommendCardBody}>
                <span className={styles.recommendCardTitle}>{election.title ?? ''}</span>
                <div className={styles.recommendCardOptions}>
                  {options.slice(0, 2).map((opt, i) => (
                    <span key={opt.id} className={styles.recommendCardOption}>
                      <span className={styles.recommendCardLabel}>{OPTION_LABELS[i]}</span>
                      {opt.text}
                    </span>
                  ))}
                </div>
                <span className={styles.recommendCardMeta}>{count.toLocaleString()}명 참여</span>
              </div>
            </Link>
          );
        })}
      </div>
      <Link href="/" className={styles.backToMainButton}>
        더 많은 투표 보기
        <StartArrowIcon width={20} height={20} />
      </Link>
    </div>
  );
});
