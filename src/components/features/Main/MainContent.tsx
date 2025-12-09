import type { FC } from 'react';

import { FlexibleLayout } from '@/components/common/FlexibleLayout/FlexibleLayout';
import { Header } from '@/components/common/Header/Header';
import styles from '@/components/features/Main/MainContent.module.scss';
import { PollCard } from '@/components/features/Main/PollCard/PollCard';
import type { MainDisplayResponse } from '@/types/trend';

type TMainContentProps = {
  initialData: MainDisplayResponse;
};

export const MainContent: FC<TMainContentProps> = ({ initialData }) => {
  if (initialData.trends.length === 0) {
    return (
      <>
        <Header />
        <FlexibleLayout>
          <div className={styles.container}>
            <div className={styles.emptyState}>
              <div className={styles.icon}>📊</div>
              <h2 className={styles.title}>아직 진행중인 트렌드가 없어요</h2>
              <p className={styles.description}>
                새로운 트렌드 투표가 시작되면 여기에 표시됩니다.
                <br />곧 흥미로운 주제로 찾아뵙겠습니다!
              </p>
            </div>
          </div>
        </FlexibleLayout>
      </>
    );
  }

  return (
    <>
      <Header />
      <FlexibleLayout>
        <div className={styles.container}>
          {initialData.trends.map((trend) => (
            <PollCard
              key={trend.id}
              id={trend.id}
              title={trend.title}
              subtitle={trend.label}
              imageUrl={trend.imageUrl}
              participantCount={trend.participantsCount}
            />
          ))}
        </div>
      </FlexibleLayout>
    </>
  );
};
