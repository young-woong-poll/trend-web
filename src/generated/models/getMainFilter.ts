export type GetMainFilter = (typeof GetMainFilter)[keyof typeof GetMainFilter];

export const GetMainFilter = {
  new: 'new',
  voted: 'voted',
  hot_1d: 'hot_1d',
  hot_1w: 'hot_1w',
  hot_1m: 'hot_1m',
  hot_1y: 'hot_1y',
} as const;
