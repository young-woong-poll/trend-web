'use client';

import { type FC } from 'react';

import { useRouter } from 'next/navigation';

import BackIcon from '@/assets/icon/BackIcon';

interface SmartBackButtonProps {
  className?: string;
  /** 내부 referrer가 없을 때 이동할 경로 (기본 '/') */
  fallbackHref?: string;
  ariaLabel?: string;
  size?: number;
}

/**
 * 뒤로가기 버튼 — referrer 기반 분기.
 * - 같은 origin에서 왔으면 router.back()
 * - 외부/직접 진입이면 fallbackHref로 replace (기본: 홈)
 *
 * 카톡·인스타·구글 등에서 직접 진입한 사용자도 홈으로 보내
 * 앱 내 탐색 동선에 붙잡는다.
 */
export const SmartBackButton: FC<SmartBackButtonProps> = ({
  className,
  fallbackHref = '/',
  ariaLabel = '뒤로 가기',
  size = 20,
}) => {
  const router = useRouter();

  const handleClick = () => {
    let cameFromSameOrigin = false;
    try {
      const referrer = document.referrer;
      if (referrer) {
        cameFromSameOrigin = new URL(referrer).origin === window.location.origin;
      }
    } catch {
      // referrer 파싱 실패 시 fallback 경로로 이동
    }

    if (cameFromSameOrigin) {
      router.back();
    } else {
      router.replace(fallbackHref);
    }
  };

  return (
    <button type="button" className={className} onClick={handleClick} aria-label={ariaLabel}>
      <BackIcon width={size} height={size} />
    </button>
  );
};

export default SmartBackButton;
