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

  const formatCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // 유효한 이미지 URL인지 확인
  const isValidImageUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  return (
    <>
      <Header />
      <FlexibleLayout>
        <div className={styles.container}>
          {initialData.trends.map((trend) => {
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
              >
                {/* 서버에서 렌더링되는 정적 HTML (SEO 최적화) */}
                <div suppressHydrationWarning className={styles.cardWrapper}>
                  <a href={`/vote/${trend.alias}`}>
                    <div className={styles.card}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={validImageUrl} alt={trend.title} loading="lazy" />
                      <h2 className={styles.title}>{trend.title}</h2>
                      <p className={styles.subtitle}>{trend.label}</p>
                      <div className={styles.participants}>
                        <span className={styles.label}>참여자</span>
                        <span className={styles.count}>{formatCount(trend.participantsCount)}</span>
                      </div>
                      <svg
                        className={styles.arrowIcon}
                        width="24"
                        height="32"
                        viewBox="0 0 24 32"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M9 8L15 16L9 24"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </a>
                </div>
              </PollCard>
            );
          })}
        </div>
      </FlexibleLayout>
    </>
  );
};
