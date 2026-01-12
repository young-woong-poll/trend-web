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

  // 서버에서 prefetch되므로 data는 항상 존재
  if (!trendData) {
    return null; // 또는 Skeleton UI
  }

  const items = trendData.items;
  return (
    <FlexibleLayout>
      <VoteView trendData={trendData}>
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
