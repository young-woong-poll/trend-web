import { VoteView } from '@/components/features/Vote/VoteView';

interface VotePageProps {
  params: Promise<{
    type: string;
  }>;
}

export default async function VotePage({ params }: VotePageProps) {
  const { type } = await params;
  return <VoteView type={type} />;
}
