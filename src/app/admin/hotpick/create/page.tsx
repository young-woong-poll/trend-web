'use client';

import { useSearchParams } from 'next/navigation';

import { AdminHotpickForm } from '@/components/features/Admin/AdminHotpickForm';

export default function AdminHotpickCreatePage() {
  const searchParams = useSearchParams();
  const isBundle = searchParams.get('type') === 'BUNDLE';

  return (
    <AdminHotpickForm
      backUrl={isBundle ? '/admin/bundle' : '/admin/hotpick'}
      defaultType={isBundle ? 'BUNDLE' : 'SINGLE'}
    />
  );
}
