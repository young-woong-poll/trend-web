import { useQuery } from '@tanstack/react-query';

import { getMyCompareLinks } from '@/generated/api/client/bundle/bundle';
import type { MyCompareLink } from '@/types/my-compare';

export const myCompareLinksQueryKey = (slug: string) => ['myCompareLinks', slug] as const;

export const useMyCompareLinks = (slug: string) =>
  useQuery<MyCompareLink[] | undefined>({
    queryKey: myCompareLinksQueryKey(slug),
    queryFn: () => getMyCompareLinks(slug) as Promise<MyCompareLink[] | undefined>,
    enabled: !!slug,
    staleTime: 30 * 1000,
  });
