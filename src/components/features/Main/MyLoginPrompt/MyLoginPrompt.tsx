'use client';

import type { FC } from 'react';

import styles from '@/components/features/Main/MyLoginPrompt/MyLoginPrompt.module.scss';
import type { MySubTabType } from '@/constants/contentTab';
import { useAuth } from '@/contexts/AuthContext';

const PROMPTS: Record<Exclude<MySubTabType, 'vote'>, string> = {
  compare: '로그인하면 케미 결과를 볼 수 있어요',
  comments: '로그인하면 내 댓글을 볼 수 있어요',
  likes: '로그인하면 좋아요한 핫픽을 볼 수 있어요',
};

interface MyLoginPromptProps {
  tab: Exclude<MySubTabType, 'vote'>;
}

export const MyLoginPrompt: FC<MyLoginPromptProps> = ({ tab }) => {
  const { requireLogin } = useAuth();

  return (
    <div className={styles.container}>
      <p className={styles.message}>{PROMPTS[tab]}</p>
      <button type="button" className={styles.loginButton} onClick={() => requireLogin('default')}>
        로그인하기
      </button>
    </div>
  );
};
