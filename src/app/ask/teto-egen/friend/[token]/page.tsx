'use client';

import { use } from 'react';

import FriendFlow from '@/components/features/TetoEgen/FriendFlow';

type PageProps = {
  params: Promise<{ token: string }>;
};

export default function AskTetoEgenFriendPage({ params }: PageProps) {
  const { token } = use(params);
  return <FriendFlow token={token} />;
}
