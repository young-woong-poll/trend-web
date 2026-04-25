import { MockMyResultPage } from '@/app/dev/_mock/MockMyResultPage';

export default function MyMock16Page() {
  return (
    <MockMyResultPage
      options={{
        token: 'my-mock-16',
        groupName: '16명 남녀 8:8',
        maleCount: 8,
        femaleCount: 8,
      }}
    />
  );
}
