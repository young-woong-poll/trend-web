'use client';

import { useEffect, useMemo, useRef, type CSSProperties, type FC } from 'react';

import DiceIcon from '@/assets/icon/DiceIcon';
import styles from '@/components/features/Hotpick/CommentModal/CommentForm.module.scss';
import { getProfileColor } from '@/constants/profileColors';
import { useCommentForm, COMMENT_FORM_LIMITS } from '@/hooks/useCommentForm';

interface CommentFormProps {
  slug: string;
  electionId: string;
  onSuccess: () => void;
  /**
   * 답글 모드 — 지정 시 폼이 답글 작성 상태로 전환.
   * 채팅앱(슬랙/카카오톡 답글) 패턴 — 폼 1개로 댓글/답글 모두 처리해 사용자 혼란 방지.
   * content는 칩 본문 미리보기, profileColor는 칩 배경/border tint(없으면 기본 핫핑크).
   */
  replyTo?: {
    commentId: string;
    nickname: string;
    content: string;
    profileColor?: string | null;
  } | null;
  onCancelReply?: () => void;
}

const REPLY_CHIP_PREVIEW_MAX = 30;

const previewReplyContent = (text: string): string => {
  // 줄바꿈/연속 공백을 공백 1개로 정규화한 뒤 길이 컷.
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= REPLY_CHIP_PREVIEW_MAX) {
    return normalized;
  }
  return `${normalized.slice(0, REPLY_CHIP_PREVIEW_MAX)}…`;
};

// "#7C3AED" → "rgba(124, 58, 237, alpha)" — 칩 배경 tint용.
const hexToRgba = (hex: string, alpha: number): string | null => {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) {
    return null;
  }
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) {
    return null;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// 답글 칩 색 — profileColor 있으면 해당 start, 없으면 기본 핫핑크.
const buildReplyChipStyle = (profileColor?: string | null): CSSProperties => {
  const FALLBACK_HEX = '#FF00FF';
  const hex = profileColor ? getProfileColor(profileColor).start : FALLBACK_HEX;
  const bg = hexToRgba(hex, 0.18) ?? 'rgba(255, 0, 255, 0.06)';
  return {
    backgroundColor: bg,
    borderLeftColor: hex,
  };
};

export const CommentForm: FC<CommentFormProps> = ({
  slug,
  electionId,
  onSuccess,
  replyTo,
  onCancelReply,
}) => {
  const isReplyMode = Boolean(replyTo);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const {
    isLoggedIn,
    nickname,
    password,
    content,
    errors,
    isPending,
    handleGenerateNickname,
    handleNicknameChange,
    handleNicknameBlur,
    handlePasswordChange,
    handleContentChange,
    handleSubmit,
  } = useCommentForm({
    slug,
    electionId,
    onSuccess,
    replyToCommentId: replyTo?.commentId ?? null,
  });

  // 답글 대상이 바뀌면(= 답글 모드 진입 또는 다른 댓글로 전환) textarea 즉시 focus.
  useEffect(() => {
    if (replyTo?.commentId) {
      textareaRef.current?.focus();
    }
  }, [replyTo?.commentId]);

  // 답글 칩 색상 — replyTo.profileColor 변할 때만 재계산.
  const chipStyle = useMemo(
    () => buildReplyChipStyle(replyTo?.profileColor),
    [replyTo?.profileColor]
  );

  return (
    <div className={styles.commentForm}>
      {/* 답글 모드 컨텍스트 칩 — 답글 대상의 profileColor로 배경/border tint */}
      {isReplyMode && replyTo && (
        <div className={styles.replyChip} style={chipStyle}>
          <span
            className={styles.replyChipMark}
            style={{ color: chipStyle.borderLeftColor }}
            aria-hidden
          >
            ↳
          </span>
          <span className={styles.replyChipText}>
            <strong>{replyTo.nickname}</strong>
            <span className={styles.replyChipPreview}>{previewReplyContent(replyTo.content)}</span>
          </span>
          {onCancelReply && (
            <button
              type="button"
              className={styles.replyChipClose}
              onClick={onCancelReply}
              disabled={isPending}
              aria-label="답글 취소"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* 댓글/답글 입력 */}
      <div className={styles.textareaWrapper}>
        <textarea
          ref={textareaRef}
          className={`${styles.textarea} ${errors.content ? styles.error : ''}`}
          placeholder={isReplyMode ? '답글을 입력하세요...' : '댓글을 입력하세요...'}
          value={content}
          onChange={handleContentChange}
          maxLength={COMMENT_FORM_LIMITS.COMMENT_MAX_LENGTH}
          rows={2}
          disabled={isPending}
        />
        <span className={styles.charCount}>
          {content.length}/{COMMENT_FORM_LIMITS.COMMENT_MAX_LENGTH}
        </span>
      </div>

      {/* 닉네임 + 비밀번호 + 게시 (비로그인) / 게시 버튼만 (로그인) */}
      <div className={styles.bottomRow}>
        {!isLoggedIn && (
          <>
            <div className={`${styles.nicknameWrapper} ${errors.nickname ? styles.error : ''}`}>
              <input
                type="text"
                className={`${styles.input} ${styles.nicknameInput}`}
                placeholder="닉네임"
                value={nickname}
                onChange={handleNicknameChange}
                onBlur={handleNicknameBlur}
                maxLength={COMMENT_FORM_LIMITS.NICKNAME_MAX_LENGTH}
                disabled={isPending}
              />
              <button
                type="button"
                className={styles.generateButton}
                onClick={handleGenerateNickname}
                disabled={isPending}
                aria-label="닉네임 자동생성"
              >
                <DiceIcon className={styles.generateIcon} />
                <span className={styles.generateLabel}>랜덤</span>
              </button>
            </div>
            <input
              type="password"
              className={`${styles.input} ${styles.passwordInput} ${errors.password ? styles.error : ''}`}
              placeholder="비밀번호"
              value={password}
              onChange={handlePasswordChange}
              maxLength={COMMENT_FORM_LIMITS.PASSWORD_MAX_LENGTH}
              disabled={isPending}
              autoComplete="new-password"
              data-1p-ignore
              data-lpignore="true"
            />
          </>
        )}
        <button
          type="button"
          className={`${styles.submitButton} ${isLoggedIn ? styles.submitButtonFull : ''}`}
          onClick={handleSubmit}
          disabled={isPending}
          aria-label={isReplyMode ? '답글 게시' : '댓글 게시'}
        >
          {isReplyMode ? '답글 달기' : '댓글 게시'}
        </button>
      </div>
    </div>
  );
};
