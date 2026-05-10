export type AskMyLinkResponseSelfPrediction =
  (typeof AskMyLinkResponseSelfPrediction)[keyof typeof AskMyLinkResponseSelfPrediction];

export const AskMyLinkResponseSelfPrediction = {
  TETO: 'TETO',
  EGEN: 'EGEN',
} as const;
