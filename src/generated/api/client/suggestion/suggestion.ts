import type { BaseResponseVoid, CreateSuggestionRequest } from '../../../models';

import { customInstance } from '../../../../lib/axios-mutator';
import type { BodyType } from '../../../../lib/axios-mutator';

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

/**
 * @summary 핫픽 제안 제출
 */
export const createSuggestion = (
  createSuggestionRequest: BodyType<CreateSuggestionRequest>,
  options?: SecondParameter<typeof customInstance<BaseResponseVoid>>
) => {
  return customInstance<BaseResponseVoid>(
    {
      url: `/api/v1/suggestions`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: createSuggestionRequest,
    },
    options
  );
};
export type CreateSuggestionResult = NonNullable<Awaited<ReturnType<typeof createSuggestion>>>;
