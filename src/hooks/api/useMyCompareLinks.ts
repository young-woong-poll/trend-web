import { useQuery } from '@tanstack/react-query';

import { customInstance } from '@/lib/axios-mutator';
import type { MyCompareLink } from '@/types/my-compare';

export const useMyCompareLinks = (slug: string) =>
  useQuery({
    queryKey: ['myCompareLinks', slug],
    queryFn: () =>
      customInstance<MyCompareLink[]>({
        url: `/api/v1/bundles/${slug}/my-compare-links`,
        method: 'GET',
      }),
    enabled: !!slug,
    staleTime: 30 * 1000,
  });
