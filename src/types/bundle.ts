// src/types/bundle.ts

/**
 * 번들 상세 (인트로 페이지용)
 * 서버 응답을 그대로 사용하는 타입
 */
export interface BundleDetail {
  bundleId: number;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  questionCount: number;
  status: 'ACTIVE' | 'CLOSED';
  imageUrl?: string;
  participantCount: number;
  /** 로그인 유저의 번들 완료 여부 (비로그인 시 false) */
  completed: boolean;
}

/**
 * 번들 질문 (풀기 페이지용)
 */
export interface BundleElection {
  electionId: string;
  title: string;
  optionA: string;
  optionB: string;
  order: number;
}

/**
 * 번들 답변 제출 요청
 */
export interface BundleAnswerRequest {
  answers: Array<{
    electionId: string;
    selected: 'A' | 'B';
  }>;
}

/**
 * 번들 내 결과 (결과 페이지용)
 * 서버는 숫자만 리턴. 등급/캐릭터/문구는 FE에서 매핑.
 */
export interface BundleMyResult {
  bundleSlug: string;
  bundleTitle: string;
  totalQuestions: number;
  myAnswers: Array<{
    electionId: string;
    title: string;
    optionA: string;
    optionB: string;
    selected: 'A' | 'B';
  }>;
  /** 각 질문별 현재 투표 비율 (실시간 변동) */
  questionStats: Array<{
    electionId: string;
    optionARate: number;
    optionBRate: number;
    totalVotes: number;
  }>;
}
