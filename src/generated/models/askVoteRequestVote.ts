export type AskVoteRequestVote = (typeof AskVoteRequestVote)[keyof typeof AskVoteRequestVote];

export const AskVoteRequestVote = {
  TETO: 'TETO',
  EGEN: 'EGEN',
} as const;
