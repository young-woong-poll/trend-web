'use client';

import { use } from 'react';

import AdminHotpickEdit from '@/components/features/Admin/AdminHotpickEdit/AdminHotpickEdit';

interface PageProps {
  params: Promise<{ hotpickId: string }>;
}

export default function AdminHotpickEditPage({ params }: PageProps) {
  const { hotpickId } = use(params);

  return <AdminHotpickEdit hotpickId={Number(hotpickId)} />;
}
