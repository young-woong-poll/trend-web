import { serverDisplayApi } from '@/services/api/server/display';

import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://trend.votebox.kr';

  try {
    const data = await serverDisplayApi.getMainDisplay();

    // 동적 트렌드 페이지들
    const trendPages = data.trends.map((trend) => ({
      url: `${baseUrl}/vote/${trend.alias}`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.8,
    }));

    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'hourly',
        priority: 1,
      },
      ...trendPages,
    ];
  } catch (error) {
    console.error('[Sitemap] Failed to generate sitemap:', error);
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'hourly',
        priority: 1,
      },
    ];
  }
}
