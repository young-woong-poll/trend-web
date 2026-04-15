import { useMutation } from '@tanstack/react-query';

import { createSuggestion } from '@/generated/api/client/suggestion/suggestion';
import type { CreateSuggestionRequest } from '@/generated/models';

/**
 * 유저용: 핫픽 제안 제출 Hook
 */
export const useCreateSuggestion = () =>
  useMutation({
    mutationFn: (data: CreateSuggestionRequest) => createSuggestion(data),
  });
