import type { ElectionDetailResponse } from '@/types/election';

/**
 * Mock 선거 상세 데이터
 */
export const mockElectionDetail: ElectionDetailResponse = {
  code: 'S0000',
  message: '성공',
  data: {
    id: 1,
    isUnlimted: true,
    title: '2024 임원 선거',
    description: '2024년도 학생회 임원 선거',
    status: 'OPEN',
    kind: 'SINGLE',
    allowMultipleVotes: false,
    period: {
      startTime: '2024-01-01T09:00:00',
      endTime: '2024-01-02T18:00:00',
    },
    candidates: [
      {
        id: 1,
        name: '김철수',
        description: '성실한 후보',
      },
      {
        id: 2,
        name: '이영희',
        description: '혁신적인 후보',
      },
    ],
  },
};
