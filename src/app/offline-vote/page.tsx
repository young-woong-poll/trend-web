import { OfflineVotePage } from '@/components/features/OfflineVote/OfflineVotePage';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '오프라인 투표',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <OfflineVotePage />;
}
