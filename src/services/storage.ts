import type { UploadImageOptions } from '@/lib/utils';

// Re-export UploadImageOptions for convenience
export type { UploadImageOptions };

/**
 * Upload image file to S3 using pre-signed URL
 * @param file - File to upload
 * @param uploadUrl - Pre-signed URL from backend
 * @param cdnUrl - CDN URL from backend
 * @returns CDN URL of the uploaded image
 */
export const uploadToS3 = async (
  file: File,
  uploadUrl: string,
  cdnUrl: string
): Promise<string> => {
  // Upload file to S3 using pre-signed URL
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error('이미지 업로드 요청에 실패했습니다.');
  }

  // Return CDN URL (or extract from uploadUrl if cdnUrl is empty)
  if (cdnUrl) {
    return cdnUrl;
  }

  // Fallback: extract path from uploadUrl
  const url = new URL(uploadUrl);
  url.search = '';
  return url.toString();
};
