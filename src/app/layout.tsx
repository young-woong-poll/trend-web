import { Roboto } from 'next/font/google';

import { ModalProvider } from '@/contexts/ModalContext';
import { COMMON_METADATA, SITE_URL } from '@/lib/seo/constants';
import { ClientProviders } from '@/providers/ClientProviders';
import { QueryProvider } from '@/providers/QueryProvider';

import type { Metadata } from 'next';

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
              {children}
              <div id="portal-root" />
            </ModalProvider>
          </QueryProvider>
        </ClientProviders>
      </body>
    </html>
  );
}
