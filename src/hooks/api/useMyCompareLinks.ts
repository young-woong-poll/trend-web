import { useQuery, type QueryClient } from '@tanstack/react-query';

import { getMyCompareLinks } from '@/generated/api/client/bundle/bundle';
import type { MyCompareLink } from '@/types/my-compare';

const MY_COMPARE_LINKS_STALE_TIME = 30 * 1000;

export const myCompareLinksQueryKey = (slug: string) => ['myCompareLinks', slug] as const;

const fetchMyCompareLinks = (slug: string) =>
  getMyCompareLinks(slug) as Promise<MyCompareLink[] | undefined>;

export const useMyCompareLinks = (slug: string) =>
  useQuery<MyCompareLink[] | undefined>({
    queryKey: myCompareLinksQueryKey(slug),
    queryFn: () => fetchMyCompareLinks(slug),
    enabled: !!slug,
    staleTime: MY_COMPARE_LINKS_STALE_TIME,
  });

export const prefetchMyCompareLinks = (queryClient: QueryClient, slug: string) =>
  queryClient.prefetchQuery({
    queryKey: myCompareLinksQueryKey(slug),
    queryFn: () => fetchMyCompareLinks(slug),
    staleTime: MY_COMPARE_LINKS_STALE_TIME,
  });
