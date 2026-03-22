import { ErrorPage } from '@/components/common/ErrorPage';

export default function NotFound() {
  return <ErrorPage statusCode="404" message="존재하지 않는 핫픽입니다." simpleHeader />;
}
