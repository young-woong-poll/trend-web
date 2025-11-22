import type { FC } from 'react';

import { FlexibleLayout } from '@/components/common/FlexibleLayout/FlexibleLayout';
import { ProgressBar } from '@/components/common/ProgressBar';
import { Skeleton } from '@/components/common/Skeleton/Skeleton';
import styles from '@/components/features/Vote/VoteView.module.scss';
import skeletonStyles from '@/components/features/Vote/VoteViewSkeleton.module.scss';

const DEFAULT_NUM_OF_ITEMS = 5;

export const VoteViewSkeleton: FC = () => (
  <FlexibleLayout>
    <div className={styles.container}>
      <ProgressBar currentStep={0} totalSteps={DEFAULT_NUM_OF_ITEMS} />

      <div className={styles.content}>
        <div className={styles.cardContainer}>
          {/* Header Skeleton */}
          <div className={skeletonStyles.header}>
            <Skeleton height={32} width="70%" borderRadius={8} />
            <Skeleton height={20} width="50%" borderRadius={8} />
          </div>

          {/* Options Skeleton */}
          <div className={skeletonStyles.options}>
            <div className={skeletonStyles.optionCard}>
              <Skeleton height={200} borderRadius={12} />
              <Skeleton height={24} width="60%" borderRadius={6} />
            </div>
            <div className={skeletonStyles.optionCard}>
              <Skeleton height={200} borderRadius={12} />
              <Skeleton height={24} width="60%" borderRadius={6} />
            </div>
          </div>

          {/* Button Skeleton */}
          <div className={skeletonStyles.buttonContainer}>
            <Skeleton height={48} borderRadius={24} />
          </div>

          {/* Action Buttons Skeleton */}
          <div className={skeletonStyles.actionButtons}>
            <Skeleton height={40} width={100} borderRadius={20} />
            <Skeleton height={40} width={100} borderRadius={20} />
          </div>
        </div>
      </div>
    </div>
  </FlexibleLayout>
);
