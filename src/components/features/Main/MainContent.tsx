import type { FC } from 'react';

import { FlexibleLayout } from '@/components/common/FlexibleLayout/FlexibleLayout';
import styles from '@/components/features/Main/MainContent.module.scss';
import { MainHeader } from '@/components/features/Main/MainHeader/MainHeader';
import { MainView } from '@/components/features/Main/MainView';
import type { MainHotpickResponse } from '@/generated/models';
import { formatCount } from '@/lib/utils';

type TMainContentProps = {
  data?: MainHotpickResponse;
};

export const MainContent: FC<TMainContentProps> = ({ data }) => (
  <div className={styles.pageWrapper}>
    <MainHeader />
    <FlexibleLayout>
      <MainView>
        {/* 서버에서 렌더링되는 정적 HTML (SEO 최적화) */}
        {data && (data.hotpicks?.length ?? 0) > 0 && (
          <div className={styles.cardGrid}>
            {(data.hotpicks ?? []).map((hotpick) => (
              <div key={hotpick.hotpickId} className={styles.cardWrapper}>
                <a href={`/hotpick/${hotpick.slug}`}>
                  <div className={styles.card}>
                    <h2 className={styles.title}>{hotpick.election?.title}</h2>
                    <div className={styles.participants}>
                      <span className={styles.label}>참여자</span>
                      <span className={styles.count}>
                        {formatCount(hotpick.election?.totalVoteCount)}
                      </span>
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
  </div>
);
