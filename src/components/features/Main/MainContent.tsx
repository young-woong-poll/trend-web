import type { FC } from 'react';

import { FlexibleLayout } from '@/components/common/FlexibleLayout/FlexibleLayout';
import styles from '@/components/features/Main/MainContent.module.scss';
import { MainHeader } from '@/components/features/Main/MainHeader/MainHeader';
import { MainView } from '@/components/features/Main/MainView';
import type { DisplayMainResponse } from '@/generated/models';

type TMainContentProps = {
  data?: DisplayMainResponse;
};

const formatCount = (count: number | undefined): string => {
  if (!count) {
    return '0';
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

export const MainContent: FC<TMainContentProps> = ({ data }) => (
  <>
    <MainHeader />
    <FlexibleLayout>
      <MainView initialData={data}>
        {/* 서버에서 렌더링되는 정적 HTML (SEO 최적화) */}
        {data && ((data.fixedTrends?.length ?? 0) > 0 || (data.trends?.length ?? 0) > 0) && (
          <div className={styles.container}>
            {/* 고정 핫픽 먼저 노출 */}
            {(data.fixedTrends ?? []).map((trend) => (
              <div key={`fixed-${trend.id}`} className={styles.cardWrapper}>
                <a href={`/vote/${trend.alias}`}>
                  <div className={styles.card}>
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
            ))}
            {/* 일반 핫픽 */}
            {(data.trends ?? []).map((trend) => (
              <div key={trend.id} className={styles.cardWrapper}>
                <a href={`/vote/${trend.alias}`}>
                  <div className={styles.card}>
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
            ))}
          </div>
        )}
      </MainView>
    </FlexibleLayout>
  </>
);
