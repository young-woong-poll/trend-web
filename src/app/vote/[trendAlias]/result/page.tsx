import { ResultView } from '@/components/features/Result/ResultView';

interface ResultPageProps {
  params: Promise<{
    type: string;
  }>;
}

export default async function ResultPage({ params }: ResultPageProps) {
  const { type } = await params;
  return <ResultView type={type} />;
}
