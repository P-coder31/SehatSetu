'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ArrowRight, ClipboardList, Clock, ShieldCheck, FileCheck } from 'lucide-react';

function BookingSuccessContent() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref') || 'SS-2026-CONFIRMED';
  const [reportsCount, setReportsCount] = useState<number>(0);

  useEffect(() => {
    try {
      const data = localStorage.getItem(`sehatsetu_reports_${refCode}`);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) setReportsCount(parsed.length);
      }
    } catch {
      // ignore
    }
  }, [refCode]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 rounded-3xl bg-[#eaf5ee] text-[#137b65] flex items-center justify-center mx-auto mb-5 shadow-sm">
        <CheckCircle2 size={36} strokeWidth={2.4} />
      </div>

      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#edf6f1] text-[#137b65] text-xs font-bold uppercase tracking-wider mb-2">
        <ShieldCheck size={13} /> Appointment Confirmed &amp; Slot Locked
      </span>

      <h1 className="text-3xl font-bold text-[#172b28] mb-2">
        You&apos;re all set!
      </h1>

      <p className="text-sm text-[#5f736d] max-w-md mx-auto leading-relaxed mb-6">
        Your appointment has been officially confirmed in the database. A slot has been reserved for you.
      </p>

      {/* Booking Reference Box */}
      <div className="bg-[#fbfcfa] border border-[#dce8df] rounded-2xl p-6 mb-8 text-left max-w-md mx-auto shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#e9eee9]">
          <span className="text-xs font-bold text-[#657972] uppercase tracking-wider">Booking Reference</span>
          <span className="font-mono font-bold text-sm text-[#137b65] bg-[#edf6f1] px-2.5 py-1 rounded-md border border-[#cbe4d4]">
            {refCode}
          </span>
        </div>

        <div className="pt-3 space-y-2.5 text-xs text-[#4b6058]">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-[#137b65]" />
            <span>Care Continuity active: You can report a delay if your schedule changes.</span>
          </div>
          <div className="flex items-center gap-2">
            <ClipboardList size={14} className="text-[#137b65]" />
            <span>Visit has been added to your permanent Care Passport timeline.</span>
          </div>
          {reportsCount > 0 && (
            <div className="flex items-center gap-2 text-emerald-800 bg-[#edf8f1] p-2.5 rounded-xl border border-[#cce4d4]">
              <FileCheck size={15} className="text-emerald-600 shrink-0" />
              <span><strong>{reportsCount} Past Report(s) attached</strong> and forwarded for doctor review.</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/dashboard/appointments"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#137b65] text-white font-bold text-xs shadow-sm hover:bg-[#0e6351] transition"
        >
          View in My Appointments <ArrowRight size={14} />
        </Link>
        <Link
          href="/dashboard/care-passport"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white border border-[#cadbd1] text-[#2c413b] font-bold text-xs hover:bg-[#f2f7f4] transition"
        >
          Open Care Passport
        </Link>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center text-xs text-gray-500">Loading confirmation...</div>}>
      <BookingSuccessContent />
    </Suspense>
  );
}
