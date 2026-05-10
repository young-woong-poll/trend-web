export type CreateCompareLinkRequestType =
  (typeof CreateCompareLinkRequestType)[keyof typeof CreateCompareLinkRequestType];

export const CreateCompareLinkRequestType = {
  ONE_TO_ONE: 'ONE_TO_ONE',
  GROUP: 'GROUP',
} as const;
