import type { MyAnswer } from './myAnswer';
import type { QuestionStat } from './questionStat';

/**
 * 응답 데이터
 */
export interface BundleMyResultResponse {
  bundleSlug?: string;
  bundleTitle?: string;
  category?: string;
  categoryCode?: string;
  categoryMeta?: string;
  totalQuestions?: number;
  myAnswers?: MyAnswer[];
  questionStats?: QuestionStat[];
}
