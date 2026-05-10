export type AskMyLinkResponseSelfAnswer =
  (typeof AskMyLinkResponseSelfAnswer)[keyof typeof AskMyLinkResponseSelfAnswer];

export const AskMyLinkResponseSelfAnswer = {
  TETO: 'TETO',
  EGEN: 'EGEN',
} as const;
