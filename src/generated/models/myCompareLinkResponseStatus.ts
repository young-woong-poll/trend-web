export type MyCompareLinkResponseStatus =
  (typeof MyCompareLinkResponseStatus)[keyof typeof MyCompareLinkResponseStatus];

export const MyCompareLinkResponseStatus = {
  WAITING: 'WAITING',
  COMPLETED: 'COMPLETED',
} as const;
