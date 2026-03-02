interface KakaoLinkObject {
  webUrl?: string;
  mobileWebUrl?: string;
  androidExecutionParams?: string;
  iosExecutionParams?: string;
}

interface KakaoContentObject {
  title: string;
  imageUrl: string;
  link: KakaoLinkObject;
  description?: string;
  imageWidth?: number;
  imageHeight?: number;
}

interface KakaoSocialObject {
  likeCount?: number;
  commentCount?: number;
  sharedCount?: number;
  viewCount?: number;
  subscriberCount?: number;
}

interface KakaoButtonObject {
  title: string;
  link: KakaoLinkObject;
}

interface KakaoFeedSettings {
  objectType: 'feed';
  content: KakaoContentObject;
  social?: KakaoSocialObject;
  buttonTitle?: string;
  buttons?: KakaoButtonObject[];
  installTalk?: boolean;
  serverCallbackArgs?: Record<string, string> | string;
}

interface KakaoShareAPI {
  sendDefault(settings: KakaoFeedSettings): void;
}

interface KakaoSDK {
  init(appKey: string): void;
  isInitialized(): boolean;
  Share: KakaoShareAPI;
}

interface Window {
  Kakao?: KakaoSDK;
}
