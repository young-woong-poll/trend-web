import type { TetoEgenAnswer, TetoEgenFriendVotes } from '@/types/ask-teto-egen';

export const MOCK_OWNER_DISPLAY_NAME = '웅일';
export const MOCK_OWNER_SELF_ANSWER: TetoEgenAnswer = 'TETO';
export const MOCK_MY_VOTE: TetoEgenAnswer = 'TETO';

export const MOCK_FRIEND_VOTES: TetoEgenFriendVotes = {
  total: 8,
  tetoCount: 5,
  egenCount: 3,
  voters: [
    // 일부에는 tetoEgenToken 있음(클릭 가능), 일부는 없음(클릭 비활성) — 두 케이스 모두 미리보기.
    // profileColor도 일부만 — BE가 내려주는 전형/누락 케이스 모두 시각화.
    {
      userId: '1',
      displayName: '지원',
      vote: 'TETO',
      votedAt: '2026-05-08T12:00:00Z',
      tetoEgenToken: 'mock-jiwon-token',
      profileColor: 'CORAL',
    },
    {
      userId: '2',
      displayName: '종화',
      vote: 'TETO',
      votedAt: '2026-05-08T11:30:00Z',
      profileColor: 'OCEAN',
    },
    {
      userId: '3',
      displayName: '훈이',
      vote: 'EGEN',
      votedAt: '2026-05-08T11:00:00Z',
      tetoEgenToken: 'mock-hooni-token',
      profileColor: 'LIME',
    },
    {
      userId: '4',
      displayName: '성우',
      vote: 'TETO',
      votedAt: '2026-05-08T10:30:00Z',
      profileColor: 'SUNSET',
    },
    {
      userId: '5',
      displayName: '재윤',
      vote: 'EGEN',
      votedAt: '2026-05-08T10:00:00Z',
      tetoEgenToken: 'mock-jaeyoon-token',
      profileColor: 'GRAPE',
    },
    { userId: '6', displayName: '민장', vote: 'TETO', votedAt: '2026-05-08T09:30:00Z' },
    { userId: '7', displayName: '민형', vote: 'TETO', votedAt: '2026-05-08T09:00:00Z' },
    {
      userId: '8',
      displayName: '쏭',
      vote: 'EGEN',
      votedAt: '2026-05-08T08:30:00Z',
      tetoEgenToken: 'mock-ssong-token',
      profileColor: 'MINT',
    },
  ],
};
