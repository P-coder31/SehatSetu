'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User, Stethoscope, ShieldCheck, ArrowRight,
  Sparkles, Lock, CheckCircle2, HeartPulse, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function OnboardingPage() {
  const router = useRouter();
  const { quickDemoLogin } = useAuth();

  const handleDemoSignIn = async (role: 'patient' | 'professional' | 'admin') => {
    const user = await quickDemoLogin(role);
    if (user.role === 'admin') router.push('/admin/dashboard');
    else if (user.role === 'professional') router.push('/professional/dashboard');
    else router.push('/dashboard');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 md:py-16 space-y-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eaf5ee] text-[#137b65] text-xs font-bold uppercase tracking-wider">
          <HeartPulse size={14} /> SehatSetu Onboarding
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#172b28]">
          How would you like to get started?
        </h1>
        <p className="text-sm sm:text-base text-[#566c64] leading-relaxed">
          Select your role to register or sign in. SehatSetu provides tailored portals for patients, healthcare professionals, and state administrators.
        </p>
      </div>

      {/* Role Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* 1. Patient Card */}
        <div className="bg-white border-2 border-[#137b65]/20 hover:border-[#137b65] rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-md transition flex flex-col justify-between group">
          <div className="space-y-4">
            <div className="w-13 h-13 rounded-2xl bg-[#eaf5ee] text-[#137b65] flex items-center justify-center font-bold shadow-xs">
              <User size={26} />
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#137b65] bg-[#edf7f2] px-2 py-0.5 rounded">
                Individual &amp; Family
              </span>
              <h2 className="text-xl font-bold text-[#172b28] mt-2">
                Patient / Customer
              </h2>
              <p className="text-xs text-[#5d736b] mt-1.5 leading-relaxed">
                Discover verified doctors and clinics, book guaranteed appointment slots, report travel delays without losing your turn, and track your lifelong Care Passport.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#edf3ee] text-xs text-[#465a53]">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-[#137b65] shrink-0" />
                <span>FairSlot anti-hoarding guarantee (max 2 active bookings)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-[#137b65] shrink-0" />
                <span>Interactive Care Continuity timeline</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-[#137b65] shrink-0" />
                <span>Bilingual government scheme guides (English / हिन्दी)</span>
              </div>
            </div>
          </div>

          <div className="pt-6 space-y-2.5">
            <Link
              href="/register?role=patient"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#137b65] text-white font-bold text-xs shadow-sm hover:bg-[#0e6351] transition"
            >
              Get Started as Patient <ArrowRight size={15} />
            </Link>
            <Link
              href="/login?role=patient"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#f8faf8] border border-[#d9e5dc] text-[#334640] hover:bg-[#eaf4ee] font-semibold text-xs transition"
            >
              Patient Sign In <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {/* 2. Healthcare Professional Card */}
        <div className="bg-white border-2 border-[#dbe7df] hover:border-[#137b65] rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-md transition flex flex-col justify-between group">
          <div className="space-y-4">
            <div className="w-13 h-13 rounded-2xl bg-[#e3f0ed] text-[#0f5e4e] flex items-center justify-center font-bold shadow-xs">
              <Stethoscope size={26} />
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0f5e4e] bg-[#e4f2ee] px-2 py-0.5 rounded">
                Practitioners &amp; Clinics
              </span>
              <h2 className="text-xl font-bold text-[#172b28] mt-2">
                Healthcare Professional
              </h2>
              <p className="text-xs text-[#5d736b] mt-1.5 leading-relaxed">
                Manage your consultation calendar, set working hours and blocked dates, receive live patient delay notifications, and propose alternative slots seamlessly.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#edf3ee] text-xs text-[#465a53]">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-[#0f5e4e] shrink-0" />
                <span>Database-enforced double-booking prevention</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-[#0f5e4e] shrink-0" />
                <span>Live delay approval &amp; alternative proposals</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-[#0f5e4e] shrink-0" />
                <span>Weekly schedule &amp; emergency blocked dates</span>
              </div>
            </div>
          </div>

          <div className="pt-6 space-y-2.5">
            <Link
              href="/professional/onboarding"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#0f5e4e] text-white font-bold text-xs shadow-sm hover:bg-[#0b483b] transition"
            >
              Join as Practitioner <ArrowRight size={15} />
            </Link>
            <Link
              href="/login?role=professional"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#f8faf8] border border-[#d9e5dc] text-[#334640] hover:bg-[#eaf4ee] font-semibold text-xs transition"
            >
              Doctor Sign In <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {/* 3. Administrator Card (Authorized Only) */}
        <div className="bg-[#fbfcfa] border border-[#dce6df] rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-4">
            <div className="w-13 h-13 rounded-2xl bg-[#172b28] text-white flex items-center justify-center font-bold shadow-xs">
              <ShieldCheck size={26} />
            </div>

            <div>
              <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-200/70 px-2 py-0.5 rounded">
                <Lock size={11} /> Authorized Personnel Only
              </div>
              <h2 className="text-xl font-bold text-[#172b28] mt-2">
                State Health Admin
              </h2>
              <p className="text-xs text-[#5d736b] mt-1.5 leading-relaxed">
                Supervisory governance for Chief Medical Officers and authorized department officials. Public self-registration is restricted.
              </p>
            </div>

            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
              <strong>Official Provisioning:</strong> Administrative accounts are created strictly via certified departmental provisioning. To access, sign in with issued credentials.
            </div>

            <div className="space-y-2 text-xs text-[#465a53]">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-[#172b28] shrink-0" />
                <span>Doctor credential verification queue</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-[#172b28] shrink-0" />
                <span>Real-time aggregate platform SQL metrics</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-[#172b28] shrink-0" />
                <span>Tamper-evident administrative audit trail</span>
              </div>
            </div>
          </div>

          <div className="pt-6 space-y-2.5">
            <Link
              href="/login?role=admin"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#172b28] text-white font-bold text-xs shadow-sm hover:bg-black transition"
            >
              Official Admin Sign In <ArrowRight size={15} />
            </Link>
            <p className="text-center text-[10px] text-[#788a84]">
              Public registration is not available for administrators
            </p>
          </div>
        </div>
      </div>

      {/* Demo Mode Fast Evaluation Strip */}
      <div className="bg-[#f2f8f4] border border-[#d2e4d8] rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#137b65]">
            <Sparkles size={14} /> Demo Mode — Rapid Evaluation
          </span>
          <p className="text-xs text-[#4b6058] mt-0.5">
            Evaluate any portal instantly using pre-seeded test credentials without creating a new account.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleDemoSignIn('patient')}
            className="px-3 py-2 rounded-xl bg-white text-[#137b65] border border-[#c1d9cb] hover:bg-[#e4f3ea] font-bold text-xs transition shadow-2xs"
          >
            Sign In as Patient (Asha)
          </button>
          <button
            onClick={() => handleDemoSignIn('professional')}
            className="px-3 py-2 rounded-xl bg-white text-[#137b65] border border-[#c1d9cb] hover:bg-[#e4f3ea] font-bold text-xs transition shadow-2xs"
          >
            Sign In as Doctor (Dr. Rajesh)
          </button>
          <button
            onClick={() => handleDemoSignIn('admin')}
            className="px-3 py-2 rounded-xl bg-white text-[#172b28] border border-[#c1d9cb] hover:bg-[#e4f3ea] font-bold text-xs transition shadow-2xs"
          >
            Sign In as Admin (CMO)
          </button>
        </div>
      </div>
    </div>
  );
}
