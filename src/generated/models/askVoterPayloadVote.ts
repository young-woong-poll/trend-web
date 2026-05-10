export type AskVoterPayloadVote = (typeof AskVoterPayloadVote)[keyof typeof AskVoterPayloadVote];

export const AskVoterPayloadVote = {
  TETO: 'TETO',
  EGEN: 'EGEN',
} as const;
