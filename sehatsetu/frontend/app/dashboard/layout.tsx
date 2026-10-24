'use client';

import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function PatientDashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout role="patient">{children}</DashboardLayout>;
}
