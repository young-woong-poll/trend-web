'use client';

import type { FC } from 'react';

import { LazyMotion, domAnimation } from 'framer-motion';

import { FlexibleLayout } from '@/components/common/FlexibleLayout/FlexibleLayout';
import { SingleDetailView } from '@/components/features/Hotpick/SingleDetailView/SingleDetailView';
import { MainHeader } from '@/components/features/Main/MainHeader/MainHeader';
import type { HotpickDetailResponse } from '@/generated/models';

type SingleDetailContentProps = {
  hotpickAlias: string;
  data?: HotpickDetailResponse;
};

export const SingleDetailContent: FC<SingleDetailContentProps> = ({ hotpickAlias, data }) => (
  <>
    <MainHeader />
    <FlexibleLayout>
      <LazyMotion features={domAnimation}>
        <SingleDetailView hotpickAlias={hotpickAlias} serverData={data} />
      </LazyMotion>
    </FlexibleLayout>
  </>
);
