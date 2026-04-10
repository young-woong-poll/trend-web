'use client';

import { use } from 'react';

import AdminSuggestionDetail from '@/components/features/Admin/AdminSuggestionDetail/AdminSuggestionDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminSuggestionDetailPage({ params }: PageProps) {
  const { id } = use(params);

  return <AdminSuggestionDetail suggestionId={Number(id)} />;
}
