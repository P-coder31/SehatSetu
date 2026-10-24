'use client';

import React, { useState } from 'react';
import {
  ShieldCheck, QrCode, Download, Printer, Trash2,
  CheckCircle2, Building2, User, Sparkles, AlertTriangle
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

export interface AbhaCardData {
  is_verified: boolean;
  patient_name?: string;
  email?: string;
  phone?: string;
  gender?: string;
  dob?: string;
  masked_aadhaar?: string;
  abha_number?: string;
  abha_address?: string;
  state?: string;
  district?: string;
  pincode?: string;
  verified_at?: string;
  qr_code_payload?: string;
}

interface AbhaDigitalCardProps {
  cardData: AbhaCardData;
  onUnlink?: () => void;
  onLinkClick?: () => void;
}

export default function AbhaDigitalCard({
  cardData,
  onUnlink,
  onLinkClick
}: AbhaDigitalCardProps) {
  const [unlinking, setUnlinking] = useState(false);
  const [showConfirmUnlink, setShowConfirmUnlink] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleUnlink = async () => {
    setUnlinking(true);
    try {
      await apiRequest('/care-continuity/aadhaar/unlink', { method: 'DELETE' });
      setShowConfirmUnlink(false);
      if (onUnlink) onUnlink();
    } catch (err: any) {
      alert(err.message || 'Failed to unlink Aadhaar');
    } finally {
      setUnlinking(false);
    }
  };

  // If patient has NOT linked their Aadhaar yet:
  if (!cardData || !cardData.is_verified) {
    return (
      <div className="bg-gradient-to-br from-[#f2f8f4] via-white to-[#e8f4ec] border border-[#cbe1d3] rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#137b65] text-white flex items-center justify-center shrink-0 shadow-md">
              <ShieldCheck size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#172b28]">
                  Link Your Aadhaar / ABHA Card
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  Not Linked
                </span>
              </div>
              <p className="text-xs text-[#52665e] mt-1 max-w-lg leading-relaxed">
                Connect your 12-digit Aadhaar via instant OTP to generate your official <strong>ABHA Digital Health ID</strong>. Unlock zero-queue OPD entry, paperless records, and 100% cashless treatment at Sonipat Civil Hospital and empaneled clinics.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLinkClick}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#137b65] hover:bg-[#0c5949] text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 shrink-0 cursor-pointer hover:scale-102 active:scale-95"
          >
            <ShieldCheck size={16} />
            <span>Verify with Aadhaar OTP</span>
          </button>
        </div>
      </div>
    );
  }

  // When patient is VERIFIED: Render the official Digital Health ID Card
  return (
    <div className="space-y-4">
      {/* ── DIGITAL CARD CONTAINER ── */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-[#137b65]/30 bg-gradient-to-b from-[#f9fdfa] via-white to-[#f0f7f2] shadow-xl max-w-2xl mx-auto">
        
        {/* Tricolor Government Strip */}
        <div className="h-2 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

        {/* Card Header (National Health Authority Branding) */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#0f6855] to-[#0a493c] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Ashoka / Emblem Stylized SVG */}
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center border border-white/30 text-white font-serif font-black text-xs">
              🇮🇳
            </div>
            <div>
              <div className="font-extrabold text-xs tracking-wide leading-tight">
                राष्ट्रीय स्वास्थ्य प्राधिकरण · National Health Authority
              </div>
              <div className="text-[10px] text-emerald-200 font-semibold tracking-wider uppercase">
                Ayushman Bharat Digital Mission (ABDM)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/40 text-[10px] font-bold text-white">
            <CheckCircle2 size={12} className="text-emerald-300" />
            <span>ABDM Verified</span>
          </div>
        </div>

        {/* Card Main Body */}
        <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-5 items-center">
          {/* Left: Patient Details */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#137b65] to-[#0c5949] text-white flex items-center justify-center font-extrabold text-xl shadow-md border-2 border-white">
                {cardData.patient_name ? cardData.patient_name[0] : 'P'}
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-black text-[#172b28] leading-tight">
                  {cardData.patient_name || 'Asha Patel'}
                </h4>
                <div className="text-xs text-[#556960] mt-0.5 flex items-center gap-2">
                  <span>Gender: <strong>{cardData.gender || 'Female'}</strong></span>
                  <span>•</span>
                  <span>DOB: <strong>{cardData.dob || '1992-05-14'}</strong></span>
                </div>
              </div>
            </div>

            {/* ABHA Number & Address Strip */}
            <div className="p-3 rounded-2xl bg-[#eaf5ee] border border-[#c4e4d0] space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-[#137b65] uppercase tracking-wider">ABHA Number:</span>
                <span className="font-semibold text-emerald-800">14-Digit Health ID</span>
              </div>
              <div className="font-mono text-base sm:text-lg font-black text-[#172b28] tracking-widest">
                {cardData.abha_number || '91-4589-2134-8921'}
              </div>

              <div className="pt-1.5 border-t border-[#d2edd9] flex items-center justify-between text-[11px] text-[#425d52]">
                <span>ABHA Address (PHR):</span>
                <span className="font-bold text-[#137b65] font-mono">
                  {cardData.abha_address || 'ashapatel@abdm'}
                </span>
              </div>
            </div>

            {/* Masked Aadhaar & Location */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="bg-white p-2 rounded-xl border border-[#dfebe3]">
                <span className="text-[10px] text-[#70847b] block font-semibold">Masked Aadhaar (UIDAI):</span>
                <span className="font-mono font-bold text-[#172b28]">
                  {cardData.masked_aadhaar || 'XXXX XXXX 8921'}
                </span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-[#dfebe3]">
                <span className="text-[10px] text-[#70847b] block font-semibold">Jurisdiction / State:</span>
                <span className="font-bold text-[#172b28] truncate block">
                  {cardData.district || 'Sonipat'}, {cardData.state || 'Haryana'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: ABDM Fast-Track Scan & Share QR Code */}
          <div className="flex flex-col items-center justify-center p-3 bg-white border border-[#d6e5db] rounded-2xl shadow-xs shrink-0 mx-auto sm:mx-0 w-36">
            {/* Stylized QR representation */}
            <div className="w-28 h-28 bg-[#f5fbf7] border border-[#cbe1d3] rounded-xl flex flex-col items-center justify-center p-2 text-center relative overflow-hidden group">
              <QrCode size={80} className="text-[#137b65]" />
              <div className="absolute inset-0 bg-[#137b65]/5 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <span className="text-[9px] font-extrabold bg-[#137b65] text-white px-1.5 py-0.5 rounded">Scan & Share</span>
              </div>
            </div>
            <span className="text-[9px] font-bold text-[#137b65] mt-1.5 uppercase tracking-wider text-center">
              Scan for OPD Token
            </span>
          </div>
        </div>

        {/* Card Footer Strip */}
        <div className="px-5 py-2.5 bg-[#f6faf8] border-t border-[#e2eee6] flex items-center justify-between text-[10px] text-[#5c7268]">
          <span className="flex items-center gap-1 font-semibold">
            <ShieldCheck size={12} className="text-[#137b65]" />
            Official ABDM Electronic Health Record Card
          </span>
          <span>Verified At: {cardData.verified_at ? new Date(cardData.verified_at).toLocaleDateString() : 'Active'}</span>
        </div>
      </div>

      {/* ── CARD ACTION BUTTONS ── */}
      <div className="flex items-center justify-between gap-3 max-w-2xl mx-auto flex-wrap text-xs pt-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#f2f8f4] text-[#172b28] border border-[#cbe1d3] font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Printer size={13} className="text-[#137b65]" />
            <span>Print Digital Card</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#f2f8f4] text-[#172b28] border border-[#cbe1d3] font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Download size={13} className="text-[#137b65]" />
            <span>Download ABHA</span>
          </button>
        </div>

        {/* Unlink Button */}
        <div>
          {!showConfirmUnlink ? (
            <button
              type="button"
              onClick={() => setShowConfirmUnlink(true)}
              className="text-[#985858] hover:text-red-700 font-semibold text-xs flex items-center gap-1 p-1 hover:underline cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Unlink Aadhaar</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-red-50 p-1.5 rounded-xl border border-red-200">
              <span className="text-[11px] text-red-900 font-medium">Unlink Aadhaar?</span>
              <button
                type="button"
                disabled={unlinking}
                onClick={handleUnlink}
                className="px-2 py-0.8 rounded-lg bg-red-600 text-white font-bold text-[10px] hover:bg-red-700"
              >
                {unlinking ? 'Unlinking...' : 'Yes, Unlink'}
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmUnlink(false)}
                className="px-2 py-0.8 rounded-lg bg-white text-gray-700 border border-gray-300 font-bold text-[10px]"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
