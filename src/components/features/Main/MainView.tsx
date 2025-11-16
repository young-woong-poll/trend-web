'use client';

import type { FC } from 'react';

import { useRouter } from 'next/navigation';

import { FlexibleLayout } from '@/components/common/FlexibleLayout/FlexibleLayout';
import { Header } from '@/components/common/Header/Header';
import styles from '@/components/features/Main/MainView.module.scss';
import { PollCard } from '@/components/features/Main/PollCard/PollCard';
import { useMainDisplay } from '@/hooks/api';

export const MainView: FC = () => {
  const router = useRouter();

  const { data } = useMainDisplay();

  const handleStartSurvey = (pollId: string) => router.push(`/vote/${pollId}`);

  return (
    <>
      <Header />
      <FlexibleLayout>
        <div className={styles.container}>
          {data?.trends.map((trend) => (
            <PollCard
              key={trend.id}
              title={trend.title}
              subtitle={trend.label}
              imageUrl={trend.imageUrl}
              participantCount={trend.participantsCount}
              onStart={() => handleStartSurvey(trend.id)}
            />
          ))}
        </div>
      </FlexibleLayout>
    </>
  );
};
