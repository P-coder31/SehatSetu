'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Search, Calendar, FileText, User, LayoutDashboard, Stethoscope, ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface MobileBottomNavProps {
  onOpenSignIn?: () => void;
}

export default function MobileBottomNav({ onOpenSignIn }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const isHome = pathname === '/';
  const isSearch = pathname === '/search';
  const isAppointments = pathname.includes('/appointments');
  const isPassport = pathname.includes('/care-passport') || pathname.includes('/health-schemes');
  const isDashboard = pathname.includes('/dashboard') || pathname.includes('/professional');

  const apptHref = user
    ? user.role === 'professional'
      ? '/professional/appointments'
      : '/dashboard/appointments'
    : '/dashboard/appointments';

  const dashboardHref = user
    ? user.role === 'admin'
      ? '/admin/dashboard'
      : user.role === 'professional'
      ? '/professional/dashboard'
      : '/dashboard'
    : '/login';

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#e2ede6] shadow-lg px-2 py-1.5 transition-all"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 8px), 8px)' }}
      aria-label="Mobile Bottom Navigation"
    >
      <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto text-center">
        
        {/* 1. Home */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center py-1 transition ${
            isHome ? 'text-[#137b65] font-bold' : 'text-[#687d75] hover:text-[#172b28]'
          }`}
        >
          <div className={`p-1 rounded-xl transition ${isHome ? 'bg-[#eaf5ee]' : ''}`}>
            <Home size={19} strokeWidth={isHome ? 2.5 : 2} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Home</span>
        </Link>

        {/* 2. Search Doctors */}
        <Link
          href="/search"
          className={`flex flex-col items-center justify-center py-1 transition ${
            isSearch ? 'text-[#137b65] font-bold' : 'text-[#687d75] hover:text-[#172b28]'
          }`}
        >
          <div className={`p-1 rounded-xl transition ${isSearch ? 'bg-[#eaf5ee]' : ''}`}>
            <Search size={19} strokeWidth={isSearch ? 2.5 : 2} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Find Care</span>
        </Link>

        {/* 3. Appointments */}
        <Link
          href={apptHref}
          className={`flex flex-col items-center justify-center py-1 transition ${
            isAppointments ? 'text-[#137b65] font-bold' : 'text-[#687d75] hover:text-[#172b28]'
          }`}
        >
          <div className={`p-1 rounded-xl transition ${isAppointments ? 'bg-[#eaf5ee]' : ''}`}>
            <Calendar size={19} strokeWidth={isAppointments ? 2.5 : 2} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Visits</span>
        </Link>

        {/* 4. Care Passport */}
        <Link
          href="/dashboard/care-passport"
          className={`flex flex-col items-center justify-center py-1 transition ${
            isPassport ? 'text-[#137b65] font-bold' : 'text-[#687d75] hover:text-[#172b28]'
          }`}
        >
          <div className={`p-1 rounded-xl transition ${isPassport ? 'bg-[#eaf5ee]' : ''}`}>
            <FileText size={19} strokeWidth={isPassport ? 2.5 : 2} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Passport</span>
        </Link>

        {/* 5. Account / Dashboard / Sign In */}
        {user ? (
          <Link
            href={dashboardHref}
            className={`flex flex-col items-center justify-center py-1 transition ${
              isDashboard ? 'text-[#137b65] font-bold' : 'text-[#687d75] hover:text-[#172b28]'
            }`}
          >
            <div className={`p-1 rounded-xl transition ${isDashboard ? 'bg-[#eaf5ee]' : ''}`}>
              <LayoutDashboard size={19} strokeWidth={isDashboard ? 2.5 : 2} />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Portal</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={onOpenSignIn}
            className="flex flex-col items-center justify-center py-1 text-[#687d75] hover:text-[#137b65] transition"
          >
            <div className="p-1 rounded-xl">
              <User size={19} strokeWidth={2} />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Sign In</span>
          </button>
        )}

      </div>
    </nav>
  );
}
