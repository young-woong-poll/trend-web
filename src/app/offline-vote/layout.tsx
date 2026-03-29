import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  themeColor: '#121212',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: '핫픽 - 오프라인 비교',
};

export default function OfflineVoteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
