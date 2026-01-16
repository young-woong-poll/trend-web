import type { CreateResultResponse, ResultDisplayResponse } from '@/types/result';

/**
 * Result 생성 Mock 응답
 */
export const mockCreateResult: CreateResultResponse = {
  resultId: 'result-123',
};

/**
 * Result 전시 Mock 데이터
 * 디자인 이미지 기반 - "소셜 카멜레온" 유형
 */
export const mockResultDisplay: ResultDisplayResponse = {
  resultId: 'result-123',
  resultLabel: '2026 월드컵 핫픽',
  resultType: {
    label: '소셜 카멜레온',
    description: '어떤 상황에도 맞출 수 있는 유연한 취향',
    imageUrl: 'https://picsum.photos/seed/frog/200/200',
    tags: ['적응력만렙', '예측불가'],
  },
  selectedOptions: [
    {
      itemId: 'item-1',
      itemTitle: '부자되려면 뭘 사야할까?',
      optionId: 'q1-o1',
      optionTitle: '부산 별장',
      optionImageUrl: 'https://picsum.photos/seed/house/100/100',
      percent: 65,
    },
    {
      itemId: 'item-2',
      itemTitle: '지금이라도 홍명보 OUT?',
      optionId: 'q2-o2',
      optionTitle: '외국 명장으로 교체',
      optionImageUrl: 'https://picsum.photos/seed/soccer/100/100',
      percent: 35,
    },
    {
      itemId: 'item-3',
      itemTitle: '요새 즐겨듣는 노래는?',
      optionId: 'q3-o1',
      optionTitle: 'J-POP',
      optionImageUrl: 'https://picsum.photos/seed/music/100/100',
      percent: 47,
    },
    {
      itemId: 'item-4',
      itemTitle: '국가대표 스트라이커는?',
      optionId: 'q4-o1',
      optionTitle: '조규성',
      optionImageUrl: 'https://picsum.photos/seed/player/100/100',
      percent: 88,
    },
    {
      itemId: 'item-5',
      itemTitle: '갤럭시 vs 아이폰',
      optionId: 'q5-o1',
      optionTitle: '갤럭시',
      optionImageUrl: 'https://picsum.photos/seed/phone/100/100',
      percent: 52,
    },
  ],
};
