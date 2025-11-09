'use client';

import type { FC } from 'react';

import { SurveyCard } from './SurveyCard/SurveyCard';
import styles from './MainView.module.scss';

export const MainView: FC = () => {
  const handleStartSurvey = () => {
    console.warn('Survey started!');
    // TODO: Navigate to vote page
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <SurveyCard
          title="대한민국 연애 난제"
          subtitle="당신의 문제라면?"
          participantCount={1200}
          onStart={handleStartSurvey}
        />
      </main>
    </div>
  );
};
