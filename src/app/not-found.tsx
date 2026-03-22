import { ErrorPage } from '@/components/common/ErrorPage';

export default function NotFound() {
  return <ErrorPage statusCode="404" message="페이지를 찾을 수 없습니다." simpleHeader />;
}
