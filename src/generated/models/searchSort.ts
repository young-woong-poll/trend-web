export type SearchSort = (typeof SearchSort)[keyof typeof SearchSort];

export const SearchSort = {
  relevance: 'relevance',
  latest: 'latest',
  popular: 'popular',
} as const;
