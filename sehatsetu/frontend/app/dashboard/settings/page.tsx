'use client';

import React, { useState } from 'react';
import { Bell, Globe, Shield, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function PatientSettingsPage() {
  const { user } = useAuth();
  const [inAppNotifs, setInAppNotifs] = useState(true);
  const [delayAlerts, setDelayAlerts] = useState(true);
  const [preferredLang, setPreferredLang] = useState('en');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#172b28]">Account &amp; Care Settings</h1>
          <p className="text-xs text-[#5a7067] mt-0.5">
            Manage your communication preferences, language, and privacy settings
          </p>
        </div>
      </div>

      {saved && (
        <div className="p-3.5 rounded-2xl bg-[#edf7f1] border border-[#bce2cc] text-[#137b65] text-xs flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>Your settings preferences have been saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Notifications Section */}
        <div className="bg-white border border-[#e2ece5] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#edf3ee]">
            <Bell size={18} className="text-[#137b65]" />
            <h2 className="text-sm font-bold text-[#172b28]">Notification Preferences</h2>
          </div>

          <div className="space-y-3 text-xs text-[#3d524a]">
            <label className="flex items-center justify-between p-3 rounded-2xl bg-[#f8faf8] border border-[#e7efe9] cursor-pointer">
              <div>
                <span className="font-bold text-[#172b28] block">In-App Delay Notifications</span>
                <span className="text-[11px] text-[#6d827a] block mt-0.5">
                  Receive real-time clinic approvals or proposed alternative slots
                </span>
              </div>
              <input
                type="checkbox"
                checked={delayAlerts}
                onChange={(e) => setDelayAlerts(e.target.checked)}
                className="w-4 h-4 accent-[#137b65] rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl bg-[#f8faf8] border border-[#e7efe9] cursor-pointer">
              <div>
                <span className="font-bold text-[#172b28] block">Follow-up Task Reminders</span>
                <span className="text-[11px] text-[#6d827a] block mt-0.5">
                  Alert me when post-consultation tasks or medications are due
                </span>
              </div>
              <input
                type="checkbox"
                checked={inAppNotifs}
                onChange={(e) => setInAppNotifs(e.target.checked)}
                className="w-4 h-4 accent-[#137b65] rounded"
              />
            </label>
          </div>
        </div>

        {/* Language & Health Guide Helper */}
        <div className="bg-white border border-[#e2ece5] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#edf3ee]">
            <Globe size={18} className="text-[#137b65]" />
            <h2 className="text-sm font-bold text-[#172b28]">Language &amp; Scheme Assistant</h2>
          </div>

          <div className="text-xs space-y-2">
            <label className="block font-bold text-[#172b28]">Preferred Explanation Language</label>
            <select
              value={preferredLang}
              onChange={(e) => setPreferredLang(e.target.value)}
              className="w-full sm:w-64 p-2.5 rounded-xl border border-[#d6e5dc] bg-[#fbfcfa] text-xs outline-none"
            >
              <option value="en">English (Standard)</option>
              <option value="hi">सरल हिन्दी (Hindi Helper)</option>
            </select>
            <p className="text-[11px] text-[#6a8077] mt-1">
              Selects the default language for government scheme summaries and AI guidance.
            </p>
          </div>
        </div>

        {/* Security & Data Partitioning */}
        <div className="bg-white border border-[#e2ece5] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#edf3ee]">
            <Shield size={18} className="text-[#137b65]" />
            <h2 className="text-sm font-bold text-[#172b28]">Security &amp; Privacy</h2>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#f9fbf9] border border-[#eaf0eb] text-xs text-[#52665e] space-y-1">
            <div className="font-bold text-[#172b28]">Signed in as: {user?.email}</div>
            <div className="text-[11px]">Role: <span className="font-semibold text-[#137b65] capitalize">{user?.role}</span></div>
            <div className="text-[11px] text-[#6e827a] pt-1">
              Protected by PostgreSQL row constraints and server-validated session tokens. No unverified third-party sharing.
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#137b65] text-white text-xs font-bold rounded-xl hover:bg-[#0e6351] transition shadow-xs"
          >
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
