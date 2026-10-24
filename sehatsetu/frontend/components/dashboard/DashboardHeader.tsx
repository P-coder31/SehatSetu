'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, Search, Plus } from 'lucide-react';
import Breadcrumbs from './Breadcrumbs';
import NotificationButton from './NotificationButton';
import UserProfileMenu from './UserProfileMenu';

interface DashboardHeaderProps {
  onMenuToggle: () => void;
  customTitle?: string;
  role: 'patient' | 'professional' | 'admin';
}

export default function DashboardHeader({
  onMenuToggle,
  customTitle,
  role,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-[#e5ece7] px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl text-[#536760] hover:bg-[#edf5f0] hover:text-[#137b65] transition"
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>

        <Breadcrumbs customTitle={customTitle} />
      </div>

      {/* Right: Actions, Notifications, Profile */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Prominent Quick Action for Patients */}
        {role === 'patient' && (
          <Link
            href="/search"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#eef7f2] border border-[#bfe0cd] text-[#0f604f] font-bold text-xs hover:bg-[#e2f1e8] transition"
          >
            <Search size={14} /> Find Care
          </Link>
        )}

        {/* Quick Action for Professionals */}
        {role === 'professional' && (
          <Link
            href="/professional/availability"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f4f9f6] border border-[#cfe2d7] text-[#137b65] font-semibold text-xs hover:bg-[#eaf4ee] transition"
          >
            <Plus size={14} /> Set Working Hours
          </Link>
        )}

        <NotificationButton />
        <div className="w-px h-6 bg-[#e7eee9] mx-1" />
        <UserProfileMenu />
      </div>
    </header>
  );
}
