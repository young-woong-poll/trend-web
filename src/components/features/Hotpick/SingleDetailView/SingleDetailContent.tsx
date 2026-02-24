import type { FC } from 'react';

import { FlexibleLayout } from '@/components/common/FlexibleLayout/FlexibleLayout';
import { SingleDetailView } from '@/components/features/Hotpick/SingleDetailView/SingleDetailView';
import type { HotpickDetailResponse } from '@/generated/models';

type SingleDetailContentProps = {
  hotpickAlias: string;
  data?: HotpickDetailResponse;
};

export const SingleDetailContent: FC<SingleDetailContentProps> = ({ hotpickAlias, data }) => (
  <FlexibleLayout>
    <SingleDetailView hotpickAlias={hotpickAlias} initialData={data} />
  </FlexibleLayout>
);
