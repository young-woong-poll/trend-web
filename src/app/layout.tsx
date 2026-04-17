import { Roboto } from 'next/font/google';

import { GoogleAnalytics } from '@next/third-parties/google';

import { KakaoScript } from '@/components/common/KakaoScript';
import { ModalProvider } from '@/contexts/ModalContext';
import { COMMON_METADATA, SITE_URL } from '@/lib/seo/constants';
import AuthProvider from '@/providers/AuthProvider';
import { ClientProviders } from '@/providers/ClientProviders';
import { QueryProvider } from '@/providers/QueryProvider';

import type { Metadata, Viewport } from 'next';

import '@/styles/globals.scss';

const roboto = Roboto({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-roboto',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  ...COMMON_METADATA,
  manifest: '/manifest.json',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={roboto.variable}>
        <ClientProviders>
          <QueryProvider>
            <ModalProvider>
              <AuthProvider>{children}</AuthProvider>
              <div id="portal-root" />
            </ModalProvider>
          </QueryProvider>
        </ClientProviders>
        <GoogleAnalytics gaId="G-CBJFPV9C95" />
        <KakaoScript />
      </body>
    </html>
  );
}
