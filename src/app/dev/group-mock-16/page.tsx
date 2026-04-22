import { MockGroupResultPage } from '@/app/dev/_mock/MockGroupResultPage';

export default function GroupMock16Page() {
  return (
    <MockGroupResultPage
      options={{
        token: 'mock-16',
        groupName: '16명 남녀 8:8',
        maleCount: 8,
        femaleCount: 8,
      }}
    />
  );
}
