import { useQuery } from '@tanstack/react-query';

import { getElectionSeries } from '@/generated/api/client/hotpick/hotpick';
import type { GetElectionSeriesParams } from '@/generated/models';

const electionSeriesKeys = {
  all: ['electionSeries'] as const,
  detail: (slug: string, params?: GetElectionSeriesParams) =>
    [...electionSeriesKeys.all, slug, params] as const,
};

export const useElectionSeries = (slug: string, params?: GetElectionSeriesParams) =>
  useQuery({
    queryKey: electionSeriesKeys.detail(slug, params),
    queryFn: () => getElectionSeries(slug, params),
    enabled: !!slug,
    staleTime: 60 * 1000,
  });
