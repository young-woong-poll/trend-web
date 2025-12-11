import { StructuredData } from '@/components/common/StructuredData/StructuredData';
import { MainContent } from '@/components/features/Main/MainContent';
import { generateMainStructuredData } from '@/lib/seo/structuredData';
import { serverDisplayApi } from '@/services/api/server/display';

export const revalidate = 60;

export default async function Home() {
  try {
    const data = await serverDisplayApi.getMainDisplay();
    const structuredData = generateMainStructuredData(data);

    return (
      <>
        <StructuredData data={structuredData} />
        <MainContent initialData={data} />
      </>
    );
  } catch (error) {
    console.error('[Home] Failed to fetch main display:', error);
    // 빌드 시점 에러: 빈 데이터로 fallback
    return <MainContent initialData={{ trends: [] }} />;
  }
}
