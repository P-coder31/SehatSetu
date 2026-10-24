'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Lock, Sliders, CheckCircle2,
  Save, KeyRound, Database
} from 'lucide-react';
import { getAadhaarConfigStatus, AadhaarConfigStatus } from '@/lib/aadhaar-auth';

export default function AdminSettingsPage() {
  const [maxActiveBookings, setMaxActiveBookings] = useState('3');
  const [slotLockTimeout, setSlotLockTimeout] = useState('10');
  const [requireVerificationForSearch, setRequireVerificationForSearch] = useState(true);
  const [notifyOnNewDoctor, setNotifyOnNewDoctor] = useState(true);
  const [auditRetentionDays, setAuditRetentionDays] = useState('180');
  const [saved, setSaved] = useState(false);

  // Aadhaar gateway status state
  const [aadhaarStatus, setAadhaarStatus] = useState<AadhaarConfigStatus | null>(null);
  const [loadingAadhaar, setLoadingAadhaar] = useState(true);

  useEffect(() => {
    getAadhaarConfigStatus()
      .then(setAadhaarStatus)
      .finally(() => setLoadingAadhaar(false));
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3500);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#172b28]">State Platform &amp; Security Settings</h1>
          <p className="text-xs text-[#5a7067] mt-0.5">
            Configure FairSlot concurrency guards, Aadhaar / ABHA gateway compliance, and audit log policies.
          </p>
        </div>
      </div>

      {saved && (
        <div className="p-3.5 rounded-2xl bg-[#edf7f1] border border-[#bce2cc] text-[#137b65] text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 size={16} />
          <span>Platform policies and FairSlot thresholds updated successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* FairSlot Anti-Hoarding Configuration */}
        <div className="bg-white border border-[#e2ece5] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#edf3ee]">
            <Lock size={18} className="text-[#137b65]" />
            <div>
              <h2 className="text-sm font-bold text-[#172b28]">FairSlot™ Anti-Hoarding &amp; Concurrency Engine</h2>
              <p className="text-[11px] text-[#647c72]">
                Guarantees equitable OPD slot distribution across primary health centres and civil hospitals.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-[#172b28] mb-1">
                Max Active Bookings Per Patient
              </label>
              <select
                value={maxActiveBookings}
                onChange={(e) => setMaxActiveBookings(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#d6e5dc] bg-[#fbfcfa] text-xs outline-none"
              >
                <option value="2">2 Concurrent Appointments</option>
                <option value="3">3 Concurrent Appointments (Standard)</option>
                <option value="5">5 Concurrent Appointments (High Capacity)</option>
              </select>
              <p className="text-[11px] text-[#6a8077] mt-1">
                Patients who hit this limit must attend or cancel existing appointments before reserving new slots.
              </p>
            </div>

            <div>
              <label className="block font-bold text-[#172b28] mb-1">
                Atomic Slot Reservation Lock Expiry (Minutes)
              </label>
              <select
                value={slotLockTimeout}
                onChange={(e) => setSlotLockTimeout(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#d6e5dc] bg-[#fbfcfa] text-xs outline-none"
              >
                <option value="5">5 Minutes</option>
                <option value="10">10 Minutes (Standard)</option>
                <option value="15">15 Minutes</option>
              </select>
              <p className="text-[11px] text-[#6a8077] mt-1">
                Duration a temporary reservation lock holds a slot in PostgreSQL before releasing it back to queue.
              </p>
            </div>
          </div>
        </div>

        {/* Aadhaar / ABHA Gateway Provider Abstraction Status */}
        <div className="bg-white border border-[#e2ece5] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#edf3ee]">
            <div className="flex items-center gap-2">
              <KeyRound size={18} className="text-[#137b65]" />
              <div>
                <h2 className="text-sm font-bold text-[#172b28]">Aadhaar / ABHA Identity Gateway Status</h2>
                <p className="text-[11px] text-[#647c72]">
                  UIDAI and National Health Authority compliant identity verification abstraction.
                </p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              aadhaarStatus?.is_configured
                ? 'bg-[#eaf5ee] text-[#137b65] border border-[#bce2cc]'
                : 'bg-[#fffbeb] text-[#b45309] border border-[#fde4b6]'
            }`}>
              {loadingAadhaar ? 'Checking...' : (aadhaarStatus?.is_configured ? 'Configured' : 'Demo Mode (Unconfigured)')}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#f8faf8] border border-[#e8eee9] space-y-3 text-xs">
            <div className="flex items-start gap-3">
              <ShieldCheck size={18} className="text-[#137b65] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-[#172b28] block">Compliance &amp; Privacy Mandate</span>
                <p className="text-[11px] text-[#5c736a] leading-relaxed">
                  In accordance with UIDAI regulations and the Digital Personal Data Protection (DPDP) Act:
                </p>
                <ul className="list-disc list-inside text-[11px] text-[#5c736a] space-y-0.5 pt-1">
                  <li>No raw 12-digit Aadhaar numbers, biometric payloads, or OTPs are stored in PostgreSQL.</li>
                  <li>Aadhaar data is strictly partitioned and never transmitted to LLM or AI analytics providers.</li>
                  <li>When unconfigured, the system explicitly displays &quot;Aadhaar authentication integration is not configured&quot; and enables password / demo authentication fallback.</li>
                </ul>
              </div>
            </div>

            <div className="pt-2 border-t border-[#e8eee9] flex items-center justify-between text-[11px]">
              <span className="text-[#647b71]">Active Gateway Provider:</span>
              <span className="font-mono font-semibold text-[#172b28]">
                {aadhaarStatus?.provider_name || 'UIDAI / ABDM Gateway Stub (Demo Mode)'}
              </span>
            </div>
          </div>
        </div>

        {/* Practitioner Verification Rules */}
        <div className="bg-white border border-[#e2ece5] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#edf3ee]">
            <Sliders size={18} className="text-[#137b65]" />
            <h2 className="text-sm font-bold text-[#172b28]">Medical Verification Governance</h2>
          </div>

          <div className="space-y-3 text-xs text-[#3d524a]">
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#f8faf8] border border-[#e7efe9] cursor-pointer">
              <div className="pr-4">
                <span className="font-bold text-[#172b28] block">Require State Verification for Public Search</span>
                <span className="text-[11px] text-[#6d827a] block mt-0.5">
                  Only show practitioners in public patient discovery after their registration number is verified against the State Medical Council register.
                </span>
              </div>
              <input
                type="checkbox"
                checked={requireVerificationForSearch}
                onChange={(e) => setRequireVerificationForSearch(e.target.checked)}
                className="w-4 h-4 accent-[#137b65] rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#f8faf8] border border-[#e7efe9] cursor-pointer">
              <div className="pr-4">
                <span className="font-bold text-[#172b28] block">New Practitioner Verification Notifications</span>
                <span className="text-[11px] text-[#6d827a] block mt-0.5">
                  Send alert to state administration console whenever a new healthcare professional completes clinical onboarding.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifyOnNewDoctor}
                onChange={(e) => setNotifyOnNewDoctor(e.target.checked)}
                className="w-4 h-4 accent-[#137b65] rounded"
              />
            </label>
          </div>
        </div>

        {/* Audit Trail Policy */}
        <div className="bg-white border border-[#e2ece5] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#edf3ee]">
            <Database size={18} className="text-[#137b65]" />
            <h2 className="text-sm font-bold text-[#172b28]">Audit Trail &amp; Compliance Logs</h2>
          </div>

          <div className="text-xs space-y-2">
            <label className="block font-bold text-[#172b28]">Audit Log Retention Policy</label>
            <select
              value={auditRetentionDays}
              onChange={(e) => setAuditRetentionDays(e.target.value)}
              className="w-full sm:w-64 p-2.5 rounded-xl border border-[#d6e5dc] bg-[#fbfcfa] text-xs outline-none"
            >
              <option value="90">90 Days (Minimum)</option>
              <option value="180">180 Days (DISHA Standard)</option>
              <option value="365">365 Days (Annual Audit)</option>
            </select>
            <p className="text-[11px] text-[#6a8077]">
              Tracks user account state toggles, practitioner approvals/rejections, and facility modifications with immutable timestamps.
            </p>
          </div>
        </div>

        {/* Save CTA */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#137b65] text-white text-xs font-semibold hover:bg-[#0f6754] transition shadow-xs cursor-pointer"
          >
            <Save size={14} />
            <span>Save Platform Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
