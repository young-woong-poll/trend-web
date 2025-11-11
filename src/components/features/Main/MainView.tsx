'use client';

import type { FC } from 'react';

import { FlexibleLayout } from '@/components/common/FlexibleLayout/FlexibleLayout';
import { Header } from '@/components/common/Header/Header';

import styles from './MainView.module.scss';
import { SurveyCard } from './SurveyCard/SurveyCard';

export const MainView: FC = () => {
  const handleStartSurvey = () => {
    console.warn('Survey started!');
    // TODO: Navigate to vote page
  };

  return (
    <>
      <Header />
      <FlexibleLayout>
        <div className={styles.container}>
          <SurveyCard
            title="대한민국 연애 난제"
            subtitle="당신의 문제라면?"
            participantCount={1200}
            onStart={handleStartSurvey}
          />
          <SurveyCard
            title="대한민국 연애 난제"
            subtitle="당신의 문제라면?"
            participantCount={1200}
            onStart={handleStartSurvey}
          />
          <SurveyCard
            title="대한민국 연애 난제"
            subtitle="당신의 문제라면?"
            participantCount={1200}
            onStart={handleStartSurvey}
          />
          <SurveyCard
            title="대한민국 연애 난제"
            subtitle="당신의 문제라면?"
            participantCount={1200}
            onStart={handleStartSurvey}
          />
        </div>
      </FlexibleLayout>
    </>
  );
};
