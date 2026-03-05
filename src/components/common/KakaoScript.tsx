'use client';

import Script from 'next/script';

const KAKAO_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;

export function KakaoScript() {
  if (!KAKAO_APP_KEY) {
    return null;
  }

  return (
    <Script
      src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
      integrity="sha384-DKYJZ8NLiK8MN4/C5P2dtSmLQ4KwPaoqAfyA/DfmEc1VDxu4yyC7wy6K1Ber76k"
      crossOrigin="anonymous"
      strategy="afterInteractive"
      onLoad={() => {
        if (KAKAO_APP_KEY && window.Kakao && !window.Kakao.isInitialized()) {
          window.Kakao.init(KAKAO_APP_KEY);
        }
      }}
    />
  );
}
