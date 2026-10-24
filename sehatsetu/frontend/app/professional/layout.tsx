'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function ProfessionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPublicPage = pathname === '/professional' || pathname === '/professional/onboarding';

  if (isPublicPage) {
    return <>{children}</>;
  }

  return <DashboardLayout role="professional">{children}</DashboardLayout>;
}
