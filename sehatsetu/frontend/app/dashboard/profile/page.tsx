'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, ShieldCheck, HeartPulse, User } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import AbhaDigitalCard, { AbhaCardData } from '@/components/AbhaDigitalCard';
import AadhaarVerificationModal from '@/components/AadhaarVerificationModal';

export default function ProfilePage() {
  const { user } = useAuth();
  const [cardData, setCardData] = useState<AbhaCardData | null>(null);
  const [loadingCard, setLoadingCard] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCardData = async () => {
    try {
      setLoadingCard(true);
      const data = await apiRequest<AbhaCardData>('/care-continuity/aadhaar-card');
      setCardData(data);
    } catch {
      setCardData({ is_verified: false });
    } finally {
      setLoadingCard(false);
    }
  };

  useEffect(() => {
    fetchCardData();
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* ── 1. PAGE HEADER ── */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eaf4ee] text-[#137b65] text-xs font-bold uppercase tracking-wider mb-2">
          <HeartPulse size={14} /> Patient Identity & Credentials
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172b28]">
          My Profile & Health Identity
        </h1>
        <p className="text-xs sm:text-sm text-[#5a6f68] mt-1">
          Manage your personal details, contact preferences, and official Government of India ABHA / Aadhaar Health Card.
        </p>
      </div>

      {/* ── 2. AADHAAR & ABHA DIGITAL HEALTH CARD SECTION ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-[#172b28] uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-[#137b65]" />
            <span>ABHA Digital Health Card (ABDM)</span>
          </h2>
          <span className="text-[11px] text-[#6d8279]">
            National Health Authority Verified
          </span>
        </div>

        {loadingCard ? (
          <div className="p-8 rounded-3xl bg-white border border-[#dce8df] text-center text-xs text-[#70847c] animate-pulse">
            Loading verified health card credentials...
          </div>
        ) : (
          <AbhaDigitalCard
            cardData={cardData || { is_verified: false }}
            onLinkClick={() => setIsModalOpen(true)}
            onUnlink={fetchCardData}
          />
        )}
      </section>

      {/* ── 3. BASIC PROFILE DETAILS ── */}
      <div className="bg-white border border-[#dce8df] rounded-3xl p-6 sm:p-8 shadow-xs">
        <h2 className="text-sm font-extrabold text-[#172b28] uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <User size={16} className="text-[#137b65]" />
          <span>Account Information</span>
        </h2>

        <div className="flex items-center gap-4 pb-6 border-b border-[#edf3ee] mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#eaf4ee] text-[#137b65] font-bold text-xl flex items-center justify-center border border-[#cfe2d6]">
            {user?.full_name ? user.full_name[0] : 'U'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#172b28]">{user?.full_name || 'Patient'}</h3>
            <span className="text-xs font-semibold text-[#137b65] bg-[#edf6f1] px-2.5 py-0.5 rounded-full inline-block mt-1">
              Role: {user?.role ? user.role.toUpperCase() : 'PATIENT'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-3 p-3.5 bg-[#f8faf8] border border-[#e8eee9] rounded-2xl">
            <Mail size={16} className="text-[#137b65] shrink-0" />
            <div className="truncate">
              <span className="text-[10px] uppercase font-bold text-[#6f827b] block">Email Address</span>
              <span className="text-[#172b28] font-semibold truncate block">{user?.email || 'patient@example.com'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 bg-[#f8faf8] border border-[#e8eee9] rounded-2xl">
            <Phone size={16} className="text-[#137b65] shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-[#6f827b] block">Phone</span>
              <span className="text-[#172b28] font-semibold">{user?.phone || '+91 98765 43210'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 bg-[#f8faf8] border border-[#e8eee9] rounded-2xl sm:col-span-2">
            <MapPin size={16} className="text-[#137b65] shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-[#6f827b] block">Primary Location / District</span>
              <span className="text-[#172b28] font-semibold">Sonipat, Haryana - 131001</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#edf2ee] text-[11px] text-[#6d827a] flex items-center gap-2">
          <ShieldCheck size={14} className="text-[#137b65]" />
          <span>Patient records are securely encrypted and partitioned per user in accordance with ABDM and DPDP Act 2023.</span>
        </div>
      </div>

      {/* ── 4. AADHAAR VERIFICATION MODAL ── */}
      <AadhaarVerificationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        patientName={user?.full_name || 'Patient'}
        onSuccess={() => {
          fetchCardData();
        }}
      />
    </div>
  );
}
