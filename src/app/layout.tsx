import { Archivo } from 'next/font/google';

import { QueryProvider } from '@/providers/QueryProvider';

import type { Metadata } from 'next';

import '@/styles/globals.scss';

const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Trend Web',
  description: 'Next.js application with TypeScript, SCSS, ESLint, and Prettier',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={archivo.variable}>
        <QueryProvider>
          {children}
          <div id="portal-root" />
        </QueryProvider>
      </body>
    </html>
  );
}
