import { getMain } from '@/generated/api/server/hotpick/hotpick';

import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hotpick.votebox.kr';

  try {
    const response = await getMain({ size: 100 }, { next: { revalidate: 60 } });
    const data = response.status === 200 ? response.data.data : null;

    if (!data) {
      throw new Error('Failed to fetch main hotpick data');
    }

    // 동적 핫픽 페이지들
    const hotpickPages = (data.hotpicks ?? []).map((hotpick) => ({
      url: `${baseUrl}/hotpick/${hotpick.slug}`,
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
      ...hotpickPages,
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
