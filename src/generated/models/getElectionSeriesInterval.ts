export type GetElectionSeriesInterval =
  (typeof GetElectionSeriesInterval)[keyof typeof GetElectionSeriesInterval];

export const GetElectionSeriesInterval = {
  '5m': '5m',
  '1h': '1h',
  '1d': '1d',
} as const;
