import type { FC } from 'react';

import { FlexibleLayout } from '@/components/common/FlexibleLayout/FlexibleLayout';
import { VoteContentClient } from '@/components/features/Vote/VoteContentClient';
import type { TrendDisplayResponse } from '@/types/trend';

type TVoteContentProps = {
  initialTrendData: TrendDisplayResponse;
  trendId: string;
};

export const VoteContent: FC<TVoteContentProps> = ({ initialTrendData, trendId }) => {
  const items = initialTrendData.items || [];

  return (
    <FlexibleLayout>
      <VoteContentClient initialTrendData={initialTrendData} trendId={trendId}>
        {/* 서버에서 렌더링되는 정적 HTML (SEO 최적화) */}
        <div suppressHydrationWarning>
          {items.map((item) => (
            <div key={item.id}>
              <h1>{item.title}</h1>
              <p>{item.label}</p>
              <div>
                {item.options.map((option) => (
                  <div key={option.id}>
                    <img src={option.imageUrl} alt={option.title} loading="lazy" />
                    <span>{option.title}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </VoteContentClient>
    </FlexibleLayout>
  );
};
