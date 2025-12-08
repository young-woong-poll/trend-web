import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

interface UseBlockNavigationOptions {
  shouldBlock: boolean;
  onBlock: () => void;
}

/**
 * 뒤로가기를 막고 사용자에게 확인을 요청하는 훅
 *
 * @param shouldBlock - 뒤로가기를 막을지 여부
 * @param onBlock - 뒤로가기 시도 시 호출될 콜백 (Confirm 팝업 등을 표시)
 *
 * @example
 * ```tsx
 * useBlockNavigation({
 *   shouldBlock: true,
 *   onBlock: () => {
 *     showConfirm('페이지를 나가시겠습니까?', {
 *       onConfirm: () => router.back()
 *     });
 *   }
 * });
 * ```
 */
export const useBlockNavigation = ({ shouldBlock, onBlock }: UseBlockNavigationOptions) => {
  const router = useRouter();

  useEffect(() => {
    if (!shouldBlock) {
      return;
    }

    let isConfirming = false;

    const handlePopState = () => {
      // 이미 확인 중인 경우 무시
      if (isConfirming) {
        return;
      }

      isConfirming = true;

      // 사용자에게 확인 요청
      onBlock();

      // 취소를 누르면 다시 히스토리 추가 (뒤로가기 막기)
      window.history.pushState(null, '', window.location.href);
      isConfirming = false;
    };

    // 페이지 진입 시 히스토리 추가 (뒤로가기 감지용)
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [shouldBlock, onBlock, router]);
};

/**
 * 뒤로가기를 막고 확인 후 실행하는 헬퍼 함수를 제공하는 훅
 *
 * @returns confirmAndNavigate - 확인 후 뒤로가기를 실행하는 함수
 *
 * @example
 * ```tsx
 * const { confirmAndNavigate } = useNavigationConfirm();
 *
 * useBlockNavigation({
 *   shouldBlock: true,
 *   onBlock: () => {
 *     showConfirm('나가시겠습니까?', {
 *       onConfirm: confirmAndNavigate
 *     });
 *   }
 * });
 * ```
 */
export const useNavigationConfirm = () => {
  const router = useRouter();

  const confirmAndNavigate = () => {
    // 모든 popstate 리스너 제거를 위한 이벤트 발생
    window.removeEventListener('popstate', () => {});

    // 약간의 지연 후 뒤로가기 실행 (리스너 제거 보장)
    setTimeout(() => {
      router.back();
    }, 0);
  };

  return { confirmAndNavigate };
};
