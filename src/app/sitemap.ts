import { getMainDisplay } from '@/generated/api/server/display/display';

import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hotpick.votebox.kr';

  try {
    const response = await getMainDisplay({ size: 100 }, { next: { revalidate: 60 } });
    const data = response.status === 200 ? response.data.data : null;

    if (!data) {
      throw new Error('Failed to fetch main display data');
    }

    // 동적 트렌드 페이지들
    const trendPages = (data.trends ?? []).map((trend) => ({
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
