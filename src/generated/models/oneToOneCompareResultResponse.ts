import type { Participant } from './participant';
import type { QuestionStat } from './questionStat';

/**
 * 응답 데이터
 */
export interface OneToOneCompareResultResponse {
  bundleSlug?: string;
  bundleTitle?: string;
  category?: string;
  categoryCode?: string;
  categoryMeta?: string;
  totalQuestions?: number;
  me?: Participant;
  target?: Participant;
  questionStats?: QuestionStat[];
  matchCount?: number;
  matchRate?: number;
}
