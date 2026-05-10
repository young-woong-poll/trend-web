export type NotificationItemType = (typeof NotificationItemType)[keyof typeof NotificationItemType];

export const NotificationItemType = {
  COMMENT_LIKE: 'COMMENT_LIKE',
  COMMENT_REPLY: 'COMMENT_REPLY',
  COMPARE_LINK_JOIN: 'COMPARE_LINK_JOIN',
  ASK_TETO_EGEN_VOTE: 'ASK_TETO_EGEN_VOTE',
} as const;
