import type { CategoryCode } from '@/types/hotpick';

/**
 * 비교 링크 타입
 */
export type CompareLinkType = 'ONE_TO_ONE' | 'GROUP';

/**
 * 비교 링크 정보 (랜딩 페이지용)
 */
export interface CompareLink {
  token: string;
  type: CompareLinkType;
  bundleSlug: string;
  bundleTitle: string;
  /** 번들 카테고리 코드 (FE 테마 색상 적용용) */
  categoryCode?: CategoryCode;
  /** 링크 생성자 닉네임 */
  creatorNickname: string;
  /** 링크 생성자 대중성 캐릭터 이미지 URL */
  creatorImageUrl: string | null;
  /** 참여자 닉네임 (1:1 전용, 아직 없으면 null) */
  participantNickname: string | null;
  /** 1:1 링크에 참여자가 존재하는지 (GROUP은 memberCount 사용) */
  hasParticipant: boolean;
  /** 현재 로그인 유저가 생성자인지 */
  isCreator: boolean;
  /** 현재 로그인 유저가 참여자인지 */
  isParticipant: boolean;
  /** 현재 로그인 유저의 번들 완료 여부 */
  myBundleCompleted: boolean;
  /** 번들 질문 수 */
  questionCount: number;
  /** 번들 참여자 수 */
  participantCount: number;
  /** 그룹 이름 (GROUP 타입 전용) */
  groupName: string | null;
  /** 현재 참여 멤버 수 (GROUP 타입 전용) */
  memberCount: number;
  /** 그룹 마감 여부 */
  isClosed: boolean;
}

/**
 * 비교 링크 생성 요청
 */
export interface CreateCompareLinkRequest {
  type: CompareLinkType;
  /** 그룹 비교 시 그룹 이름 (1:1은 불필요) */
  groupName?: string;
}

/**
 * 비교 링크 생성 응답
 */
export interface CreateCompareLinkResponse {
  token: string;
}

/**
 * 1:1 비교 결과 (서버 응답)
 * 서버는 숫자만 리턴. 등급/캐릭터/문구/스토리텔링은 FE에서 매핑.
 */
export interface CompareResult {
  bundleSlug: string;
  bundleTitle: string;
  /** 번들 카테고리 코드 (FE 테마 색상 적용용) */
  categoryCode?: CategoryCode;
  totalQuestions: number;

  me: {
    nickname: string;
    answers: Array<{ electionId: string; selected: string }>;
  };

  target: {
    nickname: string;
    /** 서비스 탈퇴 유저 여부 */
    isWithdrawn?: boolean;
    answers: Array<{ electionId: string; selected: string }>;
  };

  /** 각 질문별 현재 투표 수 (실시간 변동) */
  questionStats: Array<{
    electionId: string;
    title: string;
    optionA: string;
    optionB: string;
    optionACount: number;
    optionBCount: number;
  }>;

  matchCount: number;
  matchRate: number;
}
