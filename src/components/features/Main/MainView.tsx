'use client';

import type { FC } from 'react';

import { useRouter } from 'next/navigation';

import { FlexibleLayout } from '@/components/common/FlexibleLayout/FlexibleLayout';
import { Header } from '@/components/common/Header/Header';
import styles from '@/components/features/Main/MainView.module.scss';
import { PollCard } from '@/components/features/Main/PollCard/PollCard';

export const MainView: FC = () => {
  const router = useRouter();

  const handleStartSurvey = (pollId: string) => router.push(`/vote/${pollId}`);
  return (
    <>
      <Header />
      <FlexibleLayout>
        <div className={styles.container}>
          <PollCard
            title="대한민국 연애 난제"
            subtitle="당신의 문제라면?"
            participantCount={1200}
            onStart={() => handleStartSurvey('love')}
          />
          <PollCard
            title="대한민국 연애 난제"
            subtitle="당신의 문제라면?"
            participantCount={1200}
            onStart={() => handleStartSurvey('love')}
          />
          <PollCard
            title="대한민국 연애 난제"
            subtitle="당신의 문제라면?"
            participantCount={1200}
            onStart={() => handleStartSurvey('love')}
          />
          <PollCard
            title="대한민국 연애 난제"
            subtitle="당신의 문제라면?"
            participantCount={1200}
            onStart={() => handleStartSurvey('love')}
          />
        </div>
      </FlexibleLayout>
    </>
  );
};
