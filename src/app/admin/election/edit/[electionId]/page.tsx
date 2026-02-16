'use client';

import { use } from 'react';

import AdminElectionEdit from '@/components/features/Admin/AdminElectionEdit/AdminElectionEdit';

interface PageProps {
  params: Promise<{ electionId: string }>;
}

export default function AdminElectionEditPage({ params }: PageProps) {
  const { electionId } = use(params);

  return <AdminElectionEdit electionId={electionId} />;
}
