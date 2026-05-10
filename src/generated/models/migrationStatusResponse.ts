/**
 * 응답 데이터
 */
export interface MigrationStatusResponse {
  hasMigratableData?: boolean;
  voteCount?: number;
  likeCount?: number;
  commentCount?: number;
}
