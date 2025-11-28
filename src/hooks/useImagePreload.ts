import { useState, useEffect } from 'react';

/**
 * 이미지를 프리로드하고 로딩 상태를 관리하는 커스텀 훅
 * @param imageUrl - 프리로드할 이미지 URL
 * @returns 이미지 로딩 완료 여부
 */
export const useImagePreload = (imageUrl: string): boolean => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  useEffect(() => {
    setIsImageLoaded(false); // imageUrl 변경 시 초기화

    const img = new Image();
    img.src = imageUrl;

    img.onload = () => {
      setIsImageLoaded(true);
    };

    img.onerror = () => {
      setIsImageLoaded(true); // 에러 발생해도 UI는 표시
    };

    // cleanup 함수: 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl]);

  return isImageLoaded;
};
