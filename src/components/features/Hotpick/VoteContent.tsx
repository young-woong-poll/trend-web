import type { FC } from 'react';

import { FlexibleLayout } from '@/components/common/FlexibleLayout/FlexibleLayout';
import { HotpickView } from '@/components/features/Hotpick/VoteView';
import type { HotpickDetailResponse } from '@/generated/models';

type THotpickContentProps = {
  hotpickAlias: string;
  data?: HotpickDetailResponse;
};

export const HotpickContent: FC<THotpickContentProps> = ({ hotpickAlias, data }) => {
  const election = data?.hotpick?.election;
  const items = election?.items ?? [];

  return (
    <FlexibleLayout>
      <HotpickView hotpickAlias={hotpickAlias} initialData={data}>
        {/* 서버에서 렌더링되는 정적 HTML (SEO 최적화) */}
        <div suppressHydrationWarning>
          {election && (
            <div key={election.electionId}>
              <h1>{election.title}</h1>
              <div>
                {items.map((item) => (
                  <div key={item.electionItemId}>
                    {item.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt={item.title} loading="lazy" />
                    )}
                    <span>{item.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </HotpickView>
    </FlexibleLayout>
  );
};
