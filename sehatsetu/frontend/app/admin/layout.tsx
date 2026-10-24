'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === '/admin') {
    return <>{children}</>;
  }

  return <DashboardLayout role="admin">{children}</DashboardLayout>;
}
