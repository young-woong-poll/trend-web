/**
 * Storage API 관련 타입 정의
 */

/**
 * Pre-signed URL 응답
 * @property uploadUrl - S3 업로드 URL
 * @property cdnUrl - CDN 접근 URL
 */
export interface PresignedUrlResponse {
  uploadUrl: string;
  cdnUrl: string;
}
