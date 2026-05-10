import type { GetElectionSeriesInterval } from './getElectionSeriesInterval';

export type GetElectionSeriesParams = {
  /**
   * 집계 간격 (기본: 1h)
   */
  interval?: GetElectionSeriesInterval;
};
