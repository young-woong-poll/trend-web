import { useQuery } from '@tanstack/react-query';

import { list } from '@/generated/api/client/bundle/bundle';
import type { BundleDetail } from '@/types/bundle';

export const useMyBundles = (enabled: boolean) =>
  useQuery<BundleDetail[] | undefined>({
    queryKey: ['bundles', 'completed'],
    queryFn: () => list({ filter: 'completed' }) as Promise<BundleDetail[] | undefined>,
    enabled,
    staleTime: 60 * 1000,
  });
