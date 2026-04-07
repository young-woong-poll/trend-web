/**
 * 그룹 비교 결과 (서버 응답)
 * 서버는 숫자만 리턴. 어워드/네트워크/가치관 지도는 FE에서 계산.
 */
import type { CategoryCode } from '@/types/hotpick';

export interface GroupCompareResult {
  bundleSlug: string;
  bundleTitle: string;
  totalQuestions: number;
  groupName: string;
  memberCount: number;
  /** 현재 로그인 유저의 userId (멤버 배열 내 매칭용) */
  myUserId: string;
  /** 현재 로그인 유저의 번들 완료 여부 (비멤버 join 흐름 분기용) */
  myBundleCompleted: boolean;
  /** 번들 카테고리 코드 */
  categoryCode?: CategoryCode;
  /** 이성 콘텐츠(이성궁합 랭킹, 성별 대결) 표시 여부 */
  showGenderContent?: boolean;
  /** 그룹 마감 여부 */
  isClosed: boolean;
  /** 그룹 생성자 userId — 설정 권한 판별용 */
  creatorUserId?: string;

  /** 그룹 멤버 답변 */
  members: Array<{
    userId: string;
    nickname: string;
    /** 그룹 참여 시 설정한 표시 이름. 없으면 nickname 사용 */
    displayName?: string;
    /** 그룹 참여 시 설정한 프로필 색상. 없으면 유저 기본 프로필 색상 사용 */
    displayProfileColor?: string;
    gender?: 'MALE' | 'FEMALE';
    birthYear?: number;
    /** 서비스 탈퇴 유저 여부 */
    isWithdrawn?: boolean;
    answers: Array<{ electionId: string; selected: 'A' | 'B' }>;
  }>;

  /** 각 질문별 실시간 투표 수 (번들 전체 참여자 기준, 1:1과 동일) */
  questionStats: Array<{
    electionId: string;
    title: string;
    optionA: string;
    optionB: string;
    optionACount: number;
    optionBCount: number;
    /** 가치관 지도 축 배정 (null = 미배정) */
    axis: 'X' | 'Y' | null;
  }>;
}

/**
 * 멤버 간 1:1 케미 정보 (FE 계산)
 */
export interface PairChemistry {
  memberA: string;
  memberB: string;
  nicknameA: string;
  nicknameB: string;
  matchCount: number;
  matchRate: number;
}

/**
 * 그룹 어워드 종류
 */
export type GroupAwardType =
  | 'GROUP_LEADER'
  | 'GROUP_OUTSIDER'
  | 'SOUL_CONNECTION'
  | 'POLAR_OPPOSITES'
  | 'CONTROVERSY_MAKER'
  | 'PEOPLES_CHAMPION';

/**
 * 그룹 어워드 결과 (FE 계산)
 */
export interface GroupAward {
  type: GroupAwardType;
  title: string;
  description: string;
  oneLiner: string;
  /** 수상자 (개인 또는 쌍) */
  winners: string[];
  winnerNicknames: string[];
  /** 수치 (일치율, 점수 등) */
  value: number;
}

/**
 * 가치관 지도 좌표 (FE 계산)
 */
export interface ValueMapCoordinate {
  userId: string;
  nickname: string;
  x: number; // -1 ~ +1
  y: number; // -1 ~ +1
}

/**
 * 가치관 지도 설정 (어드민 → 서버 → FE)
 * Phase 2에서는 MSW 하드코딩, 추후 어드민 UI 연동
 */
export interface ValueMapConfig {
  xAxisLeft: string;
  xAxisRight: string;
  yAxisBottom: string;
  yAxisTop: string;
  quadrantLabels: {
    topLeft: string;
    topRight: string;
    bottomLeft: string;
    bottomRight: string;
  };
}
