export type MyCompareLinkResponseType =
  (typeof MyCompareLinkResponseType)[keyof typeof MyCompareLinkResponseType];

export const MyCompareLinkResponseType = {
  ONE_TO_ONE: 'ONE_TO_ONE',
  GROUP: 'GROUP',
} as const;
