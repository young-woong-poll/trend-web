import type { ReactNode } from 'react';

import { notFound } from 'next/navigation';

import AdminNav from '@/components/features/Admin/AdminNav/AdminNav';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  // 로컬 개발 환경이 아니면 404 처리
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }

  return (
    <>
      <AdminNav />
      {children}
    </>
  );
}
