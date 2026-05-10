import type { ElectionSeriesPointResponse } from './electionSeriesPointResponse';

export interface ElectionItemSeriesResponse {
  electionItemId?: number;
  displayOrder?: number;
  title?: string;
  imageUrl?: string;
  points?: ElectionSeriesPointResponse[];
}
