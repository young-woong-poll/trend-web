/**
 * 그룹 비교 결과 (서버 응답)
 * 서버는 숫자만 리턴. 어워드/네트워크/가치관 지도는 FE에서 계산.
 *
 * BE GroupCompareResultResponse 기반.
 * questionStats[].axis와 members[].birthYear는 FE 전용 필드.
 */
import type { GroupCompareResultResponse } from '@/generated/models/groupCompareResultResponse';
import type { CategoryCode } from '@/types/hotpick';

/**
 * GroupCompareResult: BE 타입 기반 + FE 전용 필드
 *
 * BE에 없는 FE 전용 필드:
 * - members[].birthYear: 연령대 표시 (확인 필요)
 * - questionStats[].axis: 가치맵 축 매핑 (FE-only 로직)
 */
export type GroupCompareResult = Omit<
  GroupCompareResultResponse,
  'categoryCode' | 'members' | 'questionStats'
> & {
  categoryCode?: CategoryCode;
  members?: Array<{
    userId?: string;
    nickname?: string;
    displayName?: string;
    displayProfileColor?: string;
    gender?: 'MALE' | 'FEMALE';
    // TODO: BE swagger에 누락된 필드 — BE에 추가 요청 필요
    birthYear?: number;
    isWithdrawn?: boolean;
    answers?: Array<{ electionId: string; electionItemId: string }>;
  }>;
  questionStats?: Array<{
    electionId?: string;
    title?: string;
    optionStats?: Array<{
      electionItemId?: string;
      title?: string;
      imageUrl?: string;
      voteCount?: number;
    }>;
    /** 가치관 지도 축 배정 (FE-only, null = 미배정) */
    axis?: 'X' | 'Y' | null;
  }>;
};

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
