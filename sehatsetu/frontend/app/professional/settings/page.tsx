'use client';

import React, { useState } from 'react';
import {
  Bell, Clock, CheckCircle2,
  Calendar, Save
} from 'lucide-react';

export default function ProfessionalSettingsPage() {
  const [delayGraceMinutes, setDelayGraceMinutes] = useState('20');
  const [autoProposeSlot, setAutoProposeSlot] = useState(true);
  const [slotBufferMinutes, setSlotBufferMinutes] = useState('5');
  const [dailyPatientCap, setDailyPatientCap] = useState('24');
  const [inAppSound, setInAppSound] = useState(true);
  const [urgentTriageAlerts, setUrgentTriageAlerts] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3500);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#172b28]">Clinic &amp; Practice Settings</h1>
          <p className="text-xs text-[#5a7067] mt-0.5">
            Configure consultation buffers, FairSlot daily caps, delay handling rules, and alert channels.
          </p>
        </div>
      </div>

      {saved && (
        <div className="p-3.5 rounded-2xl bg-[#edf7f1] border border-[#bce2cc] text-[#137b65] text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 size={16} />
          <span>Practice operational preferences have been saved and applied to your OPD schedule.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Care Continuity & Delay Settings */}
        <div className="bg-white border border-[#e2ece5] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#edf3ee]">
            <Clock size={18} className="text-[#137b65]" />
            <h2 className="text-sm font-bold text-[#172b28]">Care Continuity &amp; Patient Delay Handling</h2>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-[#172b28] mb-1">
                Acceptable Delay Grace Window (Minutes)
              </label>
              <select
                value={delayGraceMinutes}
                onChange={(e) => setDelayGraceMinutes(e.target.value)}
                className="w-full sm:w-72 p-2.5 rounded-xl border border-[#d6e5dc] bg-[#fbfcfa] text-xs outline-none"
              >
                <option value="15">15 Minutes (Strict)</option>
                <option value="20">20 Minutes (Standard)</option>
                <option value="30">30 Minutes (Flexible)</option>
                <option value="45">45 Minutes (Rural outreach / transit buffer)</option>
              </select>
              <p className="text-[11px] text-[#6a8077] mt-1">
                When a patient reports a transit delay within this window, one-click clinic approval keeps their slot active without cancellation.
              </p>
            </div>

            <label className="flex items-start justify-between p-3.5 rounded-2xl bg-[#f8faf8] border border-[#e7efe9] cursor-pointer">
              <div className="pr-4">
                <span className="font-bold text-[#172b28] block">Auto-Suggest Next Window</span>
                <span className="text-[11px] text-[#6d827a] block mt-0.5">
                  When you cannot accommodate a delayed patient, automatically locate the earliest vacant slot in your weekly calendar and offer it with 1-click.
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoProposeSlot}
                onChange={(e) => setAutoProposeSlot(e.target.checked)}
                className="w-4 h-4 accent-[#137b65] rounded mt-0.5"
              />
            </label>
          </div>
        </div>

        {/* OPD Buffer & FairSlot Rules */}
        <div className="bg-white border border-[#e2ece5] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#edf3ee]">
            <Calendar size={18} className="text-[#137b65]" />
            <h2 className="text-sm font-bold text-[#172b28]">OPD Schedule &amp; FairSlot Protection</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-[#172b28] mb-1">
                Slot Intermission Buffer
              </label>
              <select
                value={slotBufferMinutes}
                onChange={(e) => setSlotBufferMinutes(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#d6e5dc] bg-[#fbfcfa] text-xs outline-none"
              >
                <option value="0">0 Minutes (Back-to-back)</option>
                <option value="5">5 Minutes (Recommended)</option>
                <option value="10">10 Minutes (Sanitization &amp; Notes)</option>
                <option value="15">15 Minutes</option>
              </select>
              <p className="text-[11px] text-[#6a8077] mt-1">
                Buffer between patient consultations for charting and sanitization.
              </p>
            </div>

            <div>
              <label className="block font-bold text-[#172b28] mb-1">
                Daily Patient Consultation Cap
              </label>
              <input
                type="number"
                min="10"
                max="60"
                value={dailyPatientCap}
                onChange={(e) => setDailyPatientCap(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#d6e5dc] bg-[#fbfcfa] text-xs outline-none"
              />
              <p className="text-[11px] text-[#6a8077] mt-1">
                Complies with SehatSetu FairSlot anti-burnout guidelines (Max 60/day).
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Notifications */}
        <div className="bg-white border border-[#e2ece5] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#edf3ee]">
            <Bell size={18} className="text-[#137b65]" />
            <h2 className="text-sm font-bold text-[#172b28]">Notifications &amp; Clinical Alerts</h2>
          </div>

          <div className="space-y-3 text-xs text-[#3d524a]">
            <label className="flex items-center justify-between p-3 rounded-2xl bg-[#f8faf8] border border-[#e7efe9] cursor-pointer">
              <div>
                <span className="font-bold text-[#172b28] block">Urgent Care &amp; Delay Audio Chime</span>
                <span className="text-[11px] text-[#6d827a] block mt-0.5">
                  Play an audible chime when an active patient submits a transit delay notification
                </span>
              </div>
              <input
                type="checkbox"
                checked={inAppSound}
                onChange={(e) => setInAppSound(e.target.checked)}
                className="w-4 h-4 accent-[#137b65] rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl bg-[#f8faf8] border border-[#e7efe9] cursor-pointer">
              <div>
                <span className="font-bold text-[#172b28] block">Red-Flag Symptoms Triage Alert</span>
                <span className="text-[11px] text-[#6d827a] block mt-0.5">
                  Highlight bookings where patient intake forms note high fever, chest pain, or acute trauma
                </span>
              </div>
              <input
                type="checkbox"
                checked={urgentTriageAlerts}
                onChange={(e) => setUrgentTriageAlerts(e.target.checked)}
                className="w-4 h-4 accent-[#137b65] rounded"
              />
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#137b65] text-white text-xs font-semibold hover:bg-[#0f6754] transition shadow-xs cursor-pointer"
          >
            <Save size={14} />
            <span>Save Clinic Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
}
