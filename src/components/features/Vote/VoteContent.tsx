'use client';

import type { FC } from 'react';

import { useQuery } from '@tanstack/react-query';

import { FlexibleLayout } from '@/components/common/FlexibleLayout/FlexibleLayout';
import { VoteView } from '@/components/features/Vote/VoteView';
import { displayQueries } from '@/lib/react-query/queries';

type TVoteContentProps = {
  trendAlias: string;
};

export const VoteContent: FC<TVoteContentProps> = ({ trendAlias }) => {
  const { data: trendData } = useQuery(displayQueries.trend(trendAlias));

  // 데이터 로딩 중이거나 없는 경우
  if (!trendData) {
    return (
      <FlexibleLayout>
        <div>Loading...</div>
      </FlexibleLayout>
    );
  }

  const items = trendData.items;

  return (
    <FlexibleLayout>
      <VoteView trendAlias={trendAlias}>
        {/* 서버에서 렌더링되는 정적 HTML (SEO 최적화) */}
        <div suppressHydrationWarning>
          {items.map((item) => (
            <div key={item.id}>
              <h1>{item.title}</h1>
              <p>{item.label}</p>
              <div>
                {item.options.map((option) => (
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
