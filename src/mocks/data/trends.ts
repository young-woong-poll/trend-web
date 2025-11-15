import type {
  MainDisplayResponse,
  TrendDisplayResponse,
  TrendVoteCountResponse,
} from '@/types/trend';

/**
 * 메인 전시 Mock 데이터
 */
export const mockMainDisplay: MainDisplayResponse = {
  trends: [
    {
      id: 'love',
      title: '대한민국 연애 난제',
      label: '당신의 문제라면?',
      imageUrl: 'https://picsum.photos/400/300?random=1',
      participantsCount: 1200,
    },
    {
      id: 'relationship',
      title: '인간관계 고민',
      label: '당신의 선택은?',
      imageUrl: 'https://picsum.photos/400/300?random=2',
      participantsCount: 850,
    },
    {
      id: 'career',
      title: '직장생활 딜레마',
      label: '어떻게 하시겠습니까?',
      imageUrl: 'https://picsum.photos/400/300?random=3',
      participantsCount: 2100,
    },
  ],
};

/**
 * Trend 전시 Mock 데이터
 */
export const mockTrendDisplay: TrendDisplayResponse = {
  items: [
    {
      id: 'q1',
      title: '당신은 어떤 이성에게 끌리나요?',
      label: '연애 스타일',
      options: [
        {
          id: 'q1-o1',
          title: '안끌리는 모범생',
          imageUrl: 'https://picsum.photos/300/200?random=11',
        },
        {
          id: 'q1-o2',
          title: '끌리는 양아치',
          imageUrl: 'https://picsum.photos/300/200?random=12',
        },
      ],
    },
    {
      id: 'q2',
      title: '스킨십은 언제부터 하는 것이 좋을까요?',
      label: '스킨십 타이밍',
      options: [
        {
          id: 'q2-o1',
          title: '100일 지나고 스킨십',
          imageUrl: 'https://picsum.photos/300/200?random=21',
        },
        {
          id: 'q2-o2',
          title: '사귀기 전에 스킨십',
          imageUrl: 'https://picsum.photos/300/200?random=22',
        },
      ],
    },
    {
      id: 'q3',
      title: '연인에게 중요한 것은 무엇인가요?',
      label: '가치관',
      options: [
        {
          id: 'q3-o1',
          title: '평범한데 성격 좋음',
          imageUrl: 'https://picsum.photos/300/200?random=31',
        },
        {
          id: 'q3-o2',
          title: '성격보단 얼굴',
          imageUrl: 'https://picsum.photos/300/200?random=32',
        },
      ],
    },
    {
      id: 'q4',
      title: '이번 스타일의 남자를 선호하나요?',
      label: '이상형',
      options: [
        {
          id: 'q4-o1',
          title: '가난한 진심남',
          imageUrl: 'https://picsum.photos/300/200?random=41',
        },
        {
          id: 'q4-o2',
          title: '돈많은 헌팅남',
          imageUrl: 'https://picsum.photos/300/200?random=42',
        },
      ],
    },
    {
      id: 'q5',
      title: '연인과의 연락 빈도는 어느 정도가 적당한가요?',
      label: '연락 빈도',
      options: [
        {
          id: 'q5-o1',
          title: '하루에 두번 전화',
          imageUrl: 'https://picsum.photos/300/200?random=51',
        },
        {
          id: 'q5-o2',
          title: '한달에 한번 전화',
          imageUrl: 'https://picsum.photos/300/200?random=52',
        },
      ],
    },
  ],
};

/**
 * Trend 투표 수 Mock 데이터
 */
export const mockTrendVoteCount: TrendVoteCountResponse = {
  options: [
    { id: 'q1-o1', count: 450 },
    { id: 'q1-o2', count: 750 },
    { id: 'q2-o1', count: 680 },
    { id: 'q2-o2', count: 520 },
    { id: 'q3-o1', count: 890 },
    { id: 'q3-o2', count: 310 },
    { id: 'q4-o1', count: 420 },
    { id: 'q4-o2', count: 780 },
    { id: 'q5-o1', count: 950 },
    { id: 'q5-o2', count: 250 },
  ],
};
