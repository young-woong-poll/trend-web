'use client';

import { use } from 'react';

import AdminTrendEdit from '@/components/features/Admin/AdminTrendEdit/AdminTrendEdit';

interface PageProps {
  params: Promise<{ trendId: string }>;
}

export default function AdminTrendEditPage({ params }: PageProps) {
  const { trendId } = use(params);

  return <AdminTrendEdit trendId={Number(trendId)} />;
}
