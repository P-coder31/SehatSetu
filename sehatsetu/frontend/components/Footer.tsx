'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HeartPulse, PhoneCall, ExternalLink, ShieldCheck } from 'lucide-react';
import { isDashboardRoute } from '@/lib/routes';

export default function Footer() {
  const pathname = usePathname();

  if (isDashboardRoute(pathname)) {
    return null;
  }

  return (
    <footer className="bg-[#fbfcfa] border-t border-[#e6eee8] pt-14 pb-12 mt-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-9 pb-12 border-b border-[#e9efe9]">
          {/* Brand Col */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#137b65] text-white flex items-center justify-center">
                <HeartPulse size={18} />
              </div>
              <span className="text-lg font-bold text-[#172b28]">
                sehat<span className="text-[#137b65]">setu</span>
              </span>
            </Link>
            <p className="text-xs text-[#677973] leading-relaxed mb-4">
              Care shouldn&apos;t stop at the appointment. Connecting discovery, booking, live delay handling, and follow-through.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#eaf4ee] text-[#137b65] text-[11px] font-semibold">
              <ShieldCheck size={13} /> Official Sources Linked
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-[#172b28] uppercase tracking-wider mb-3">Explore</h4>
            <ul className="space-y-2 text-xs text-[#52645e]">
              <li><Link href="/search" className="hover:text-[#137b65] transition">Find Nearby Doctors</Link></li>
              <li><Link href="/dashboard/care-passport" className="hover:text-[#137b65] transition">My Care Passport</Link></li>
              <li><Link href="/dashboard/health-schemes" className="hover:text-[#137b65] transition">Government Health Schemes</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-[#137b65] transition">Care Continuity Loop</Link></li>
            </ul>
          </div>

          {/* Portals */}
          <div>
            <h4 className="text-xs font-bold text-[#172b28] uppercase tracking-wider mb-3">Portals</h4>
            <ul className="space-y-2 text-xs text-[#52645e]">
              <li><Link href="/dashboard" className="hover:text-[#137b65] transition">Patient Dashboard</Link></li>
              <li><Link href="/professional/dashboard" className="hover:text-[#137b65] transition">Professional / Clinic Portal</Link></li>
              <li><Link href="/professional/onboarding" className="hover:text-[#137b65] transition">Doctor Registration &amp; Onboarding</Link></li>
              <li><Link href="/admin/dashboard" className="hover:text-[#137b65] transition">Administrative Overview</Link></li>
            </ul>
          </div>

          {/* Emergency & Official Info */}
          <div className="bg-[#f0f6f2] p-4 rounded-xl border border-[#dfeae2]">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-xs mb-1">
              <PhoneCall size={14} /> Medical Emergencies
            </div>
            <p className="text-[11px] text-[#556963] leading-relaxed mb-3">
              SehatSetu is not an emergency dispatch provider. In case of an emergency, call national hotlines immediately:
            </p>
            <div className="flex items-center gap-3">
              <a href="tel:112" className="px-3 py-1.5 rounded-lg bg-white border border-[#cbe0d3] text-[#172b28] font-bold text-xs hover:bg-[#e4f3ea] transition">
                National: 112
              </a>
              <a href="tel:108" className="px-3 py-1.5 rounded-lg bg-white border border-[#cbe0d3] text-[#172b28] font-bold text-xs hover:bg-[#e4f3ea] transition">
                Ambulance: 108
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#7d8f88]">
          <p>© 2026 SehatSetu · Built for TechSpace BuildLab &apos;26 by Team Code Storm.</p>
          <div className="flex items-center gap-4">
            <a href="https://pmjay.gov.in" target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
              NHA PM-JAY <ExternalLink size={10} />
            </a>
            <a href="https://esanjeevani.mohfw.gov.in" target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
              e-Sanjeevani <ExternalLink size={10} />
            </a>
            <a href="https://nhm.gov.in" target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
              NHM India <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
