'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClipboardList, Bell, ShieldCheck } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import AbhaDigitalCard, { AbhaCardData } from '@/components/AbhaDigitalCard';
import AadhaarVerificationModal from '@/components/AadhaarVerificationModal';

export default function CarePassportPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [cardData, setCardData] = useState<AbhaCardData | null>(null);
  const [isAadhaarModalOpen, setIsAadhaarModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  const fetchData = async () => {
    try {
      const [passportEvents, rems, abhaCard] = await Promise.all([
        apiRequest<any[]>('/care-continuity/passport'),
        apiRequest<any[]>('/care-continuity/reminders'),
        apiRequest<AbhaCardData>('/care-continuity/aadhaar-card').catch(() => ({ is_verified: false }))
      ]);
      setEvents(passportEvents);
      setReminders(rems);
      setCardData(abhaCard);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReminderAction = async (id: number, action: 'complete' | 'dismiss') => {
    try {
      await apiRequest(`/care-continuity/reminders/${id}?action=${action}`, { method: 'PATCH' });
      await fetchData();
    } catch {
      // ignore
    }
  };

  const filteredEvents = events.filter((e) => {
    if (filterType === 'all') return true;
    return e.event_type === filterType;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white border border-[#dce8df] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eaf4ee] text-[#137b65] text-xs font-bold uppercase tracking-wider mb-2">
            <ClipboardList size={14} /> Care Continuity Record
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#172b28]">
            My Care Passport
          </h1>
          <p className="text-xs sm:text-sm text-[#5a6f68] mt-1 max-w-xl leading-relaxed">
            A permanent chronological timeline of your healthcare touchpoints, delays, rescheduling events, and follow-up reminders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/appointments"
            className="px-4 py-2.5 rounded-xl bg-[#137b65] text-white text-xs font-bold shadow-xs hover:bg-[#0e6351] transition"
          >
            My Appointments
          </Link>
        </div>
      </div>

      {/* ── ABHA / AADHAAR DIGITAL HEALTH CARD ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-[#172b28] uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-[#137b65]" />
            <span>ABHA Digital Health Record Card (ABDM)</span>
          </h2>
          <span className="text-[11px] text-[#6d8279]">
            National Health Authority &amp; UIDAI
          </span>
        </div>

        <AbhaDigitalCard
          cardData={cardData || { is_verified: false }}
          onLinkClick={() => setIsAadhaarModalOpen(true)}
          onUnlink={fetchData}
        />
      </section>

      {/* Grid: Timeline and Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Timeline Events */}
        <div className="lg:col-span-8 space-y-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-base font-bold text-[#172b28]">Timeline Events ({filteredEvents.length})</h2>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
              {[
                { id: 'all', label: 'All Events' },
                { id: 'booked', label: 'Bookings' },
                { id: 'delay_reported', label: 'Delays' },
                { id: 'rescheduled', label: 'Rescheduled' },
                { id: 'cancelled', label: 'Cancelled' },
                { id: 'reminder_created', label: 'Reminders' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    filterType === f.id
                      ? 'bg-[#137b65] text-white'
                      : 'bg-[#f4f7f5] text-[#556962] hover:bg-[#e6efe9]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-[#71847e]">Loading Care Passport...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="bg-white border border-[#e2ede5] rounded-3xl p-12 text-center">
              <ClipboardList size={36} className="text-[#9ab1a6] mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#172b28]">No timeline events found</h3>
              <p className="text-xs text-[#637770] mt-1 mb-4">
                As you book appointments, report delays, or complete follow-ups, your timeline will grow here.
              </p>
              <Link
                href="/search"
                className="px-4 py-2 rounded-xl bg-[#137b65] text-white text-xs font-bold"
              >
                Find a doctor
              </Link>
            </div>
          ) : (
            <div className="relative border-l-2 border-[#137b65]/30 ml-4 space-y-6 pl-6 py-2">
              {filteredEvents.map((ev) => {
                const isDelay = ev.event_type === 'delay_reported' || ev.event_type === 'delay_approved';
                const isCancelled = ev.event_type === 'cancelled';
                const isRescheduled = ev.event_type === 'rescheduled';

                return (
                  <div key={ev.id} className="relative group">
                    {/* Circle Node */}
                    <span
                      className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white ring-2 ${
                        isCancelled
                          ? 'bg-red-500 ring-red-200'
                          : isDelay
                          ? 'bg-amber-500 ring-amber-200'
                          : isRescheduled
                          ? 'bg-blue-500 ring-blue-200'
                          : 'bg-[#137b65] ring-[#cce7d6]'
                      }`}
                    />

                    {/* Content Card */}
                    <div className="bg-white border border-[#e2ece5] rounded-2xl p-4 shadow-xs hover:border-[#b4d6c0] transition">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#137b65]">
                          {ev.event_type.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-[#788a83]">
                          {new Date(ev.created_at).toLocaleString([], {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[#172b28]">{ev.title}</h4>
                      {ev.description && (
                        <p className="text-xs text-[#52665f] mt-1 leading-relaxed">
                          {ev.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Reminders Sidebar */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white border border-[#e2ece5] rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#edf3ee] mb-4">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-[#137b65]" />
                <h3 className="text-sm font-bold text-[#172b28]">Follow-up Tasks</h3>
              </div>
              <span className="text-[10px] font-semibold text-[#137b65] bg-[#edf6f1] px-2 py-0.5 rounded-full">
                {reminders.filter(r => r.status === 'pending').length} Active
              </span>
            </div>

            {reminders.length === 0 ? (
              <p className="text-xs text-[#71847e] text-center py-6">No reminders scheduled.</p>
            ) : (
              <div className="space-y-3">
                {reminders.map((rem) => (
                  <div
                    key={rem.id}
                    className={`p-3.5 rounded-xl border text-xs transition ${
                      rem.status === 'completed'
                        ? 'bg-[#f8faf8] border-[#e2ece5] opacity-75'
                        : 'bg-[#fbfcfa] border-[#d8e4dc]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`font-bold ${rem.status === 'completed' ? 'line-through text-[#6d8078]' : 'text-[#1a2d29]'}`}>
                        {rem.title}
                      </h4>
                      <span className="text-[10px] font-semibold text-[#137b65]">
                        {rem.reminder_date}
                      </span>
                    </div>

                    {rem.notes && (
                      <p className="text-[11px] text-[#556962] mt-1 leading-relaxed">
                        {rem.notes}
                      </p>
                    )}

                    {rem.status === 'pending' && (
                      <div className="mt-3 pt-2 border-t border-[#edf2ee] flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleReminderAction(rem.id, 'dismiss')}
                          className="px-2 py-1 text-[11px] font-semibold text-[#667a73] hover:text-[#172b28]"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => handleReminderAction(rem.id, 'complete')}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#137b65] text-white hover:bg-[#0e6351] transition"
                        >
                          Mark Complete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 bg-[#edf6f1] border border-[#cbe4d5] rounded-2xl text-xs text-[#305044] space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-[#137b65]">
              <ShieldCheck size={15} /> Privacy &amp; Continuity Guarantee
            </div>
            <p className="text-[11px] leading-relaxed">
              Care Passport never invents medical diagnoses, laboratory reports, or prescriptions. It faithfully logs scheduling actions and follow-up commitments.
            </p>
          </div>
        </div>
      </div>

      {/* Aadhaar / ABHA Verification Modal */}
      <AadhaarVerificationModal
        isOpen={isAadhaarModalOpen}
        onClose={() => setIsAadhaarModalOpen(false)}
        onSuccess={() => fetchData()}
      />
    </div>
  );
}
