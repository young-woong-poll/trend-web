interface VoteData {
  id: number;
  title: string;
  subtitle: string;
  options: Array<{
    id: number;
    text: string;
    imageUrl: string;
    // TODO : 제거
    show?: boolean;
  }>;
  commentCount: number;
}

// TODO: 실제 데이터는 API에서 가져와야 합니다
export const VOTE_DATA: VoteData[] = [
  {
    id: 1,
    title: '둘다 붙으면 어디감?',
    subtitle: '투표하면 결과가 나옵니다',
    options: [
      {
        id: 1,
        text: '아름다운 지방 연봉 6천',
        imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
        show: true,
      },
      {
        id: 2,
        text: '서울 연봉 5천',
        imageUrl: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80',
        show: false,
      },
    ],
    commentCount: 101,
  },
  {
    id: 2,
    title: '근무 형태는?',
    subtitle: '투표하면 결과가 나옵니다',
    options: [
      {
        id: 3,
        text: '재택근무',
        imageUrl: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80',
        show: false,
      },
      {
        id: 4,
        text: '출근',
        imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
        show: true,
      },
    ],
    commentCount: 85,
  },
  {
    id: 3,
    title: '회사 규모는?',
    subtitle: '투표하면 결과가 나옵니다',
    options: [
      {
        id: 5,
        text: '대기업',
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
        show: false,
      },
      {
        id: 6,
        text: '스타트업',
        imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',
        show: true,
      },
    ],
    commentCount: 92,
  },
];
