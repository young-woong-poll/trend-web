export type GetMainSort = (typeof GetMainSort)[keyof typeof GetMainSort];

export const GetMainSort = {
  recommended: 'recommended',
  latest: 'latest',
  popular: 'popular',
  hot: 'hot',
} as const;
