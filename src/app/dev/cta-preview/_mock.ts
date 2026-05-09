import type { TetoEgenAnswer, TetoEgenFriendVotes } from '@/types/ask-teto-egen';

export const MOCK_OWNER_DISPLAY_NAME = '웅일';
export const MOCK_OWNER_SELF_ANSWER: TetoEgenAnswer = 'TETO';
export const MOCK_MY_VOTE: TetoEgenAnswer = 'TETO';

export const MOCK_FRIEND_VOTES: TetoEgenFriendVotes = {
  total: 8,
  tetoCount: 5,
  egenCount: 3,
  voters: [
    // 일부에는 token 있음(클릭 가능), 일부는 없음(클릭 비활성) — 두 케이스 모두 미리보기.
    {
      userId: '1',
      displayName: '지원',
      vote: 'TETO',
      votedAt: '2026-05-08T12:00:00Z',
      token: 'mock-jiwon-token',
    },
    { userId: '2', displayName: '종화', vote: 'TETO', votedAt: '2026-05-08T11:30:00Z' },
    {
      userId: '3',
      displayName: '훈이',
      vote: 'EGEN',
      votedAt: '2026-05-08T11:00:00Z',
      token: 'mock-hooni-token',
    },
    { userId: '4', displayName: '성우', vote: 'TETO', votedAt: '2026-05-08T10:30:00Z' },
    {
      userId: '5',
      displayName: '재윤',
      vote: 'EGEN',
      votedAt: '2026-05-08T10:00:00Z',
      token: 'mock-jaeyoon-token',
    },
    { userId: '6', displayName: '민장', vote: 'TETO', votedAt: '2026-05-08T09:30:00Z' },
    { userId: '7', displayName: '민형', vote: 'TETO', votedAt: '2026-05-08T09:00:00Z' },
    {
      userId: '8',
      displayName: '쏭',
      vote: 'EGEN',
      votedAt: '2026-05-08T08:30:00Z',
      token: 'mock-ssong-token',
    },
  ],
};
