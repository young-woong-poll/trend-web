'use client';

import type { FC } from 'react';

import { FlexibleLayout } from '@/components/common/FlexibleLayout/FlexibleLayout';
import { SingleDetailView } from '@/components/features/Hotpick/SingleDetailView/SingleDetailView';
import { MainHeader } from '@/components/features/Main/MainHeader/MainHeader';

type SingleDetailContentProps = {
  hotpickAlias: string;
};

export const SingleDetailContent: FC<SingleDetailContentProps> = ({ hotpickAlias }) => (
  <>
    <MainHeader />
    <FlexibleLayout>
      <SingleDetailView hotpickAlias={hotpickAlias} />
    </FlexibleLayout>
  </>
);
