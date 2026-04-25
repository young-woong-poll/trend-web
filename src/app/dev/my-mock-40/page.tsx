import { MockMyResultPage } from '@/app/dev/_mock/MockMyResultPage';

export default function MyMock40Page() {
  return (
    <MockMyResultPage
      options={{
        token: 'my-mock-40',
        groupName: '40명 남녀 20:20',
        maleCount: 20,
        femaleCount: 20,
      }}
    />
  );
}
