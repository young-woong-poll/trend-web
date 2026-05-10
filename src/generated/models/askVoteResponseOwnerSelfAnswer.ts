export type AskVoteResponseOwnerSelfAnswer =
  (typeof AskVoteResponseOwnerSelfAnswer)[keyof typeof AskVoteResponseOwnerSelfAnswer];

export const AskVoteResponseOwnerSelfAnswer = {
  TETO: 'TETO',
  EGEN: 'EGEN',
} as const;
