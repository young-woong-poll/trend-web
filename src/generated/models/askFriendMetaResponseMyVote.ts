export type AskFriendMetaResponseMyVote =
  (typeof AskFriendMetaResponseMyVote)[keyof typeof AskFriendMetaResponseMyVote];

export const AskFriendMetaResponseMyVote = {
  TETO: 'TETO',
  EGEN: 'EGEN',
} as const;
