import type { BundleElectionOptionStatResponse } from './bundleElectionOptionStatResponse';

export interface QuestionStat {
  electionId?: string;
  title?: string;
  optionStats?: BundleElectionOptionStatResponse[];
}
