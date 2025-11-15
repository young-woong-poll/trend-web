'use client';

import { Header } from '@/components/common/Header/Header';

import { CompareLinkCard } from './CompareLinkCard/CompareLinkCard';
import { ComparisonCard } from './ComparisonCard/ComparisonCard';
import { CopyUrlCard } from './CopyUrlCard/CopyUrlCard';
import styles from './ResultView.module.scss';
import { TypeCard } from './TypeCard/TypeCard';

interface ResultViewProps {
  type: string;
}

const questions = [
  {
    question: '당신은 어떤 이성에게 끌리나요?',
    options: ['안끌리는 모범생', '끌리는 양아치'] as [string, string],
    selectedIndex: 0,
  },
  {
    question: '스킨십은 언제부터 하는 것이 좋을까요?',
    options: ['100일 지나고 스킨십', '사귀기 전에 스킨십'] as [string, string],
    selectedIndex: 0,
  },
  {
    question: '연인에게 중요한 것은 무엇인가요?',
    options: ['평범한데 성격 좋음', '성격보란 얼굴'] as [string, string],
    selectedIndex: 1,
  },
  {
    question: '이번 스타일의 남자를 선호하나요?',
    options: ['가난한 진심남', '돈많은 헌팅남'] as [string, string],
    selectedIndex: 1,
  },
  {
    question: '연인과의 연락 빈도는 어느 정도가 적당한가요?',
    options: ['하루에 두번 전화', '한달에 한번 전화'] as [string, string],
    selectedIndex: 0,
  },
];

// 테스트용 친구 결과 데이터
const mockFriendResults = [
  {
    nickname: '제이제이홈',
    timestamp: '25/10/12 12:00 PM',
    comment: '어이쿠로 킹아빠도 안써주냐 어이쿠로 킹아빠도 안써주냐 킹아빠도 안써주냐',
  },
  {
    nickname: '웅쓰테고',
    timestamp: '25/10/12 12:10 PM',
    comment: '어이쿠로 킹아빠도 안써주냐',
  },
  {
    nickname: '친구te46',
    timestamp: '25/10/12 12:10 PM',
    comment: '정디 검상 금지',
  },
  {
    nickname: '요한',
    timestamp: '25/10/12 12:10 PM',
    comment: '정디 검상 금지',
  },
  {
    nickname: '친구1b2f',
    timestamp: '25/10/12 12:10 PM',
    comment: '정디 검상 금지',
  },
];

// 테스트용 비교 상세 데이터
const mockComparisonDetail = {
  friendNickname: '해지님',
  matchCount: 3,
  totalCount: 5,
  comparisons: [
    {
      question: '선호하는 이성',
      myAnswer: '안끌리는 모범생',
      friendAnswer: '안끌리는 모범생',
      isMatch: true,
    },
    {
      question: '스킨십 시점',
      myAnswer: '100일 지나고 스킨십',
      friendAnswer: '사귀기 전에 스킨십',
      isMatch: false,
    },
    {
      question: '중요한 가치',
      myAnswer: '성격보단 얼굴',
      friendAnswer: '성격보단 얼굴',
      isMatch: true,
    },
    {
      question: '데이트 비용',
      myAnswer: '돈많은 헌팅남',
      friendAnswer: '돈많은 헌팅남',
      isMatch: true,
    },
    {
      question: '연락 빈도',
      myAnswer: '하루에 두번 전화',
      friendAnswer: '한달에 한번 전화',
      isMatch: false,
    },
  ],
};

export const ResultView = ({ type }: ResultViewProps) => (
  <div className={styles.container}>
    <Header />
    {type}
    <div className={styles.content}>
      <TypeCard questions={questions} />

      <CompareLinkCard friendResults={mockFriendResults} />

      <CopyUrlCard />

      <ComparisonCard
        friendNickname={mockComparisonDetail.friendNickname}
        matchCount={mockComparisonDetail.matchCount}
        totalCount={mockComparisonDetail.totalCount}
        comparisons={mockComparisonDetail.comparisons}
      />
    </div>
  </div>
);
