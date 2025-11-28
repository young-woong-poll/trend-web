import type { FC } from 'react';

import { FlexibleLayout } from '@/components/common/FlexibleLayout/FlexibleLayout';
import { Header } from '@/components/common/Header/Header';
import styles from '@/components/features/Main/MainContent.module.scss';
import { PollCard } from '@/components/features/Main/PollCard/PollCard';
import type { MainDisplayResponse } from '@/types/trend';

type TMainContentProps = {
  initialData: MainDisplayResponse;
};

export const MainContent: FC<TMainContentProps> = ({ initialData }) => (
  <>
    <Header />
    <FlexibleLayout>
      <div className={styles.container}>
        {initialData?.trends?.map((trend) => (
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
