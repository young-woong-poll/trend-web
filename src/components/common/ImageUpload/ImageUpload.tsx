'use client';

import { useCallback, useState, type FC } from 'react';

import Image from 'next/image';

import styles from '@/components/common/ImageUpload/ImageUpload.module.scss';

interface ImageUploadProps {
  value?: File | null;
  onChange: (file: File | null) => void;
  maxSize?: number; // bytes (기본: 5MB)
  accept?: string[]; // 허용 확장자 (기본: jpg, jpeg, png, gif, webp)
  disabled?: boolean;
}

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_ACCEPT = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

export const ImageUpload: FC<ImageUploadProps> = ({
  value,
  onChange,
  maxSize = DEFAULT_MAX_SIZE,
  accept = DEFAULT_ACCEPT,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

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
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      onChange(file);

      // 미리보기 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    [validateFile, onChange]
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
        handleFile(files[0]);
      }
    },
    [disabled, handleFile]
  );

  // 파일 선택
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  // 파일 제거
  const handleRemove = useCallback(() => {
    onChange(null);
    setPreview(null);
    setError(null);
  }, [onChange]);

  return (
    <div className={styles.container}>
      <div
        className={`${styles.dropzone} ${isDragging ? styles.dragging : ''} ${disabled ? styles.disabled : ''} ${error ? styles.error : ''}`}
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
            <button
              type="button"
              onClick={handleRemove}
              className={styles.removeButton}
              disabled={disabled}
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
              disabled={disabled}
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

      {value && (
        <p className={styles.fileName}>
          {value.name} ({(value.size / 1024).toFixed(1)} KB)
        </p>
      )}
    </div>
  );
};
