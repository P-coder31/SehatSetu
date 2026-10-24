'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Stethoscope, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function ProfessionalLanding() {
  const router = useRouter();
  const { quickDemoLogin } = useAuth();

  const handleDoctorLogin = async () => {
    await quickDemoLogin('professional');
    router.push('/professional/dashboard');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-16">
      {/* Hero */}
      <div className="bg-gradient-to-tr from-[#172b28] via-[#103b31] to-[#0b5548] text-white rounded-3xl p-8 sm:p-12 shadow-lg flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="max-w-xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#82c8b7] text-xs font-bold uppercase tracking-wider">
            <Stethoscope size={14} /> SehatSetu For Practitioners &amp; Clinics
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Efficient Clinic Operations, Predictable Schedules.
          </h1>
          <p className="text-sm text-[#bedcd1] leading-relaxed">
            Eliminate double-booking headaches, manage your availability across clinics, handle patient transit delays gracefully, and maintain seamless care continuity.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleDoctorLogin}
              className="px-5 py-3 rounded-xl bg-[#38a67d] hover:bg-[#2e936d] text-white font-bold text-xs shadow-sm transition inline-flex items-center gap-2 cursor-pointer"
            >
              Sign In as Dr. Rajesh Kumar (Demo) <ArrowRight size={14} />
            </button>
            <Link
              href="/professional/onboarding"
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition"
            >
              Register New Practice
            </Link>
          </div>
        </div>

        <div className="w-full md:w-80 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-white space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#82c8b7]">Clinic Highlights</h3>
          <div className="space-y-3 text-xs text-[#e4f3ec]">
            <div className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-[#38a67d] shrink-0 mt-0.5" />
              <span>Double-booking prevention enforced in PostgreSQL.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-[#38a67d] shrink-0 mt-0.5" />
              <span>Real-time patient delay notifications with approve/decline.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-[#38a67d] shrink-0 mt-0.5" />
              <span>Automated patient care continuity passport.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
