import { Suspense } from 'react';
import BookingClient from './BookingClient';

export function generateStaticParams() {
  return Array.from({ length: 90 }, (_, i) => ({
    providerId: String(i + 1),
  }));
}

export default async function BookingPage({
  params,
}: {
  params: Promise<{ providerId: string }>;
}) {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-[#50635d]">Loading appointment details...</div>}>
      <BookingClient params={params} />
    </Suspense>
  );
}
