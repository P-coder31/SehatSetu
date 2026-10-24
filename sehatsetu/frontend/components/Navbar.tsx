'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  HeartPulse, Bell, LogOut, ArrowRight, LayoutDashboard,
  Menu, X, Search, FileText, ShieldCheck, HelpCircle, User, Globe
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { isDashboardRoute } from '@/lib/routes';
import NotificationModal from './NotificationModal';
import SignInModal from './SignInModal';
import MobileBottomNav from './MobileBottomNav';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, quickDemoLogin, unreadNotifsCount } = useAuth();
  const { languageOption, openLanguageModal, t } = useLanguage();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Do not render public navbar on authenticated dashboard layouts (which have persistent sidebar)
  if (isDashboardRoute(pathname)) {
    return (
      <>
        {/* Still render mobile bottom nav for dashboard routes on phone */}
        <MobileBottomNav onOpenSignIn={() => setShowSignIn(true)} />
      </>
    );
  }

  return (
    <>
      {/* ── Top Demo Bar (Horizontally scrollable on mobile) ── */}
      <div className="bg-[#eff7f1] text-[#335e50] border-b border-[#e1ece4] text-xs py-1.5 px-3 sm:px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
          
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#137b65] animate-pulse" />
            <span className="font-semibold text-[11px] sm:text-xs">SehatSetu Prototype</span>
            <span className="text-[#6d847b] text-[10px] hidden sm:inline">· TechSpace BuildLab &apos;26</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[#647c73] text-[10px] uppercase font-bold tracking-wider hidden sm:inline">1-Click Roles:</span>
            <button
              onClick={async () => {
                await quickDemoLogin('patient');
                router.push('/dashboard');
              }}
              className="px-2 py-0.5 rounded-lg bg-white text-[#137b65] border border-[#cbe0d3] hover:bg-[#e4f3ea] font-bold text-[10px] sm:text-[11px] transition shrink-0 active:scale-95"
            >
              Patient (Asha)
            </button>
            <button
              onClick={async () => {
                await quickDemoLogin('professional');
                router.push('/professional/dashboard');
              }}
              className="px-2 py-0.5 rounded-lg bg-white text-[#137b65] border border-[#cbe0d3] hover:bg-[#e4f3ea] font-bold text-[10px] sm:text-[11px] transition shrink-0 active:scale-95"
            >
              Doctor (Dr. Rajesh)
            </button>
            <button
              onClick={async () => {
                await quickDemoLogin('admin');
                router.push('/admin/dashboard');
              }}
              className="px-2 py-0.5 rounded-lg bg-white text-[#137b65] border border-[#cbe0d3] hover:bg-[#e4f3ea] font-bold text-[10px] sm:text-[11px] transition shrink-0 active:scale-95"
            >
              Admin (CMO)
            </button>
          </div>

        </div>
      </div>

      {/* ── Main Navbar ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#edf2ee]">
        <div className="max-w-6xl mx-auto px-4 h-16 sm:h-18 flex items-center justify-between gap-4">
          
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#137b65] text-white flex items-center justify-center shadow-xs">
              <HeartPulse size={20} strokeWidth={2.4} className="sm:w-[22px] sm:h-[22px]" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-extrabold tracking-tight text-[#172b28] leading-none">
                sehat<span className="text-[#137b65]">setu</span>
              </div>
              <div className="text-[8px] sm:text-[9px] font-bold tracking-widest text-[#7a8a84] uppercase mt-0.5">
                Care, connected.
              </div>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-[13px] font-medium text-[#4b5e58]">
            <Link href="/search" className="hover:text-[#137b65] transition">
              {t('findCare')}
            </Link>
            <Link href="/dashboard/care-passport" className="hover:text-[#137b65] transition">
              {t('carePassport')}
            </Link>
            <Link href="/dashboard/health-schemes" className="hover:text-[#137b65] transition">
              {t('healthSchemes')}
            </Link>
            <Link href="/#how-it-works" className="hover:text-[#137b65] transition">
              {t('howItWorks', 'How it works')}
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* 22 Indian Languages Selector Button */}
            <button
              type="button"
              onClick={openLanguageModal}
              translate="no"
              className="notranslate inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#d2dfd8] bg-white hover:bg-[#edf6f1] text-[#137b65] text-xs font-bold transition shadow-2xs cursor-pointer"
              title="Change Language (22 Indian Languages)"
            >
              <Globe size={14} className="shrink-0 text-[#137b65]" />
              <span className="font-extrabold">{languageOption.nativeName}</span>
              {languageOption.code !== 'en' && (
                <span className="text-[10px] text-[#697d76] hidden lg:inline">({languageOption.name})</span>
              )}
            </button>
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Notification Bell */}
                <button
                  onClick={() => setShowNotifs(!showNotifs)}
                  className="relative p-2 rounded-xl text-[#556963] hover:bg-[#f2f7f3] hover:text-[#137b65] transition"
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  {unreadNotifsCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
                  )}
                </button>

                {/* Role Pill Link (Hidden on very small phones, shown in drawer/bottom nav) */}
                <Link
                  href={
                    user.role === 'admin'
                      ? '/admin/dashboard'
                      : user.role === 'professional'
                      ? '/professional/dashboard'
                      : '/dashboard'
                  }
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#eaf4ee] text-[#137b65] text-xs font-bold hover:bg-[#dcefe3] transition"
                >
                  <LayoutDashboard size={14} />
                  {user.role === 'admin'
                    ? 'Admin Portal'
                    : user.role === 'professional'
                    ? 'Clinic Portal'
                    : 'My Dashboard'}
                </Link>

                {/* Logout Button */}
                <button
                  onClick={() => {
                    logout();
                    router.push('/');
                  }}
                  title="Sign out"
                  className="p-2 text-[#6c7f78] hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                >
                  <LogOut size={17} />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSignIn(true)}
                  className="text-xs font-bold text-[#455852] hover:text-[#137b65] px-3 py-2 transition cursor-pointer"
                >
                  {t('signIn')}
                </button>
                <Link
                  href="/onboarding"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#137b65] text-white text-xs font-bold shadow-xs hover:bg-[#0e6351] transition"
                >
                  Get Started <ArrowRight size={14} />
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Toggle Button (md:hidden) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-[#29423b] hover:bg-[#edf4f0] transition"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

        </div>

        {/* ── Mobile Slide-Down Menu Drawer (md:hidden) ── */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#e5ebe7] px-4 pt-3 pb-5 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-200">
            <nav className="space-y-1 text-sm font-semibold text-[#2b423b]">
              <Link
                href="/search"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#f2f7f4] transition"
              >
                <Search size={17} className="text-[#137b65]" />
                <span>Find Care &amp; Doctors</span>
              </Link>
              <Link
                href="/dashboard/care-passport"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#f2f7f4] transition"
              >
                <FileText size={17} className="text-[#137b65]" />
                <span>Digital Care Passport</span>
              </Link>
              <Link
                href="/dashboard/health-schemes"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#f2f7f4] transition"
              >
                <ShieldCheck size={17} className="text-[#137b65]" />
                <span>Government Health Schemes</span>
              </Link>
              <Link
                href="/#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#f2f7f4] transition"
              >
                <HelpCircle size={17} className="text-[#137b65]" />
                <span>How It Works</span>
              </Link>
            </nav>

            {/* Mobile Language Switcher (22 Indian Languages) */}
            <div className="pt-2 border-t border-[#edf2ee]">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openLanguageModal();
                }}
                translate="no"
                className="notranslate w-full py-2.5 px-3 rounded-xl border border-[#cbe0d3] bg-[#f8faf8] text-[#137b65] text-xs font-bold flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Globe size={16} />
                  <span>Language / भाषा: <strong className="text-[#172b28]">{languageOption.nativeName} {languageOption.code !== 'en' ? `(${languageOption.name})` : ''}</strong></span>
                </span>
                <span className="text-[10px] text-[#137b65] uppercase">22 Languages &rarr;</span>
              </button>
            </div>

            {/* Mobile Auth Actions */}
            {!user ? (
              <div className="pt-2 border-t border-[#edf2ee] grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowSignIn(true);
                  }}
                  className="w-full py-2.5 rounded-xl border border-[#cce0d4] text-[#137b65] font-bold text-xs hover:bg-[#edf7f2] transition text-center"
                >
                  Sign In
                </button>
                <Link
                  href="/onboarding"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-[#137b65] text-white font-bold text-xs hover:bg-[#0c5949] transition text-center shadow-xs"
                >
                  Get Started
                </Link>
              </div>
            ) : (
              <div className="pt-2 border-t border-[#edf2ee] space-y-2">
                <Link
                  href={
                    user.role === 'admin'
                      ? '/admin/dashboard'
                      : user.role === 'professional'
                      ? '/professional/dashboard'
                      : '/dashboard'
                  }
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#137b65] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs"
                >
                  <LayoutDashboard size={15} />
                  <span>Go to {user.role === 'professional' ? 'Doctor Portal' : user.role === 'admin' ? 'Admin Portal' : 'Patient Dashboard'}</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* ── Instant Fast Sign In Modal ── */}
      <SignInModal isOpen={showSignIn} onClose={() => setShowSignIn(false)} />

      {/* ── Notifications Drawer Modal ── */}
      {showNotifs && (
        <NotificationModal onClose={() => setShowNotifs(false)} />
      )}

      {/* ── App-Like Mobile Bottom Navigation Bar (md:hidden) ── */}
      <MobileBottomNav onOpenSignIn={() => setShowSignIn(true)} />
    </>
  );
}
