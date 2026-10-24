import { Suspense } from 'react';
import ProviderClient from './ProviderClient';

export function generateStaticParams() {
  return Array.from({ length: 90 }, (_, i) => ({
    id: String(i + 1),
  }));
}

export default async function ProviderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-[#50635d]">Loading doctor profile...</div>}>
      <ProviderClient params={params} />
    </Suspense>
  );
}
