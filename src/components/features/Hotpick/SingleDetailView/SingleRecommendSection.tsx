'use client';

import type { FC } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import StartArrowIcon from '@/assets/icon/StartArrowIcon';
import styles from '@/components/features/Hotpick/SingleDetailView/SingleDetailView.module.scss';
import { useRecommendSingles } from '@/hooks/api/useDisplay';
import { OPTION_LABELS } from '@/types/singleVote';

interface SingleRecommendSectionProps {
  hotpickAlias: string;
  categoryCode?: string;
}

export const SingleRecommendSection: FC<SingleRecommendSectionProps> = ({
  hotpickAlias,
  categoryCode,
}) => {
  const { data: recommendData } = useRecommendSingles(hotpickAlias, categoryCode);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const trends = (recommendData as any)?.trends as any[] | undefined;
  if (!trends || trends.length === 0) {
    return null;
  }

  return (
    <div className={styles.recommendSection}>
      <h2 className={styles.recommendTitle}>이런 투표는 어때요?</h2>
      <div className={styles.recommendCards}>
        {trends.map((trend) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const item = trend as any;
          const alias = trend.alias ?? '';

          if (item.type !== 'SINGLE' || !item.singleVote) {
            return null;
          }

          const options = item.singleVote?.options ?? [];
          const count = trend.participantsCount ?? 0;
          const imageUrl = trend.imageUrls?.[0] as string | undefined;

          return (
            <Link key={trend.id} href={`/hotpick/${alias}`} className={styles.recommendCard}>
              {imageUrl && (
                <div className={styles.recommendCardImageWrap}>
                  <Image
                    src={imageUrl}
                    alt={trend.title ?? ''}
                    width={40}
                    height={40}
                    className={styles.recommendCardImage}
                  />
                </div>
              )}
              <div className={styles.recommendCardBody}>
                <span className={styles.recommendCardTitle}>{trend.title ?? ''}</span>
                <div className={styles.recommendCardOptions}>
                  {options.slice(0, 2).map((opt: { id: string; text: string }, i: number) => (
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
};
