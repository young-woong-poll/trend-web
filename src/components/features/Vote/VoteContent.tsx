import type { FC } from 'react';

import { FlexibleLayout } from '@/components/common/FlexibleLayout/FlexibleLayout';
import { VoteContentUI } from '@/components/features/Vote/VoteContentUI';
import { VoteStateManager } from '@/components/features/Vote/VoteStateManager';
import type { TrendDisplayResponse } from '@/types/trend';

type TVoteContentProps = {
  initialTrendData: TrendDisplayResponse;
  trendId: string;
};

export const VoteContent: FC<TVoteContentProps> = ({ initialTrendData, trendId }) => {
  const items = initialTrendData.items || [];

  return (
    <VoteStateManager trendId={trendId} items={items}>
      <FlexibleLayout>
        <VoteContentUI items={items} />
      </FlexibleLayout>
    </VoteStateManager>
  );
};
