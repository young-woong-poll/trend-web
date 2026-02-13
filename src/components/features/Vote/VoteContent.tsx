import type { FC } from 'react';

import { FlexibleLayout } from '@/components/common/FlexibleLayout/FlexibleLayout';
import { VoteView } from '@/components/features/Vote/VoteView';
import type { DisplayTrendDetailResponse } from '@/generated/models';

type TVoteContentProps = {
  hotpickAlias: string;
  data?: DisplayTrendDetailResponse;
};

export const VoteContent: FC<TVoteContentProps> = ({ hotpickAlias, data }) => {
  const elections = data?.items ?? [];

  return (
    <FlexibleLayout>
      <VoteView hotpickAlias={hotpickAlias} initialData={data}>
        {/* 서버에서 렌더링되는 정적 HTML (SEO 최적화) */}
        <div suppressHydrationWarning>
          {elections.map((election) => (
            <div key={election.id}>
              <h1>{election.title}</h1>
              <p>{election.label}</p>
              <div>
                {(election.options ?? []).map((option) => (
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
