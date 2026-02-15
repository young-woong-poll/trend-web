import type { Election, ElectionListResponse } from '@/types/election';

/**
 * Admin Election CRUD Mock 데이터
 *
 * 테스트 케이스:
 * - IMAGE 투표 (2개 옵션)
 * - TEXT 투표 (4개 옵션)
 * - TEXT 투표 (2개 옵션)
 * - CLOSED 상태
 * - 핫픽 미연결 선거
 */

let mockElections: Election[] = [
  {
    id: 'elec-1',
    title: '당신은 어떤 이성에게 끌리나요?',
    voteType: 'IMAGE',
    options: [
      {
        id: 'elec-1-o1',
        title: '안끌리는 모범생',
        imageUrl: 'https://picsum.photos/300/200?random=e11',
        order: 0,
      },
      {
        id: 'elec-1-o2',
        title: '끌리는 양아치',
        imageUrl: 'https://picsum.photos/300/200?random=e12',
        order: 1,
      },
    ],
    status: 'OPEN',
    linkedHotpickCount: 1,
    createdAt: '2026-02-10T10:00:00Z',
    updatedAt: '2026-02-10T10:00:00Z',
  },
  {
    id: 'elec-2',
    title: '여유자금 1억이 생겼다면?',
    voteType: 'TEXT',
    mainImageUrl: 'https://picsum.photos/400/200?random=e2-main',
    options: [
      { id: 'elec-2-o1', title: '안전한 적금', order: 0 },
      { id: 'elec-2-o2', title: '공격적인 주식', order: 1 },
      { id: 'elec-2-o3', title: '부동산 투자', order: 2 },
      { id: 'elec-2-o4', title: '비트코인 올인', order: 3 },
    ],
    status: 'OPEN',
    linkedHotpickCount: 1,
    createdAt: '2026-02-11T14:00:00Z',
    updatedAt: '2026-02-11T14:00:00Z',
  },
  {
    id: 'elec-3',
    title: '스킨십은 언제부터?',
    voteType: 'IMAGE',
    options: [
      {
        id: 'elec-3-o1',
        title: '100일 지나고',
        imageUrl: 'https://picsum.photos/300/200?random=e31',
        order: 0,
      },
      {
        id: 'elec-3-o2',
        title: '사귀기 전에',
        imageUrl: 'https://picsum.photos/300/200?random=e32',
        order: 1,
      },
    ],
    status: 'OPEN',
    linkedHotpickCount: 1,
    createdAt: '2026-02-10T11:00:00Z',
    updatedAt: '2026-02-10T11:00:00Z',
  },
  {
    id: 'elec-4',
    title: '야근 vs 주말출근?',
    voteType: 'IMAGE',
    options: [
      {
        id: 'elec-4-o1',
        title: '야근 3시간',
        imageUrl: 'https://picsum.photos/300/200?random=e41',
        order: 0,
      },
      {
        id: 'elec-4-o2',
        title: '토요일 출근',
        imageUrl: 'https://picsum.photos/300/200?random=e42',
        order: 1,
      },
    ],
    status: 'CLOSED',
    linkedHotpickCount: 1,
    createdAt: '2026-02-05T09:00:00Z',
    updatedAt: '2026-02-07T09:00:00Z',
  },
  {
    id: 'elec-5',
    title: '퇴직금 운용 방법은?',
    voteType: 'TEXT',
    mainImageUrl: 'https://picsum.photos/400/200?random=e5-main',
    options: [
      { id: 'elec-5-o1', title: 'IRP 연금저축', order: 0 },
      { id: 'elec-5-o2', title: 'ETF 분산투자', order: 1 },
    ],
    status: 'OPEN',
    linkedHotpickCount: 0,
    createdAt: '2026-02-12T16:00:00Z',
    updatedAt: '2026-02-12T16:00:00Z',
  },
  {
    id: 'elec-6',
    title: '첫 데이트 어디로?',
    voteType: 'IMAGE',
    options: [
      {
        id: 'elec-6-o1',
        title: '분위기 좋은 카페',
        imageUrl: 'https://picsum.photos/300/200?random=e61',
        order: 0,
      },
      {
        id: 'elec-6-o2',
        title: '놀이공원',
        imageUrl: 'https://picsum.photos/300/200?random=e62',
        order: 1,
      },
    ],
    status: 'OPEN',
    linkedHotpickCount: 1,
    createdAt: '2026-02-13T08:00:00Z',
    updatedAt: '2026-02-13T08:00:00Z',
  },
];

let nextId = 7;

/** Mock: 선거 목록 조회 (페이지네이션 + 필터) */
export const getMockElectionList = (params?: {
  keyword?: string;
  voteType?: string;
  status?: string;
  page?: number;
  size?: number;
}): ElectionListResponse => {
  let filtered = [...mockElections];

  if (params?.keyword) {
    const kw = params.keyword.toLowerCase();
    filtered = filtered.filter((e) => e.title.toLowerCase().includes(kw));
  }
  if (params?.voteType) {
    filtered = filtered.filter((e) => e.voteType === params.voteType);
  }
  if (params?.status) {
    filtered = filtered.filter((e) => e.status === params.status);
  }

  const page = params?.page ?? 0;
  const size = params?.size ?? 20;
  const start = page * size;
  const content = filtered.slice(start, start + size);

  return {
    content,
    totalElements: filtered.length,
    totalPages: Math.ceil(filtered.length / size),
    number: page,
    size,
  };
};

/** Mock: 선거 상세 조회 */
export const getMockElection = (id: string): Election | undefined =>
  mockElections.find((e) => e.id === id);

/** Mock: 선거 생성 */
export const createMockElection = (data: {
  title: string;
  voteType: string;
  mainImageUrl?: string;
  options: { title: string; imageUrl?: string; order: number }[];
}): Election => {
  const electionId = `elec-${nextId++}`;
  const newElection: Election = {
    id: electionId,
    title: data.title,
    voteType: data.voteType as 'IMAGE' | 'TEXT',
    mainImageUrl: data.mainImageUrl,
    options: data.options.map((opt, i) => ({
      id: `${electionId}-o${i + 1}`,
      title: opt.title,
      imageUrl: opt.imageUrl,
      order: opt.order,
    })),
    status: 'OPEN',
    linkedHotpickCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockElections.unshift(newElection);
  return newElection;
};

/** Mock: 선거 수정 */
export const updateMockElection = (
  id: string,
  data: {
    title: string;
    voteType: string;
    mainImageUrl?: string;
    options: { title: string; imageUrl?: string; order: number }[];
  }
): Election | undefined => {
  const index = mockElections.findIndex((e) => e.id === id);
  if (index === -1) {
    return undefined;
  }

  const updated: Election = {
    ...mockElections[index],
    title: data.title,
    voteType: data.voteType as 'IMAGE' | 'TEXT',
    mainImageUrl: data.mainImageUrl,
    options: data.options.map((opt, i) => ({
      id: `${id}-o${i + 1}`,
      title: opt.title,
      imageUrl: opt.imageUrl,
      order: opt.order,
    })),
    updatedAt: new Date().toISOString(),
  };
  mockElections[index] = updated;
  return updated;
};

/** Mock: 선거 삭제 */
export const deleteMockElection = (id: string): boolean => {
  const before = mockElections.length;
  mockElections = mockElections.filter((e) => e.id !== id);
  return mockElections.length < before;
};
