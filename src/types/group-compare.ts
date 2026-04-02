/**
 * 그룹 비교 결과 (서버 응답)
 * 서버는 숫자만 리턴. 어워드/네트워크/가치관 지도는 FE에서 계산.
 */
export interface GroupCompareResult {
  bundleSlug: string;
  bundleTitle: string;
  totalQuestions: number;
  groupName: string;
  memberCount: number;

  /** 그룹 멤버 답변 */
  members: Array<{
    userId: string;
    nickname: string;
    answers: Array<{ electionId: string; selected: 'A' | 'B' }>;
  }>;

  /** 각 질문별 현재 투표 비율 (번들 전체 참여자 기준) */
  questionStats: Array<{
    electionId: string;
    title: string;
    optionA: string;
    optionB: string;
    optionARate: number;
    optionBRate: number;
    totalVotes: number;
    /** 가치관 지도 축 배정 (null = 미배정) */
    axis: 'X' | 'Y' | null;
  }>;

  /** 그룹 싱크율 (모든 멤버 쌍 일치율 평균) */
  groupSyncRate: number;
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
