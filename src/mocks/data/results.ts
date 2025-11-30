import type {
  CreateResultResponse,
  ResultDisplayResponse,
  InviteeResultResponse,
} from '@/types/result';

/**
 * Result 생성 Mock 응답
 */
export const mockCreateResult: CreateResultResponse = {
  resultId: 'result-123',
};

/**
 * Result 전시 Mock 데이터 (초대 없음)
 */
export const mockResultDisplay: ResultDisplayResponse = {
  nickname: '웅쓰',
  inviterNickname: '사랑꾼 혜지님',
  compareType: '연애프로 같이봐도 안싸움',
  resultLabel: '당신의 성향은',
  resultType: '낭만의 사랑꾼',
  trend: {
    items: [
      {
        title: '당신은 어떤 이성에게 끌리나요?',
        options: [
          { id: 'q1-o1', title: '안끌리는 모범생' },
          { id: 'q1-o2', title: '끌리는 양아치' },
        ],
      },
      {
        title: '스킨십은 언제부터 하는 것이 좋을까요?',
        options: [
          { id: 'q2-o1', title: '100일 지나고 스킨십' },
          { id: 'q2-o2', title: '사귀기 전에 스킨십' },
        ],
      },
      {
        title: '연인에게 중요한 것은 무엇인가요?',
        options: [
          { id: 'q3-o1', title: '평범한데 성격 좋음' },
          { id: 'q3-o2', title: '성격보단 얼굴' },
        ],
      },
      {
        title: '이번 스타일의 남자를 선호하나요?',
        options: [
          { id: 'q4-o1', title: '가난한 진심남' },
          { id: 'q4-o2', title: '돈많은 헌팅남' },
        ],
      },
      {
        title: '연인과의 연락 빈도는 어느 정도가 적당한가요?',
        options: [
          { id: 'q5-o1', title: '하루에 두번 전화' },
          { id: 'q5-o2', title: '한달에 한번 전화' },
        ],
      },
    ],
  },
  selectedOptions: ['q1-o1', 'q2-o1', 'q3-o2', 'q4-o2', 'q5-o1'],
};

/**
 * Result 전시 Mock 데이터 (초대 있음 - 비교)
 */
export const mockResultDisplayWithInvite: ResultDisplayResponse = {
  nickname: '웅쓰',
  inviterNickname: '사랑꾼 혜지님',
  compareType: '연애프로 같이봐도 안싸움',
  resultLabel: '당신의 성향은',
  resultType: '낭만의 사랑꾼',
  trend: {
    items: [
      {
        title: '당신은 어떤 이성에게 끌리나요?',
        options: [
          { id: 'q1-o1', title: '안끌리는 모범생' },
          { id: 'q1-o2', title: '끌리는 양아치' },
        ],
      },
      {
        title: '스킨십은 언제부터 하는 것이 좋을까요?',
        options: [
          { id: 'q2-o1', title: '100일 지나고 스킨십' },
          { id: 'q2-o2', title: '사귀기 전에 스킨십' },
        ],
      },
      {
        title: '연인에게 중요한 것은 무엇인가요?',
        options: [
          { id: 'q3-o1', title: '평범한데 성격 좋음' },
          { id: 'q3-o2', title: '성격보단 얼굴' },
        ],
      },
      {
        title: '이번 스타일의 남자를 선호하나요?',
        options: [
          { id: 'q4-o1', title: '가난한 진심남' },
          { id: 'q4-o2', title: '돈많은 헌팅남' },
        ],
      },
      {
        title: '연인과의 연락 빈도는 어느 정도가 적당한가요?',
        options: [
          { id: 'q5-o1', title: '하루에 두번 전화' },
          { id: 'q5-o2', title: '한달에 한번 전화' },
        ],
      },
    ],
  },
  selectedOptions: ['q1-o1', 'q2-o1', 'q3-o2', 'q4-o2', 'q5-o1'],
  inviterSelectedOptions: ['q1-o1', 'q2-o2', 'q3-o2', 'q4-o1', 'q5-o2'],
  matchCount: 3,
  totalCount: 5,
};

export const mockResultInviteeList: InviteeResultResponse = {
  results: [
    {
      nickname: '영수',
      createdAt: '25/10/12 12:00 PM',
      compareType: '전생에 나라를 구한 듯',
    },
    {
      nickname: '웅일',
      createdAt: '25/10/12 12:10 PM',
      compareType: '어쩌면 운명?',
    },
    {
      nickname: '친구te46',
      createdAt: '25/10/12 12:10 PM',
      compareType: '겸상 금지',
    },
    {
      nickname: '요한',
      createdAt: '25/10/12 12:10 PM',
      compareType: '겸상 금지',
    },
    {
      nickname: '친구1b2f',
      createdAt: '25/10/12 12:10 PM',
      compareType: '겸상 금지',
    },
  ],
};
