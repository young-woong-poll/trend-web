import { ResultView } from '@/components/features/Result/ResultView';

interface ResultPageProps {
  params: {
    type: string;
  };
}

export default function ResultPage({ params }: ResultPageProps) {
  return <ResultView type={params.type} />;
}
