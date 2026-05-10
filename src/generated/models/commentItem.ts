export interface CommentItem {
  id?: string;
  nickname?: string;
  profileColor?: string;
  content?: string;
  likeCount?: number;
  liked?: boolean;
  mine?: boolean;
  isUser?: boolean;
  edited?: boolean;
  createdAt?: string;
  updatedAt?: string;
  electionItemId?: number;
  replyCount?: number;
}
