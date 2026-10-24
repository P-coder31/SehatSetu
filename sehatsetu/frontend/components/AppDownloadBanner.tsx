'use client';

import React from 'react';
import Link from 'next/link';
import { Smartphone, Download, ShieldCheck, QrCode, CheckCircle2 } from 'lucide-react';

export default function AppDownloadBanner() {
  return (
    <section className="max-w-6xl mx-auto px-4" id="get-app">
      <div className="bg-gradient-to-br from-[#172b28] via-[#103b30] to-[#0a2720] rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
        {/* Ambient radial glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#137b65]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-64 h-64 bg-[#fbb417]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#7dd3b9] text-xs font-bold uppercase tracking-wider">
              <Smartphone size={14} /> Care In Your Pocket
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Get the SehatSetu app for seamless care on the go
            </h2>

            <p className="text-sm text-[#bedad0] leading-relaxed max-w-xl">
              Hold appointment slots in traffic with 1-tap FairSlot™ delay reporting, save digital clinic tokens, and access source-backed government health schemes in 22 Indian languages.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs font-medium text-[#d8ece4]">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#7dd3b9] shrink-0" />
                <span>Real-time OPD queue status</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#7dd3b9] shrink-0" />
                <span>100% offline appointment passes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#7dd3b9] shrink-0" />
                <span>Video teleconsultations from home</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#7dd3b9] shrink-0" />
                <span>Ayushman Bharat &amp; ABHA ready</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-4">
              <Link
                href="/search"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#7dd3b9] text-[#172b28] font-bold text-xs hover:bg-[#6ec2a9] transition shadow-md"
              >
                <Download size={15} /> Open Mobile Web App
              </Link>
              <div className="text-[11px] text-[#93b6a9] flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                <ShieldCheck size={14} className="text-[#7dd3b9]" />
                <span>Capacitor Android Native Ready</span>
              </div>
            </div>
          </div>

          {/* Right Visual Phone Mockup */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <div className="relative w-64 bg-white rounded-3xl p-3 shadow-2xl border-4 border-[#33534b] text-[#172b28]">
              {/* Phone Speaker Notch */}
              <div className="w-20 h-3 bg-[#172b28] rounded-full mx-auto mb-3" />

              {/* In-app mockup screen */}
              <div className="space-y-2.5 text-left text-xs bg-[#fbfdfc] p-3 rounded-2xl border border-[#edf3ee]">
                <div className="flex items-center justify-between pb-2 border-b border-[#e6eee8]">
                  <span className="font-extrabold text-[#172b28] text-[13px]">SehatSetu Mobile</span>
                  <span className="text-[9px] font-bold bg-[#eaf7ef] text-[#137b65] px-1.5 py-0.5 rounded">Active</span>
                </div>

                <div className="bg-[#eaf7ef] p-2.5 rounded-xl border border-[#d2eadc]">
                  <span className="text-[9px] font-bold uppercase text-[#137b65] block">Today&apos;s Booking</span>
                  <span className="text-xs font-bold text-[#172b28] block">Dr. Rajesh Kumar</span>
                  <span className="text-[10px] text-[#486358]">Sonipat Civil Hospital · 10:30 AM</span>
                </div>

                <div className="bg-[#fff9eb] p-2.5 rounded-xl border border-[#f4ead5] text-[10px] text-[#785816]">
                  <strong>Transit Delay Reported:</strong> Slot held till 10:45 AM. Queue position locked.
                </div>

                <div className="text-center pt-1">
                  <div className="w-full py-1.5 rounded-lg bg-[#137b65] text-white font-bold text-[10px]">
                    View Digital Pass &amp; QR
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
