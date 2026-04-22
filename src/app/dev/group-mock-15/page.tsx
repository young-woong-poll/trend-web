import { MockGroupResultPage } from '@/app/dev/_mock/MockGroupResultPage';

export default function GroupMock15Page() {
  return (
    <MockGroupResultPage
      options={{
        token: 'mock-15',
        groupName: '15명 남8여7',
        maleCount: 8,
        femaleCount: 7,
      }}
    />
  );
}
