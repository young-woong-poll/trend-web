'use client';

import type { FC, ReactNode } from 'react';

import { useQuery } from '@tanstack/react-query';

import styles from '@/components/features/Main/MainContent.module.scss';
import { PollCard } from '@/components/features/Main/PollCard/PollCard';
import { displayQueries } from '@/lib/react-query/queries';
import type { MainDisplayResponse } from '@/types/trend';

type TMainViewProps = {
  initialData?: MainDisplayResponse;
  children?: ReactNode;
};

const isValidImageUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

export const MainView: FC<TMainViewProps> = ({ initialData, children }) => {
  const { data } = useQuery(displayQueries.main());

  const displayData = data ?? initialData;

  if (!displayData || displayData.trends.length === 0) {
    return (
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
    );
  }

  return (
    <>
      {/* 서버에서 생성된 정적 HTML (SEO용) - children은 서버에서 렌더링됨 */}
      <noscript>{children}</noscript>

      <div className={styles.container}>
        {displayData.trends.map((trend) => {
          const validImageUrl = isValidImageUrl(trend.imageUrl)
            ? trend.imageUrl
            : 'https://picsum.photos/400/300?random=placeholder';

          return (
            <PollCard
              key={trend.id}
              alias={trend.alias}
              title={trend.title}
              subtitle={trend.label}
              createdAt={trend.createdAt}
              imageUrl={validImageUrl}
              participantCount={trend.participantsCount}
            />
          );
        })}
      </div>
    </>
  );
};
