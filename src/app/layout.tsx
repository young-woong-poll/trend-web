import { Archivo } from 'next/font/google';

import { ModalProvider } from '@/contexts/ModalContext';
import { COMMON_METADATA, SITE_URL } from '@/lib/seo/constants';
import { MSWProvider } from '@/providers/MSWProvider';
import { QueryProvider } from '@/providers/QueryProvider';

import type { Metadata } from 'next';

import '@/styles/globals.scss';

const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
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
      <body className={archivo.variable}>
        <MSWProvider>
          <QueryProvider>
            <ModalProvider>
              {children}
              <div id="portal-root" />
            </ModalProvider>
          </QueryProvider>
        </MSWProvider>
      </body>
    </html>
  );
}
