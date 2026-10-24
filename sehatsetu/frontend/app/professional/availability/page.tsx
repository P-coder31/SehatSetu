'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '@/lib/api';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AvailabilityPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New blocked date state
  const [blockDate, setBlockDate] = useState('');
  const [blockReason, setBlockReason] = useState('');

  const fetchAvailability = async () => {
    try {
      const data = await apiRequest<any>('/professional/availability');
      setRules(data.rules || []);
      setExceptions(data.exceptions || []);
    } catch {
      // fallback default Mon-Sat
      setRules([
        { day_of_week: 0, start_time: '09:00', end_time: '17:00', slot_duration_minutes: 30, is_active: true },
        { day_of_week: 1, start_time: '09:00', end_time: '17:00', slot_duration_minutes: 30, is_active: true },
        { day_of_week: 2, start_time: '09:00', end_time: '17:00', slot_duration_minutes: 30, is_active: true },
        { day_of_week: 3, start_time: '09:00', end_time: '17:00', slot_duration_minutes: 30, is_active: true },
        { day_of_week: 4, start_time: '09:00', end_time: '17:00', slot_duration_minutes: 30, is_active: true },
        { day_of_week: 5, start_time: '09:00', end_time: '14:00', slot_duration_minutes: 30, is_active: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, []);

  const handleRuleChange = (idx: number, field: string, val: any) => {
    setRules((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };

  const handleSaveWorkingHours = async () => {
    setSaving(true);
    setSuccessMsg(null);
    try {
      await apiRequest('/professional/availability/rules', {
        method: 'POST',
        body: JSON.stringify(rules.map((r) => ({
          day_of_week: r.day_of_week,
          start_time: r.start_time,
          end_time: r.end_time,
          slot_duration_minutes: r.slot_duration_minutes || 30,
        }))),
      });
      setSuccessMsg('Working hours schedule successfully saved.');
    } catch (err: any) {
      alert(err.message || 'Error saving working hours.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddBlockedDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockDate) return;
    try {
      await apiRequest('/professional/availability/exceptions', {
        method: 'POST',
        body: JSON.stringify({
          exception_date: blockDate,
          is_blocked: true,
          reason: blockReason.trim() || 'Clinic closed / Doctor on leave',
        }),
      });
      setBlockDate('');
      setBlockReason('');
      setSuccessMsg('Blocked date added to schedule.');
      await fetchAvailability();
    } catch (err: any) {
      alert(err.message || 'Error adding blocked date.');
    }
  };

  if (loading) {
    return <div className="max-w-5xl mx-auto px-4 py-20 text-center text-xs text-[#71847e]">Loading working hours and schedule...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172b28]">Manage Working Hours &amp; Unavailability</h1>
          <p className="text-xs text-[#5e726b] mt-0.5">
            Configure your weekly consultation schedule and mark temporary unavailable dates.
          </p>
        </div>
        <Link
          href="/professional/dashboard"
          className="px-4 py-2 rounded-xl border border-[#cadbd1] text-[#2c413b] text-xs font-semibold hover:bg-[#f2f7f4] transition self-start sm:self-auto"
        >
          Dashboard
        </Link>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-[#edf7f1] border border-[#bce2cc] text-[#137b65] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-[#137b65]">✕</button>
        </div>
      )}

      {/* Grid: Working Hours & Blocked Dates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Weekly Hours */}
        <div className="lg:col-span-7 bg-white border border-[#e2ece5] rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#edf3ee]">
            <h2 className="text-sm font-bold text-[#172b28] flex items-center gap-2">
              <Clock size={16} className="text-[#137b65]" />
              Weekly Operating Schedule
            </h2>
            <button
              onClick={handleSaveWorkingHours}
              disabled={saving}
              className="px-4 py-1.5 rounded-xl bg-[#137b65] text-white text-xs font-bold hover:bg-[#0e6351] transition"
            >
              {saving ? 'Saving...' : 'Save Schedule'}
            </button>
          </div>

          <div className="space-y-3">
            {rules.map((rule, idx) => (
              <div
                key={rule.day_of_week}
                className="p-3 rounded-2xl border border-[#e9eee9] bg-[#fbfcfa] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <span className="font-bold text-[#172b28] w-28">
                  {DAY_NAMES[rule.day_of_week]}
                </span>

                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={rule.start_time}
                    onChange={(e) => handleRuleChange(idx, 'start_time', e.target.value)}
                    className="p-1.5 rounded-lg border border-[#d6e3da] bg-white outline-none"
                  />
                  <span className="text-[#6d7f78]">to</span>
                  <input
                    type="time"
                    value={rule.end_time}
                    onChange={(e) => handleRuleChange(idx, 'end_time', e.target.value)}
                    className="p-1.5 rounded-lg border border-[#d6e3da] bg-white outline-none"
                  />
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-[#556962]">
                  <span>Slot:</span>
                  <select
                    value={rule.slot_duration_minutes || 30}
                    onChange={(e) => handleRuleChange(idx, 'slot_duration_minutes', Number(e.target.value))}
                    className="p-1 rounded-md border border-[#d6e3da] bg-white"
                  >
                    <option value={15}>15m</option>
                    <option value={30}>30m</option>
                    <option value={45}>45m</option>
                    <option value={60}>60m</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Blocked Dates & Leaves */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-[#e2ece5] rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#172b28] flex items-center gap-2 pb-3 border-b border-[#edf3ee]">
              <Calendar size={16} className="text-[#137b65]" />
              Block a Specific Date
            </h3>

            <form onSubmit={handleAddBlockedDate} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#172b28] mb-1">Select Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={blockDate}
                  onChange={(e) => setBlockDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#d8e3dc] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#172b28] mb-1">Reason / Note</label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="e.g. Attending medical conference, personal leave"
                  className="w-full p-2.5 rounded-xl border border-[#d8e3dc] outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#172b28] text-white font-bold text-xs hover:bg-[#0b5548] transition"
              >
                Block Selected Date
              </button>
            </form>

            {/* List of blocked dates */}
            <div className="pt-3 border-t border-[#edf2ee]">
              <h4 className="text-[11px] font-bold text-[#627670] uppercase tracking-wider mb-2">
                Blocked Dates ({exceptions.length})
              </h4>
              {exceptions.length === 0 ? (
                <p className="text-xs text-[#71847e]">No blocked dates recorded.</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {exceptions.map((ex) => (
                    <div
                      key={ex.id}
                      className="p-2.5 rounded-xl bg-[#f9fbf9] border border-[#e8eee9] flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-[#172b28]">{ex.exception_date}</span>
                        {ex.reason && <p className="text-[11px] text-[#556962]">{ex.reason}</p>}
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                        Blocked
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
