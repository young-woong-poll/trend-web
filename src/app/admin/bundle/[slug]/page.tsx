'use client';

import { use } from 'react';

import AdminBundleDashboard from '@/components/features/Admin/AdminBundleDashboard/AdminBundleDashboard';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function AdminBundleDetailPage({ params }: PageProps) {
  const { slug } = use(params);

  return <AdminBundleDashboard slug={slug} />;
}
