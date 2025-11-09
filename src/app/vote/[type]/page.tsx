import { VoteView } from '@/components/features/Vote/VoteView';

interface VotePageProps {
  params: {
    type: string;
  };
}

export default function VotePage({ params }: VotePageProps) {
  return <VoteView type={params.type} />;
}
