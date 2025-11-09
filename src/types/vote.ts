export interface VoteOption {
  id: string;
  text: string;
  count: number;
}

export interface VoteQuestion {
  id: string;
  question: string;
  options: VoteOption[];
}

export interface Survey {
  id: string;
  type: string;
  title: string;
  description: string;
  questions: VoteQuestion[];
  participantCount: number;
}
