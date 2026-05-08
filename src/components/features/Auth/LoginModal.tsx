'use client';

import { useEffect, useRef, useState } from 'react';

import { createPortal } from 'react-dom';

import KakaoIcon from '@/assets/icon/KakaoIcon';
import styles from '@/components/features/Auth/LoginModal.module.scss';
import type { LoginTrigger } from '@/contexts/AuthContext';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { trackAuthKakaoClick, trackAuthModalOpen, type ReturnUrlType } from '@/lib/analytics';

function deriveReturnUrlType(pathname: string): ReturnUrlType {
  if (pathname === '/') {
    return 'main';
  }
  if (pathname.startsWith('/hotpick/')) {
    return 'single';
  }
  if (pathname.startsWith('/bundle/')) {
    return 'bundle';
  }
  if (pathname.startsWith('/compare/')) {
    return 'compare';
  }
  if (pathname === '/my' || pathname.startsWith('/my/')) {
    return 'my';
  }
  return 'other';
}

const TRIGGER_MESSAGES: Record<LoginTrigger, string> = {
  header: '로그인하고 더 많은 기능을 이용해보세요',
  bundle: '번들을 풀려면 로그인이 필요해요',
  my: '로그인하고 내 활동을 확인해보세요',
  compare: '', // compare는 별도 UI 사용
  ask: '정확한 테토/에겐 판별을 위해 \n 로그인이 필요해요 😭',
  default: '로그인하고 더 많은 기능을 이용해보세요',
};

const DEFAULT_BENEFITS = [
  '내 활동이 저장돼요',
  '내 투표 기록을 한눈에 볼 수 있어요',
  '친구와 가치관 비교 가능해요!',
];

// 테토/에겐(ask) 전용 — 친구 평가에서 닉네임 식별·중복 차단으로 결과 신뢰도가 올라간다는 점을 강조.
const ASK_BENEFITS = [
  '친구 입장에서 누가 답했는지 알 수 있어요',
  '한 사람이 한 번만 답할 수 있어요',
  '내 테스트도 만들 수 있어요!',
];

const BENEFITS_BY_TRIGGER: Partial<Record<LoginTrigger, string[]>> = {
  ask: ASK_BENEFITS,
};

const CTA_BY_TRIGGER: Partial<Record<LoginTrigger, string>> = {
  ask: '카카오로 3초만에 로그인해주시면 감사..',
};

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
    const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;
    // 쿼리의 returnUrl이 있으면 우선 사용 (예: /?login=true&returnUrl=/my)
    const urlParams = new URLSearchParams(window.location.search);
    const returnUrl =
      urlParams.get('returnUrl') || `${window.location.pathname}${window.location.search}`;
    const returnUrlType = deriveReturnUrlType(window.location.pathname);
    trackAuthKakaoClick(returnUrlType);
    const state = encodeURIComponent(new URLSearchParams({ returnUrl }).toString());
    window.location.href = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${state}`;
  };

  if (trigger === 'compare') {
    return (
      <div className={styles.container}>
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="닫기">
          ✕
        </button>

        <div className={styles.bowingEmoji}>🙇‍♂️🙏</div>

        <p className={styles.compareTitle}>귀한 시간 내주셔서 감사합니다</p>
        <p className={styles.compareDesc}>
          비교 기능은 서로의 답변을 매칭하기 위해
          <br />
          로그인이 꼭 필요합니다 🥺🥺
        </p>
        <p className={styles.compareDesc}>
          번거로우시겠지만 로그인해주시면
          <br />더 재미있는 기능으로 보답하겠습니다!
        </p>

        <button type="button" className={styles.kakaoButton} onClick={handleKakaoLogin}>
          <KakaoIcon />
          카카오로 3초만에 시작하기
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button type="button" className={styles.closeButton} onClick={onClose} aria-label="닫기">
        ✕
      </button>

      <p className={styles.triggerMessage}>{TRIGGER_MESSAGES[trigger]}</p>

      <ul className={styles.benefitList}>
        {(BENEFITS_BY_TRIGGER[trigger] ?? DEFAULT_BENEFITS).map((text) => (
          <li key={text} className={styles.benefitItem}>
            {text}
          </li>
        ))}
      </ul>

      <button type="button" className={styles.kakaoButton} onClick={handleKakaoLogin}>
        <KakaoIcon />
        {CTA_BY_TRIGGER[trigger] ?? '카카오로 시작하기'}
      </button>

      {/* <p className={styles.subText}>비로그인으로 투표는 가능해요</p> */}
    </div>
  );
};

const LoginModal = ({ isOpen, onClose, trigger }: LoginModalProps) => {
  const isMobile = useIsMobile();
  useBodyScrollLock(isOpen);
  useEscapeKey(isOpen, onClose);

  // 한 번의 open 라이프사이클에서 1회만 트래킹 (닫혔다가 다시 열리면 재발화)
  const lastTrackedOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !lastTrackedOpenRef.current) {
      lastTrackedOpenRef.current = true;
      trackAuthModalOpen(trigger);
    } else if (!isOpen) {
      lastTrackedOpenRef.current = false;
    }
  }, [isOpen, trigger]);

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
