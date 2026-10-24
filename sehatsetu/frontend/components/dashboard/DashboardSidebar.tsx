'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  HeartPulse, LayoutDashboard, Search, CalendarCheck, ClipboardList,
  BellRing, Languages, User, Settings, LogOut, ChevronLeft, ChevronRight,
  Stethoscope, Calendar, Clock, Bell, Users, ShieldCheck, Building2,
  FileBarChart, X, Globe
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import SidebarNavItem from './SidebarNavItem';

interface DashboardSidebarProps {
  role: 'patient' | 'professional' | 'admin';
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenNotifications: () => void;
}

export default function DashboardSidebar({
  role,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  onOpenNotifications,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, unreadNotifsCount } = useAuth();
  const { languageOption, openLanguageModal } = useLanguage();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard' || href === '/professional/dashboard' || href === '/admin/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden animate-in fade-in duration-200"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white border-r border-[#e5ede7] flex flex-col transition-all duration-300 ease-in-out ${
          collapsed ? 'lg:w-[76px]' : 'lg:w-[260px]'
        } ${
          mobileOpen ? 'translate-x-0 w-[270px]' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand / Logo Header */}
        <div className="h-16 border-b border-[#e9f0ea] flex items-center justify-between px-4 shrink-0">
          <Link
            href="/"
            className={`flex items-center gap-2.5 overflow-hidden transition-all ${
              collapsed ? 'justify-center w-full' : ''
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-[#137b65] text-white flex items-center justify-center shrink-0 shadow-xs">
              <HeartPulse size={20} strokeWidth={2.4} />
            </div>
            {!collapsed && (
              <div className="leading-none">
                <div className="text-base font-bold tracking-tight text-[#172b28]">
                  sehat<span className="text-[#137b65]">setu</span>
                </div>
                <div className="text-[8px] font-bold tracking-widest text-[#72857e] uppercase mt-0.5">
                  Care, connected.
                </div>
              </div>
            )}
          </Link>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-[#5f746d] hover:bg-[#edf5f0] rounded-lg"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-[#697f77] hover:bg-[#edf5f0] hover:text-[#137b65] transition"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
          {/* PATIENT SIDEBAR */}
          {role === 'patient' && (
            <div className="space-y-1">
              {!collapsed && (
                <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#738880]">
                  Overview
                </div>
              )}
              <SidebarNavItem
                href="/dashboard"
                icon={LayoutDashboard}
                label="Dashboard"
                active={isActive('/dashboard')}
                collapsed={collapsed}
                onClick={onCloseMobile}
              />

              {/* Prominent Find Care for Patient */}
              <SidebarNavItem
                href="/search"
                icon={Search}
                label="Find Care"
                active={isActive('/search')}
                collapsed={collapsed}
                onClick={onCloseMobile}
                isPrimaryAction={true}
              />

              <SidebarNavItem
                href="/dashboard/appointments"
                icon={CalendarCheck}
                label="My Appointments"
                active={isActive('/dashboard/appointments')}
                collapsed={collapsed}
                onClick={onCloseMobile}
              />

              <SidebarNavItem
                href="/dashboard/care-passport"
                icon={ClipboardList}
                label="My Care Passport"
                active={pathname === '/dashboard/care-passport'}
                collapsed={collapsed}
                onClick={onCloseMobile}
              />

              <SidebarNavItem
                href="/dashboard/reminders"
                icon={BellRing}
                label="Follow-up Reminders"
                active={pathname === '/dashboard/reminders'}
                collapsed={collapsed}
                onClick={onCloseMobile}
              />

              <SidebarNavItem
                href="/dashboard/health-schemes"
                icon={Languages}
                label="Health Schemes"
                active={isActive('/dashboard/health-schemes')}
                collapsed={collapsed}
                onClick={onCloseMobile}
              />

              <SidebarNavItem
                icon={Bell}
                label="Notifications"
                active={false}
                badge={unreadNotifsCount > 0 ? unreadNotifsCount : undefined}
                badgeColor="amber"
                collapsed={collapsed}
                onClick={() => {
                  onOpenNotifications();
                  onCloseMobile();
                }}
              />

              <SidebarNavItem
                href="/dashboard/profile"
                icon={User}
                label="My Profile"
                active={isActive('/dashboard/profile')}
                collapsed={collapsed}
                onClick={onCloseMobile}
              />

              <SidebarNavItem
                href="/dashboard/settings"
                icon={Settings}
                label="Settings"
                active={isActive('/dashboard/settings')}
                collapsed={collapsed}
                onClick={onCloseMobile}
              />
            </div>
          )}

          {/* HEALTHCARE PROFESSIONAL SIDEBAR (NO Find Care!) */}
          {role === 'professional' && (
            <div className="space-y-1">
              {!collapsed && (
                <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#738880]">
                  Clinic Operations
                </div>
              )}
              <SidebarNavItem
                href="/professional/dashboard"
                icon={LayoutDashboard}
                label="Dashboard"
                active={isActive('/professional/dashboard')}
                collapsed={collapsed}
                onClick={onCloseMobile}
              />

              <SidebarNavItem
                href="/professional/appointments"
                icon={CalendarCheck}
                label="My Appointments"
                active={pathname === '/professional/appointments'}
                collapsed={collapsed}
                onClick={onCloseMobile}
              />

              <SidebarNavItem
                href="/professional/calendar"
                icon={Calendar}
                label="Calendar"
                active={pathname === '/professional/calendar'}
                collapsed={collapsed}
                onClick={onCloseMobile}
              />

              <SidebarNavItem
                href="/professional/availability"
                icon={Clock}
                label="Availability"
                active={isActive('/professional/availability')}
                collapsed={collapsed}
                onClick={onCloseMobile}
              />

              <SidebarNavItem
                href="/professional/profile"
                icon={User}
                label="My Profile"
                active={isActive('/professional/profile')}
                collapsed={collapsed}
                onClick={onCloseMobile}
              />

              <SidebarNavItem
                icon={Bell}
                label="Notifications"
                active={false}
                badge={unreadNotifsCount > 0 ? unreadNotifsCount : undefined}
                badgeColor="amber"
                collapsed={collapsed}
                onClick={() => {
                  onOpenNotifications();
                  onCloseMobile();
                }}
              />

              <SidebarNavItem
                href="/professional/settings"
                icon={Settings}
                label="Settings"
                active={isActive('/professional/settings')}
                collapsed={collapsed}
                onClick={onCloseMobile}
              />
            </div>
          )}

          {/* ADMIN SIDEBAR (NO Find Care!) */}
          {role === 'admin' && (
            <div className="space-y-1">
              {!collapsed && (
                <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#738880]">
                  State Administration
                </div>
              )}
              <SidebarNavItem
                href="/admin/dashboard"
                icon={LayoutDashboard}
                label="Dashboard"
                active={isActive('/admin/dashboard')}
                collapsed={collapsed}
                onClick={onCloseMobile}
              />

              <SidebarNavItem
                href="/admin/users"
                icon={Users}
                label="Users"
                active={isActive('/admin/users')}
                collapsed={collapsed}
                onClick={onCloseMobile}
              />

              <SidebarNavItem
                href="/admin/verifications"
                icon={Stethoscope}
                label="Healthcare Professionals"
                active={pathname === '/admin/verifications'}
                collapsed={collapsed}
                onClick={onCloseMobile}
              />

              <SidebarNavItem
                href="/admin/verifications"
                icon={ShieldCheck}
                label="Professional Verification"
                active={false}
                collapsed={collapsed}
                onClick={onCloseMobile}
              />

              <SidebarNavItem
                href="/admin/dashboard#facilities"
                icon={Building2}
                label="Facilities"
                active={false}
                collapsed={collapsed}
                onClick={onCloseMobile}
              />

              <SidebarNavItem
                href="/admin/appointments"
                icon={CalendarCheck}
                label="Appointments"
                active={isActive('/admin/appointments')}
                collapsed={collapsed}
                onClick={onCloseMobile}
              />

              <SidebarNavItem
                href="/dashboard/health-schemes"
                icon={Languages}
                label="Health Schemes"
                active={isActive('/dashboard/health-schemes')}
                collapsed={collapsed}
                onClick={onCloseMobile}
              />

              <SidebarNavItem
                href="/admin/reports"
                icon={FileBarChart}
                label="Reports & Analytics"
                active={isActive('/admin/reports')}
                collapsed={collapsed}
                onClick={onCloseMobile}
              />

              <SidebarNavItem
                href="/admin/reports"
                icon={ShieldCheck}
                label="Audit Logs"
                active={false}
                collapsed={collapsed}
                onClick={onCloseMobile}
              />

              <SidebarNavItem
                href="/admin/settings"
                icon={Settings}
                label="Settings"
                active={isActive('/admin/settings')}
                collapsed={collapsed}
                onClick={onCloseMobile}
              />
            </div>
          )}
        </div>

        {/* Language Switcher (22 Indian Languages) */}
        <div className="px-3 pb-2 pt-1 shrink-0" translate="no">
          <button
            type="button"
            onClick={openLanguageModal}
            translate="no"
            className={`notranslate w-full py-2 px-2.5 rounded-xl border border-[#d2dfd8] bg-white hover:bg-[#edf6f1] text-[#137b65] text-xs font-bold transition flex items-center shadow-2xs cursor-pointer ${
              collapsed ? 'justify-center' : 'justify-between'
            }`}
            title="Switch Language (22 Indian Languages)"
          >
            <span className="flex items-center gap-1.5 truncate">
              <Globe size={15} className="shrink-0 text-[#137b65]" />
              {!collapsed && <span>{languageOption.nativeName}</span>}
            </span>
            {!collapsed && languageOption.code !== 'en' && <span className="text-[10px] text-[#697d76]">({languageOption.name})</span>}
          </button>
        </div>

        {/* User Pill & Sign Out Action at Bottom */}
        <div className="p-3 border-t border-[#e8f0e9] shrink-0">
          {!collapsed ? (
            <div className="p-2.5 rounded-2xl bg-[#f7faf8] border border-[#e2ece5] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#137b65] text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
                </div>
                <div className="min-w-0 leading-tight">
                  <div className="text-xs font-bold text-[#172b28] truncate">
                    {user?.full_name || 'User'}
                  </div>
                  <div className="text-[10px] text-[#6d8078] capitalize truncate">
                    {role}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 text-[#6c8078] hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-2.5 text-[#6c8078] hover:text-red-600 hover:bg-red-50 rounded-xl transition"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
