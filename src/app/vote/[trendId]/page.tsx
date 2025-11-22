import { VoteView } from '@/components/features/Vote/VoteView';

interface VotePageProps {
  params: Promise<{
    trendId: string;
  }>;
}

export default async function VotePage({ params }: VotePageProps) {
  const { trendId } = await params;
  return <VoteView trendId={trendId} />;
}
