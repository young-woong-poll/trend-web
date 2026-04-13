'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type FC,
  type ReactNode,
} from 'react';

import { CommentBottomSheet } from '@/components/features/Hotpick/CommentModal';
import { useModal } from '@/contexts/ModalContext';
import { useSingleVote, useLike } from '@/hooks/api';
import type { SingleVoteData } from '@/types/singleVote';

interface CardActions {
  vote: (slug: string, optionId: string, singleVote: SingleVoteData) => void;
  like: (slug: string, liked: boolean, likeCount: number) => void;
  share: (slug: string, type?: 'SINGLE' | 'BUNDLE') => void;
  openComment: (slug: string, electionId: string) => void;
  blockComment: () => void;
}

const CardActionsContext = createContext<CardActions | null>(null);

export const useCardActions = (): CardActions => {
  const ctx = useContext(CardActionsContext);
  if (!ctx) {
    throw new Error('useCardActions must be used within CardActionsProvider');
  }
  return ctx;
};

interface CardActionsProviderProps {
  children: ReactNode;
}

export const CardActionsProvider: FC<CardActionsProviderProps> = ({ children }) => {
  const { handleVote } = useSingleVote();
  const { handleLike } = useLike();
  const { showToast } = useModal();

  const [commentTarget, setCommentTarget] = useState<{
    slug: string;
    electionId: string;
  } | null>(null);

  const vote = useCallback(
    (slug: string, optionId: string, singleVote: SingleVoteData) => {
      void handleVote(slug, optionId, singleVote);
    },
    [handleVote]
  );

  const like = useCallback(
    (slug: string, liked: boolean, likeCount: number) => {
      void handleLike(slug, liked, likeCount);
    },
    [handleLike]
  );

  const share = useCallback(
    (slug: string, type?: 'SINGLE' | 'BUNDLE') => {
      const prefix = type === 'BUNDLE' ? 'bundle' : 'hotpick';
      const url = `${window.location.origin}/${prefix}/${slug}`;
      void navigator.clipboard.writeText(url).then(() => {
        showToast('링크가 복사되었습니다');
      });
    },
    [showToast]
  );

  const openComment = useCallback((slug: string, electionId: string) => {
    setCommentTarget({ slug, electionId });
  }, []);

  const blockComment = useCallback(() => {
    showToast('댓글은 투표 후 확인 가능합니다');
  }, [showToast]);

  const actions = useMemo<CardActions>(
    () => ({ vote, like, share, openComment, blockComment }),
    [vote, like, share, openComment, blockComment]
  );

  return (
    <CardActionsContext.Provider value={actions}>
      {children}
      {commentTarget && (
        <CommentBottomSheet
          isOpen
          onClose={() => setCommentTarget(null)}
          slug={commentTarget.slug}
          electionId={commentTarget.electionId}
        />
      )}
    </CardActionsContext.Provider>
  );
};
