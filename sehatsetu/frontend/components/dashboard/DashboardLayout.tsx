'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ShieldAlert, ArrowRight, LogOut, HeartPulse } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getRoleDashboardPath } from '@/lib/routes';
import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';
import NotificationModal from '@/components/NotificationModal';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'patient' | 'professional' | 'admin';
  customTitle?: string;
}

export default function DashboardLayout({
  children,
  role,
  customTitle,
}: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout, quickDemoLogin } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Load sidebar collapsed preference
  useEffect(() => {
    const saved = localStorage.getItem('sehatsetu_sidebar_collapsed');
    if (saved === 'true') {
      setCollapsed(true);
    }
  }, []);

  const handleToggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sehatsetu_sidebar_collapsed', String(next));
  };

  // Auto demo-login for quick evaluation if completely unauthenticated in demo environment
  useEffect(() => {
    if (!loading && !user) {
      // In demo evaluation, we can offer to sign in or auto-login with default role
      quickDemoLogin(role).catch(() => {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      });
    }
  }, [loading, user, role, pathname, quickDemoLogin, router]);

  // Loading state
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#f8faf8] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#137b65] text-white flex items-center justify-center mx-auto shadow-md animate-pulse">
            <HeartPulse size={24} />
          </div>
          <h2 className="text-sm font-bold text-[#172b28]">Loading your dashboard...</h2>
          <p className="text-xs text-[#6e827b]">Verifying server credentials and session</p>
        </div>
      </div>
    );
  }

  // Role Mismatch Protection
  if (user.role !== role) {
    const userRoleDashboard = getRoleDashboardPath(user.role);

    return (
      <div className="min-h-screen bg-[#f8faf8] flex items-center justify-center p-4">
        <div className="bg-white border border-[#dce8df] rounded-3xl p-8 max-w-md w-full text-center shadow-md space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
            <ShieldAlert size={28} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#172b28]">Access Restricted</h2>
            <p className="text-xs text-[#5e726b] mt-1.5 leading-relaxed">
              You are currently authenticated as a{' '}
              <strong className="text-[#172b28] capitalize">{user.role}</strong>, but this route requires{' '}
              <strong className="text-[#137b65] capitalize">{role}</strong> privileges.
            </p>
          </div>

          <div className="pt-2 space-y-2">
            <Link
              href={userRoleDashboard}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#137b65] text-white font-bold text-xs hover:bg-[#0e6351] transition"
            >
              Go to Your {user.role.toUpperCase()} Dashboard <ArrowRight size={14} />
            </Link>

            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-[#cadbd0] text-[#4d6059] font-semibold text-xs hover:bg-[#f2f7f4] transition"
            >
              <LogOut size={14} /> Sign In with Different Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faf8] flex text-[#172b28] antialiased">
      {/* Persistent Role-Based Left Sidebar */}
      <DashboardSidebar
        role={role}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onOpenNotifications={() => setShowNotifications(true)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          collapsed ? 'lg:pl-[76px]' : 'lg:pl-[260px]'
        }`}
      >
        {/* Compact Header */}
        <DashboardHeader
          role={role}
          customTitle={customTitle}
          onMenuToggle={() => setMobileOpen(true)}
        />

        {/* Dynamic Route Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Real-time Notifications Drawer */}
      {showNotifications && (
        <NotificationModal onClose={() => setShowNotifications(false)} />
      )}
    </div>
  );
}
