import { MockMyResultPage } from '@/app/dev/_mock/MockMyResultPage';

export default function MyMock15Page() {
  return (
    <MockMyResultPage
      options={{
        token: 'my-mock-15',
        groupName: '15명 남8여7',
        maleCount: 8,
        femaleCount: 7,
      }}
    />
  );
}
