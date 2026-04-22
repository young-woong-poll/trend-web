import { MockGroupResultPage } from '@/app/dev/_mock/MockGroupResultPage';

export default function GroupMock40Page() {
  return (
    <MockGroupResultPage
      options={{
        token: 'mock-40',
        groupName: '40명 남녀 20:20',
        maleCount: 20,
        femaleCount: 20,
      }}
    />
  );
}
