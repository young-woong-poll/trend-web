'use client';

import { useEffect, useState } from 'react';

import { createPortal } from 'react-dom';

import KakaoIcon from '@/assets/icon/KakaoIcon';
import styles from '@/components/features/Auth/LoginModal.module.scss';
import type { LoginTrigger } from '@/contexts/AuthContext';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useEscapeKey } from '@/hooks/useEscapeKey';

const TRIGGER_MESSAGES: Record<LoginTrigger, string> = {
  comment: '댓글을 남기려면 로그인이 필요해요',
  like: '좋아요는 로그인 후 이용할 수 있어요',
  default: '로그인하고 더 많은 기능을 이용해보세요',
};

const BENEFITS = ['댓글로 의견을 나눠보세요', '마음에 드는 핫픽에 좋아요', '내 투표 기록을 한눈에'];

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: LoginTrigger;
}

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
};

const LoginModalContent = ({
  trigger,
  onClose,
}: {
  trigger: LoginTrigger;
  onClose: () => void;
}) => {
  const handleKakaoLogin = () => {
    sessionStorage.setItem(
      'auth_intent',
      JSON.stringify({ trigger, returnUrl: window.location.href })
    );

    const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;
    window.location.href = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;
  };

  return (
    <div className={styles.container}>
      <button type="button" className={styles.closeButton} onClick={onClose} aria-label="닫기">
        ✕
      </button>

      <p className={styles.triggerMessage}>{TRIGGER_MESSAGES[trigger]}</p>

      <ul className={styles.benefitList}>
        {BENEFITS.map((text) => (
          <li key={text} className={styles.benefitItem}>
            {text}
          </li>
        ))}
      </ul>

      <button type="button" className={styles.kakaoButton} onClick={handleKakaoLogin}>
        <KakaoIcon />
        카카오로 시작하기
      </button>

      <p className={styles.subText}>비로그인으로 투표는 가능해요</p>
    </div>
  );
};

const LoginModal = ({ isOpen, onClose, trigger }: LoginModalProps) => {
  const isMobile = useIsMobile();
  useBodyScrollLock(isOpen);
  useEscapeKey(isOpen, onClose);

  if (!isOpen) {
    return null;
  }

  const portal = document.getElementById('portal-root');
  if (!portal) {
    return null;
  }

  return createPortal(
    <div className={styles.dimmed} onClick={onClose} role="presentation">
      <div
        className={isMobile ? styles.bottomSheet : styles.centerModal}
        onClick={(e) => e.stopPropagation()}
        role="presentation"
      >
        <LoginModalContent trigger={trigger} onClose={onClose} />
      </div>
    </div>,
    portal
  );
};

export default LoginModal;
