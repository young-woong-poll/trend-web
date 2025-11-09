import type { Survey } from '@/types/vote';

export const surveys: Survey[] = [
  {
    id: '1',
    type: 'relationship',
    title: '대한민국 연애 난제',
    description: '당신의 문제라면?',
    participantCount: 1200,
    questions: [
      {
        id: 'q1',
        question: '첫 데이트 비용은 누가 내야 할까요?',
        options: [
          { id: 'o1', text: '남자가 낸다', count: 450 },
          { id: 'o2', text: '여자가 낸다', count: 50 },
          { id: 'o3', text: '반반 낸다', count: 600 },
          { id: 'o4', text: '번갈아 낸다', count: 100 },
        ],
      },
      {
        id: 'q2',
        question: '연애할 때 가장 중요한 것은?',
        options: [
          { id: 'o1', text: '외모', count: 200 },
          { id: 'o2', text: '성격', count: 700 },
          { id: 'o3', text: '경제력', count: 200 },
          { id: 'o4', text: '가치관', count: 100 },
        ],
      },
    ],
  },
];
