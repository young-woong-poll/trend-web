export type CompareLinkInfoResponseType =
  (typeof CompareLinkInfoResponseType)[keyof typeof CompareLinkInfoResponseType];

export const CompareLinkInfoResponseType = {
  ONE_TO_ONE: 'ONE_TO_ONE',
  GROUP: 'GROUP',
} as const;
