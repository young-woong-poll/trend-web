import type { FC } from 'react';

import { FlexibleLayout } from '@/components/common/FlexibleLayout/FlexibleLayout';
import { VoteView } from '@/components/features/Vote/VoteView';
import type { DisplayTrendDetailResponse } from '@/generated/models';

type TVoteContentProps = {
  trendAlias: string;
  data?: DisplayTrendDetailResponse;
};

export const VoteContent: FC<TVoteContentProps> = ({ trendAlias, data }) => {
  const items = data?.items ?? [];

  return (
    <FlexibleLayout>
      <VoteView trendAlias={trendAlias} initialData={data}>
        {/* 서버에서 렌더링되는 정적 HTML (SEO 최적화) */}
        <div suppressHydrationWarning>
          {items.map((item) => (
            <div key={item.id}>
              <h1>{item.title}</h1>
              <p>{item.label}</p>
              <div>
                {(item.options ?? []).map((option) => (
                  <div key={option.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={option.imageUrl} alt={option.title} loading="lazy" />
                    <span>{option.title}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </VoteView>
    </FlexibleLayout>
  );
};
