'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, LogOut, ChevronDown, Settings } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function UserProfileMenu() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!user) return null;

  const roleLabel = {
    patient: 'Patient',
    professional: 'Doctor',
    admin: 'Admin',
  }[user.role] || 'User';

  const roleBadgeColor = {
    patient: 'bg-[#eaf4ee] text-[#137b65] border-[#cbe1d3]',
    professional: 'bg-[#e4f2ee] text-[#0f5e4e] border-[#b8ded2]',
    admin: 'bg-slate-100 text-slate-800 border-slate-300',
  }[user.role];

  const profileHref = {
    patient: '/dashboard/profile',
    professional: '/professional/profile',
    admin: '/admin/dashboard',
  }[user.role];

  const settingsHref = {
    patient: '/dashboard/settings',
    professional: '/professional/settings',
    admin: '/admin/settings',
  }[user.role];

  const initials = user.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#f0f5f2] border border-transparent hover:border-[#dce7e0] transition text-left"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <div className="w-8 h-8 rounded-lg bg-[#137b65] text-white font-bold text-xs flex items-center justify-center shrink-0">
          {initials}
        </div>
        <div className="hidden sm:block leading-tight text-left pr-1">
          <div className="text-xs font-bold text-[#172b28] truncate max-w-[120px]">
            {user.full_name.split(' ')[0]}
          </div>
          <div className="text-[10px] text-[#6d8078] capitalize">{roleLabel}</div>
        </div>
        <ChevronDown size={14} className="text-[#788c84] shrink-0" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-[#dbe7df] shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-4 py-2.5 border-b border-[#edf3ee]">
            <div className="font-bold text-xs text-[#172b28] truncate">{user.full_name}</div>
            <div className="text-[11px] text-[#657972] truncate mt-0.5">{user.email}</div>
            <span
              className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleBadgeColor}`}
            >
              Verified {roleLabel}
            </span>
          </div>

          <div className="py-1 text-xs text-[#3a4d46]">
            <Link
              href={profileHref}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 hover:bg-[#f4f9f6] hover:text-[#137b65] transition"
            >
              <User size={15} /> My Profile
            </Link>
            <Link
              href={settingsHref}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 hover:bg-[#f4f9f6] hover:text-[#137b65] transition"
            >
              <Settings size={15} /> Settings
            </Link>
          </div>

          <div className="pt-1 border-t border-[#edf3ee]">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
            >
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
