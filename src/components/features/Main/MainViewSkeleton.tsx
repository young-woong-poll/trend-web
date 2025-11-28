import type { FC } from 'react';

import { FlexibleLayout } from '@/components/common/FlexibleLayout/FlexibleLayout';
import { Header } from '@/components/common/Header/Header';
import { Skeleton } from '@/components/common/Skeleton/Skeleton';
import styles from '@/components/features/Main/MainViewSkeleton.module.scss';

export const MainViewSkeleton: FC = () => (
  <>
    <Header />
    <FlexibleLayout>
      <div className={styles.container}>
        {/* 3개의 PollCard 스켈레톤 표시 */}
        {[1, 2, 3, 4].map((index) => (
          <div key={index} className={styles.card}>
            {/* 배경 이미지 영역 */}
            <Skeleton height={240} borderRadius={16} />

            {/* 카드 내부 컨텐츠 */}
            <div className={styles.content}>
              <div className={styles.textArea}>
                <Skeleton height={28} width="60%" borderRadius={8} />
                <Skeleton height={20} width="40%" borderRadius={6} />
              </div>

              <div className={styles.bottom}>
                <Skeleton height={20} width={80} borderRadius={6} />
                <Skeleton height={48} width={160} borderRadius={24} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </FlexibleLayout>
  </>
);
