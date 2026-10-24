'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CalendarCheck, ShieldCheck, MapPin, IndianRupee, Clock,
  ArrowRight, AlertCircle, User, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiRequest, formatINR } from '@/lib/api';

export default function BookingPage({ params }: { params: Promise<{ providerId: string }> }) {
  const resolvedParams = use(params);
  const providerId = resolvedParams.providerId;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, quickDemoLogin } = useAuth();

  const slotParam = searchParams.get('slot') || '10:30';
  const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const facilityIdParam = searchParams.get('facility_id');

  const [provider, setProvider] = useState<any | null>(null);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<any>(`/discovery/providers/${providerId}`)
      .then(setProvider)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [providerId]);

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // If not logged in, auto-login as demo patient Asha to provide zero-friction demo experience
    if (!user) {
      await quickDemoLogin('patient');
    }

    setSubmitting(true);
    try {
      const facilityId = facilityIdParam
        ? Number(facilityIdParam)
        : provider?.facilities?.[0]?.id || 1;

      const res = await apiRequest<any>('/appointments/bookings', {
        method: 'POST',
        body: JSON.stringify({
          professional_id: Number(providerId),
          facility_id: facilityId,
          appointment_date: dateParam,
          slot_time: slotParam,
          chief_complaint: chiefComplaint.trim() || 'General Consultation',
          notes: notes.trim() || undefined,
        }),
      });

      // Redirect to booking success screen
      router.push(`/booking/success?ref=${res.booking_reference}&id=${res.id}`);
    } catch (err: any) {
      setError(err.message || 'Unable to confirm booking. Please try another slot.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-20 text-center text-xs text-[#6e827a]">Loading booking details...</div>;
  }

  const facility = provider?.facilities?.find((f: any) => f.id === Number(facilityIdParam)) || provider?.facilities?.[0];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-[#6e827a] mb-6">
        <Link href="/" className="hover:text-[#137b65]">Home</Link>
        <ChevronRight size={12} />
        <Link href="/search" className="hover:text-[#137b65]">Discovery</Link>
        <ChevronRight size={12} />
        <span className="text-[#172b28] font-semibold">Confirm Booking</span>
      </div>

      <div className="bg-white border border-[#dce8df] rounded-3xl p-6 sm:p-9 shadow-md">
        <div className="flex items-center justify-between pb-4 border-b border-[#edf3ee] mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#172b28]">Review &amp; Confirm Booking</h1>
            <p className="text-xs text-[#5f746d] mt-0.5">Your slot will be reserved immediately upon confirmation.</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#eaf5ee] text-[#137b65] flex items-center justify-center">
            <CalendarCheck size={20} />
          </div>
        </div>

        {error && (
          <div className="p-4 mb-6 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
            <AlertCircle size={16} className="shrink-0 text-red-600 mt-0.5" />
            <div>
              <strong>Booking Error:</strong>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Appointment Summary Box */}
        <div className="bg-[#f8faf8] border border-[#e2ede5] rounded-2xl p-5 mb-6 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#e9efe9]">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#6f827b] tracking-wider">Healthcare Professional</span>
              <h3 className="text-sm font-bold text-[#172b28] mt-0.5">
                {provider?.title} {provider?.full_name}
              </h3>
              <p className="text-xs text-[#137b65] font-semibold">
                {provider?.specialties?.map((s: any) => s.name).join(', ')}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-[#6f827b] tracking-wider">Consultation Fee</span>
              <p className="text-base font-bold text-[#137b65] flex items-center justify-end">
                <IndianRupee size={14} className="shrink-0 mr-0.5" />{formatINR(provider?.consultation_fee)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#4b6058] pt-1">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-[#137b65]" />
              <div>
                <span className="font-bold text-[#172b28]">Date &amp; Time:</span> {dateParam} at {slotParam}
              </div>
            </div>

            {facility && (
              <div className="flex items-center gap-2">
                <MapPin size={15} className="text-[#137b65]" />
                <div>
                  <span className="font-bold text-[#172b28]">Facility:</span> {facility.name} ({facility.city})
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Booking Form */}
        <form onSubmit={handleConfirmBooking} className="space-y-5">
          {/* Patient Account Notice */}
          <div className="p-3.5 rounded-xl bg-[#edf6f1] border border-[#cce4d5] text-xs text-[#2c4d41] flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <User size={15} className="text-[#137b65]" />
              <span>
                Booking as: <strong>{user ? user.full_name : 'Asha Patel (Demo Patient)'}</strong>
              </span>
            </div>
            {!user && (
              <span className="text-[10px] text-[#426c5c]">
                (Will auto-sign in as verified demo patient)
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172b28] mb-1">
              Chief Complaint / Reason for Consultation
            </label>
            <input
              type="text"
              required
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="e.g. Mild fever, persistent cough, routine follow-up"
              className="w-full text-xs p-3 rounded-xl border border-[#d8e3dc] bg-[#fbfcfa] focus:bg-white focus:border-[#137b65] outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172b28] mb-1">
              Optional Medical Notes for Doctor
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any current medications, known allergies, or timing preferences"
              className="w-full text-xs p-3 rounded-xl border border-[#d8e3dc] bg-[#fbfcfa] focus:bg-white focus:border-[#137b65] outline-none transition"
            />
          </div>

          {/* FairSlot Protection Notice */}
          <div className="text-[11px] text-[#6d7f78] bg-[#f9fbf9] p-3 rounded-xl border border-[#edf3ee] flex items-start gap-2">
            <ShieldCheck size={14} className="text-[#137b65] shrink-0 mt-0.5" />
            <span>
              <strong>FairSlot Guarantee:</strong> SehatSetu allows up to 2 active bookings per patient. If your plans change, you can report a delay or reschedule without losing your spot.
            </span>
          </div>

          <div className="pt-3 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2.5 rounded-xl border border-[#cadad0] text-xs font-semibold text-[#485d56] hover:bg-[#f2f6f4] transition"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-xl bg-[#137b65] text-white text-xs font-bold shadow-md hover:bg-[#0e6351] transition inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Reserving slot...' : 'Confirm Appointment Booking'} <ArrowRight size={14} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
