import { Archivo } from 'next/font/google';

import '@/styles/globals.scss';

import type { Metadata } from 'next';

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
        {children}
        <div id="portal-root" />
      </body>
    </html>
  );
}
