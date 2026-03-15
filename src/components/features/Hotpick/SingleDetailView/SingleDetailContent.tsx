'use client';

import type { FC } from 'react';

import { LazyMotion, domAnimation } from 'framer-motion';

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
      <LazyMotion features={domAnimation}>
        <SingleDetailView hotpickAlias={hotpickAlias} />
      </LazyMotion>
    </FlexibleLayout>
  </>
);
