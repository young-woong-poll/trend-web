export type AskVoteResponseMyVote =
  (typeof AskVoteResponseMyVote)[keyof typeof AskVoteResponseMyVote];

export const AskVoteResponseMyVote = {
  TETO: 'TETO',
  EGEN: 'EGEN',
} as const;
