// src/types/bundle.ts
//
// BE generated 타입 기반 FE alias.
// generated 타입의 필드가 모두 optional이므로 FE에서 필요한 타입 보강을 여기서 처리.

import type { BundleElectionResponse } from '@/generated/models/bundleElectionResponse';
import type { BundleMyResultResponse } from '@/generated/models/bundleMyResultResponse';
import type { BundleSummaryResponse } from '@/generated/models/bundleSummaryResponse';
import type { CategoryCode } from '@/types/hotpick';

/**
 * 번들 상세 (인트로 페이지용)
 * BE BundleSummaryResponse 기반, categoryCode만 CategoryCode union으로 좁힘
 */
export type BundleDetail = Omit<BundleSummaryResponse, 'categoryCode'> & {
  categoryCode?: CategoryCode;
};

/**
 * 번들 질문 (풀기 페이지용)
 */
export type BundleElection = BundleElectionResponse;

/**
 * 번들 내 결과 (결과 페이지용)
 * categoryCode를 CategoryCode union으로 좁힘
 */
export type BundleMyResult = Omit<BundleMyResultResponse, 'categoryCode'> & {
  categoryCode?: CategoryCode;
};

export type { SubmitBundleAnswersRequest as BundleAnswerRequest } from '@/generated/models/submitBundleAnswersRequest';
export type { BundleAnswerSubmitResponse } from '@/generated/models/bundleAnswerSubmitResponse';
export type { MyAnswer } from '@/generated/models/myAnswer';
export type { QuestionStat } from '@/generated/models/questionStat';
