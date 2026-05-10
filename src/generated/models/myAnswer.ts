import type { BundleElectionOptionResponse } from './bundleElectionOptionResponse';

export interface MyAnswer {
  electionId?: string;
  title?: string;
  options?: BundleElectionOptionResponse[];
  selectedElectionItemId?: string;
}
