'use client';

import { useCallback, useState, type FC } from 'react';

import Image from 'next/image';

import styles from '@/components/common/ImageUpload/ImageUpload.module.scss';
import { useGeneratePresignedUrl } from '@/hooks/api/useAdmin';
import { buildFileName } from '@/lib/utils';
import { uploadToS3, type UploadImageOptions } from '@/services/storage';

interface ImageUploadProps {
  value?: string | null; // CDN URL
  onChange: (cdnUrl: string | null) => void; // CDN URL 전달
  uploadOptions?: UploadImageOptions; // 업로드 옵션 (prefix 등)
  maxSize?: number; // bytes (기본: 5MB)
  accept?: string[]; // 허용 확장자 (기본: jpg, jpeg, png, gif, webp)
  disabled?: boolean;
}

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_ACCEPT = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

export const ImageUpload: FC<ImageUploadProps> = ({
  value,
  onChange,
  uploadOptions,
  maxSize = DEFAULT_MAX_SIZE,
  accept = DEFAULT_ACCEPT,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);

  // React Query 훅 사용
  const { mutateAsync: generatePresignedUrl, isPending: isGeneratingUrl } =
    useGeneratePresignedUrl();
  const [isUploadingToS3, setIsUploadingToS3] = useState(false);

  // 전체 업로드 중 상태
  const isUploading = isGeneratingUrl || isUploadingToS3;

  // 파일 검증
  const validateFile = useCallback(
    (file: File): string | null => {
      // 파일 크기 검증
      if (file.size > maxSize) {
        return `파일 크기는 ${(maxSize / 1024 / 1024).toFixed(0)}MB를 초과할 수 없습니다.`;
      }

      // 파일 확장자 검증
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !accept.includes(extension)) {
        return `허용된 파일 형식: ${accept.join(', ')}`;
      }

      return null;
    },
    [maxSize, accept]
  );

  // 파일 처리
  const handleFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);

      // 파일 정보 저장
      setFileInfo({ name: file.name, size: file.size });

      // 미리보기 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // 항상 S3에 업로드
      try {
        // 1. 파일명 생성
        const filename = buildFileName(file, uploadOptions);

        // 2. Pre-signed URL 발급 (React Query 훅 사용)
        const presignedUrlResponse = await generatePresignedUrl(filename);

        // 3. S3에 업로드
        setIsUploadingToS3(true);
        const cdnUrl = await uploadToS3(
          file,
          presignedUrlResponse.uploadUrl,
          presignedUrlResponse.cdnUrl
        );

        // 4. CDN URL을 onChange로 전달
        onChange(cdnUrl);
      } catch (uploadError) {
        const errorMessage =
          uploadError instanceof Error ? uploadError.message : '이미지 업로드에 실패했습니다.';
        setError(errorMessage);
      } finally {
        setIsUploadingToS3(false);
      }
    },
    [validateFile, onChange, uploadOptions, generatePresignedUrl]
  );

  // 드래그 이벤트
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) {
        return;
      }

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        void handleFile(files[0]);
      }
    },
    [disabled, handleFile]
  );

  // 파일 선택
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        void handleFile(files[0]);
      }
    },
    [handleFile]
  );

  // 파일 제거
  const handleRemove = useCallback(() => {
    onChange(null);
    setPreview(null);
    setFileInfo(null);
    setError(null);
  }, [onChange]);

  return (
    <div className={styles.container}>
      <div
        className={`${styles.dropzone} ${isDragging ? styles.dragging : ''} ${disabled || isUploading ? styles.disabled : ''} ${error ? styles.error : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {preview ? (
          <div className={styles.preview}>
            <Image
              src={preview}
              alt="Preview"
              className={styles.previewImage}
              width={400}
              height={300}
              style={{ objectFit: 'contain' }}
              unoptimized
            />
            {isUploading && (
              <div className={styles.uploadingOverlay}>
                <p>업로드 중...</p>
              </div>
            )}
            <button
              type="button"
              onClick={handleRemove}
              className={styles.removeButton}
              disabled={disabled || isUploading}
            >
              ×
            </button>
          </div>
        ) : (
          <label className={styles.uploadLabel}>
            <input
              type="file"
              accept={accept.map((ext) => `.${ext}`).join(',')}
              onChange={handleFileSelect}
              className={styles.fileInput}
              disabled={disabled || isUploading}
            />
            <div className={styles.uploadContent}>
              <svg className={styles.uploadIcon} viewBox="0 0 24 24" fill="none">
                <path
                  d="M7 10L12 15L17 10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 15V3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M20 21H4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className={styles.uploadText}>
                이미지를 드래그하거나 <span className={styles.uploadLink}>클릭</span>하여 업로드
              </p>
              <p className={styles.uploadHint}>
                최대 {(maxSize / 1024 / 1024).toFixed(0)}MB, {accept.join(', ')} 형식
              </p>
            </div>
          </label>
        )}
      </div>

      {error && <p className={styles.errorMessage}>{error}</p>}

      {fileInfo && (
        <p className={styles.fileName}>
          {fileInfo.name} ({(fileInfo.size / 1024).toFixed(1)} KB)
        </p>
      )}
    </div>
  );
};
