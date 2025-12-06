import type { ElectionDetail } from '@/types/election';

/**
 * Mock 선거 상세 데이터
 */
export const mockElectionDetail: ElectionDetail = {
  code: 'S0000',
  message: '성공',
  data: {
    id: 1,
    title: 'test',
    description: 'test',
    kind: 'DEFAULT',
    allowMultipleVotes: false,
    status: 'CLOSED',
    startTime: '2025-11-24T14:50:00',
    endTime: '2025-11-24T15:20:00',
    createdAt: '2025-11-24T14:38:44.044',
    isUnlimited: false,
    options: [
      {
        id: 1,
        title: 'test1',
        description: 'test1',
        imageUrl:
          'https://image.votebox.kr/uploads/2025/11/24/16e163f259c94991a24c2181fad3fa1a.png',
      },
      {
        id: 2,
        title: 'test2',
        description: 'test2',
        imageUrl:
          'https://image.votebox.kr/uploads/2025/11/24/6abfc0810e8a4bcba2252541d37480c0.png',
      },
    ],
  },
};
