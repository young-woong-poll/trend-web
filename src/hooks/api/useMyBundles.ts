import { useQuery } from '@tanstack/react-query';

import { customInstance } from '@/lib/axios-mutator';
import type { BundleDetail } from '@/types/bundle';

export const useMyBundles = (enabled: boolean) =>
  useQuery({
    queryKey: ['bundles', 'completed'],
    queryFn: () =>
      customInstance<BundleDetail[]>({
        url: '/api/v1/bundles',
        method: 'GET',
        params: { filter: 'completed' },
      }),
    enabled,
    staleTime: 60 * 1000,
  });
