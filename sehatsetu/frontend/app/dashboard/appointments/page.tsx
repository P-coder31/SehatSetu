'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CalendarCheck, Clock, AlertCircle, CheckCircle2,
  X, RefreshCw, MapPin, ArrowRight, History,
  AlertTriangle, Calendar, Check, Send, Loader2
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import DoctorAvatarImage from '@/components/DoctorAvatarImage';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [delayModalAppt, setDelayModalAppt] = useState<any | null>(null);
  const [delayMinutes, setDelayMinutes] = useState<number>(15);
  const [delayReason, setDelayReason] = useState<string>('');

  const [rescheduleModalAppt, setRescheduleModalAppt] = useState<any | null>(null);
  const [newDate, setNewDate] = useState<string>('');
  const [newSlot, setNewSlot] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Patient choosing alternate slot in response to doctor's request
  const [alternatePickModalAppt, setAlternatePickModalAppt] = useState<any | null>(null);
  const [alternateDate, setAlternateDate] = useState<string>('');
  const [alternateSlot, setAlternateSlot] = useState<string>('');
  const [alternateSlots, setAlternateSlots] = useState<any[]>([]);
  const [alternateSlotsLoading, setAlternateSlotsLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAppointments = async () => {
    try {
      const data = await apiRequest<any[]>('/appointments/bookings');
      setAppointments(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Fetch slots when rescheduling date changes
  useEffect(() => {
    if (!rescheduleModalAppt || !newDate) return;
    setSlotsLoading(true);
    apiRequest<{ slots: any[] }>(`/discovery/slots?professional_id=${rescheduleModalAppt.professional_id}&target_date=${newDate}`)
      .then((res) => {
        setAvailableSlots(res.slots || []);
        const firstAvail = (res.slots || []).find((s: any) => s.is_available);
        setNewSlot(firstAvail ? firstAvail.slot_time : '');
      })
      .catch(() => setAvailableSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [newDate, rescheduleModalAppt]);

  // Fetch slots for alternate pick modal
  useEffect(() => {
    if (!alternatePickModalAppt || !alternateDate) return;
    setAlternateSlotsLoading(true);
    apiRequest<{ slots: any[] }>(`/discovery/slots?professional_id=${alternatePickModalAppt.professional_id}&target_date=${alternateDate}`)
      .then((res) => {
        setAlternateSlots(res.slots || []);
        const firstAvail = (res.slots || []).find((s: any) => s.is_available);
        setAlternateSlot(firstAvail ? firstAvail.slot_time : '');
      })
      .catch(() => setAlternateSlots([]))
      .finally(() => setAlternateSlotsLoading(false));
  }, [alternateDate, alternatePickModalAppt]);

  // Report Delay
  const handleReportDelay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delayModalAppt) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await apiRequest('/care-continuity/delay', {
        method: 'POST',
        body: JSON.stringify({
          appointment_id: delayModalAppt.id,
          delay_minutes: delayMinutes,
          reason: delayReason.trim() || 'Running late / traffic delay',
        }),
      });
      setSuccessMsg(`Reported ${delayMinutes} minute delay to the clinic.`);
      setDelayModalAppt(null);
      await fetchAppointments();
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to report delay.');
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel Appointment
  const handleCancel = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this appointment? The slot will be released for other patients.')) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await apiRequest(`/appointments/bookings/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Patient cancelled visit' }),
      });
      setSuccessMsg('Appointment cancelled. Slot successfully released.');
      await fetchAppointments();
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to cancel appointment.');
    } finally {
      setActionLoading(false);
    }
  };

  // Patient Reschedule
  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleModalAppt || !newSlot) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await apiRequest(`/appointments/bookings/${rescheduleModalAppt.id}/reschedule`, {
        method: 'POST',
        body: JSON.stringify({
          new_date: newDate,
          new_slot_time: newSlot,
        }),
      });
      setSuccessMsg(`Appointment rescheduled to ${newDate} at ${newSlot}.`);
      setRescheduleModalAppt(null);
      await fetchAppointments();
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to reschedule.');
    } finally {
      setActionLoading(false);
    }
  };

  // 1-Click Accept Doctor Reschedule Request
  const handleAcceptDoctorReschedule = async (id: number) => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const updated = await apiRequest<any>(`/appointments/bookings/${id}/accept-reschedule`, {
        method: 'POST',
      });
      setSuccessMsg(`Reschedule confirmed! Your appointment is now set for ${updated.appointment_date} at ${updated.slot_time}. Doctor notified.`);
      await fetchAppointments();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to accept reschedule.');
    } finally {
      setActionLoading(false);
    }
  };

  // Patient Submitting Alternate Pick in response to Doctor
  const handleAlternateSlotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alternatePickModalAppt || !alternateDate || !alternateSlot) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await apiRequest(`/appointments/bookings/${alternatePickModalAppt.id}/decline-reschedule`, {
        method: 'POST',
        body: JSON.stringify({
          decision: 'decline',
          action: 'pick_another',
          alternate_date: alternateDate,
          alternate_slot_time: alternateSlot,
        }),
      });
      setSuccessMsg(`Alternate time selected: ${alternateDate} at ${alternateSlot}. Doctor notified.`);
      setAlternatePickModalAppt(null);
      await fetchAppointments();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to select alternate slot.');
    } finally {
      setActionLoading(false);
    }
  };

  // Patient Declining & Cancelling Doctor Reschedule Request
  const handleDeclineAndCancel = async (id: number) => {
    if (!confirm('Are you sure you want to decline this reschedule request and cancel the appointment?')) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await apiRequest(`/appointments/bookings/${id}/decline-reschedule`, {
        method: 'POST',
        body: JSON.stringify({
          decision: 'decline',
          action: 'cancel'
        }),
      });
      setSuccessMsg('Reschedule request declined. Appointment cancelled and slot released.');
      await fetchAppointments();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to decline reschedule.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered Appointments
  const filtered = appointments.filter((a) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return ['confirmed', 'delay_reported', 'rescheduled', 'reschedule_requested'].includes(a.status);
    return a.status === statusFilter;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172b28]">My Appointments</h1>
          <p className="text-xs text-[#637670] mt-0.5">
            Manage your bookings, respond to doctor reschedule requests, report travel delays, or reschedule visits.
          </p>
        </div>
        <Link
          href="/search"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#137b65] text-white text-xs font-bold shadow-xs hover:bg-[#0e6351] transition self-start sm:self-auto"
        >
          Book New Visit <ArrowRight size={13} />
        </Link>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-[#edf7f1] border border-[#bce2cc] text-[#137b65] text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-[#137b65] hover:opacity-80">
            <X size={14} />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-700 hover:opacity-80">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Status Filter Tabs (Scrollable on phone without scrollbar) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        {[
          { id: 'all', label: 'All Appointments' },
          { id: 'active', label: 'Active Queue' },
          { id: 'reschedule_requested', label: 'Doctor Reschedule Requests' },
          { id: 'confirmed', label: 'Confirmed' },
          { id: 'delay_reported', label: 'Delay Reported' },
          { id: 'rescheduled', label: 'Rescheduled' },
          { id: 'cancelled_by_doctor', label: 'Doctor Cancelled' },
          { id: 'cancelled', label: 'Cancelled' },
          { id: 'completed', label: 'Completed' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition ${
              statusFilter === tab.id
                ? 'bg-[#137b65] text-white shadow-xs'
                : 'bg-white border border-[#dce6df] text-[#4d625b] hover:bg-[#f2f7f4]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[#71847e]">Loading appointments...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#e2ece5] rounded-3xl p-12 text-center max-w-md mx-auto">
          <CalendarCheck size={36} className="text-[#9ab1a6] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#172b28]">No appointments found</h3>
          <p className="text-xs text-[#637770] mt-1 mb-4 leading-relaxed">
            You don&apos;t have any appointments matching the current filter.
          </p>
          <Link
            href="/search"
            className="px-4 py-2 rounded-xl bg-[#137b65] text-white text-xs font-bold"
          >
            Find a doctor
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((appt) => {
            const isDoctorReschedulePending = appt.status === 'reschedule_requested';
            const isCancelledByDoc = appt.status === 'cancelled_by_doctor';
            const isActive = ['confirmed', 'delay_reported', 'rescheduled'].includes(appt.status);

            return (
              <div
                key={appt.id}
                className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 transition ${
                  isDoctorReschedulePending
                    ? 'border-amber-400 bg-[#fffdf7] ring-2 ring-amber-400/20 shadow-md'
                    : isCancelledByDoc
                    ? 'border-red-200 bg-red-50/20'
                    : 'border-[#e2ece5]'
                }`}
              >
                <div className="space-y-2.5 flex-1">
                  
                  {/* Status & Ref Pill */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] font-bold text-[#137b65] bg-[#eaf5ee] px-2 py-0.5 rounded">
                      {appt.booking_reference}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        isDoctorReschedulePending
                          ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                          : isCancelledByDoc
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : appt.status === 'delay_reported'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : appt.status === 'cancelled'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : appt.status === 'completed'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-[#e8f5ec] text-[#137b65] border border-[#b8dec6]'
                      }`}
                    >
                      {isDoctorReschedulePending
                        ? 'ACTION NEEDED: DOCTOR REQUESTED RESCHEDULE'
                        : isCancelledByDoc
                        ? 'CANCELLED BY DOCTOR'
                        : appt.status === 'delay_reported'
                        ? `Delay Reported (+${appt.delay_minutes}m)`
                        : appt.status.toUpperCase()}
                    </span>
                    <span className="text-[11px] text-[#71847e]">
                      Booked on {new Date(appt.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Doctor Info */}
                  <div className="flex items-center gap-3">
                    <DoctorAvatarImage
                      name={appt.doctor_name}
                      specialty={appt.doctor_specialties?.[0]}
                      size={44}
                      showBadge={true}
                      className="w-11 h-11 rounded-xl shrink-0 border border-white shadow-xs"
                    />
                    <div>
                      <h3 className="text-base font-bold text-[#172b28]">{appt.doctor_name}</h3>
                      <p className="text-xs text-[#52645e] font-medium">
                        {appt.doctor_specialties?.join(', ')} ·{' '}
                        <span className="text-[#172b28] font-bold">{appt.facility_name}</span>
                      </p>
                    </div>
                  </div>

                  {/* Date & Location */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#4b6058] pt-0.5">
                    <span className="flex items-center gap-1 font-semibold text-[#172b28]">
                      <Clock size={13} className="text-[#137b65]" />
                      Current: {appt.appointment_date} at {appt.slot_time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={13} className="text-[#137b65]" />
                      {appt.facility_address || 'Clinic address'}
                    </span>
                  </div>

                  {/* ── HIGHLIGHTED DOCTOR RESCHEDULE REQUEST BOX ── */}
                  {isDoctorReschedulePending && appt.latest_proposal && (
                    <div className="mt-3 p-4 bg-amber-50 rounded-2xl border-2 border-amber-300 text-xs text-amber-950 space-y-3 shadow-xs">
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={18} className="text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-extrabold text-sm text-amber-900">
                            {appt.doctor_name} requested to reschedule your appointment
                          </div>
                          <div className="text-xs font-semibold text-amber-800 mt-1">
                            {appt.notes || 'Emergency clinical duty / surgery conflict'}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-white/90 rounded-xl border border-amber-200 flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider block">
                            Proposed New Visit Time:
                          </span>
                          <span className="text-sm font-extrabold text-[#172b28] flex items-center gap-1.5 mt-0.5">
                            <Calendar size={15} className="text-[#137b65]" />
                            {appt.latest_proposal.proposed_date} at {appt.latest_proposal.proposed_slot_time}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#556963] font-medium">
                          100% Guaranteed slot hold
                        </div>
                      </div>

                      {/* Patient Decision Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          onClick={() => handleAcceptDoctorReschedule(appt.id)}
                          disabled={actionLoading}
                          className="px-4 py-2 rounded-xl bg-[#137b65] text-white font-bold text-xs hover:bg-[#0c5949] shadow-sm transition flex items-center gap-1.5"
                        >
                          <Check size={14} /> Accept New Time
                        </button>

                        <button
                          onClick={() => {
                            setAlternatePickModalAppt(appt);
                            setAlternateDate(appt.latest_proposal.proposed_date);
                          }}
                          disabled={actionLoading}
                          className="px-4 py-2 rounded-xl bg-white border border-[#cadbd0] text-[#1c302a] font-bold text-xs hover:bg-[#f2f7f4] transition"
                        >
                          Pick Another Slot
                        </button>

                        <button
                          onClick={() => handleDeclineAndCancel(appt.id)}
                          disabled={actionLoading}
                          className="px-3 py-2 rounded-xl text-red-700 hover:bg-red-50 text-xs font-semibold transition"
                        >
                          Decline &amp; Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Cancellation by Doctor Alert */}
                  {isCancelledByDoc && (
                    <div className="mt-2 p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-800 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={15} className="text-red-600 shrink-0" />
                        <div>
                          <span className="font-bold">Visit Cancelled by Doctor:</span> {appt.notes || 'Emergency OT Duty'}
                        </div>
                      </div>
                      <Link
                        href={`/search?service=${encodeURIComponent(appt.doctor_specialties?.[0] || 'General Physician')}`}
                        className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold text-[11px] hover:bg-red-700 transition"
                      >
                        Find Alternative Doctor
                      </Link>
                    </div>
                  )}

                </div>

                {/* Standard Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-[#f0f4f1]">
                  {isActive && (
                    <>
                      <button
                        onClick={() => {
                          setDelayModalAppt(appt);
                          setDelayMinutes(15);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 font-semibold text-xs transition"
                      >
                        I will be late
                      </button>

                      <button
                        onClick={() => {
                          setRescheduleModalAppt(appt);
                          setNewDate(appt.appointment_date);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#f0f6f2] text-[#137b65] border border-[#cde2d4] hover:bg-[#e4f3ea] font-semibold text-xs transition"
                      >
                        Reschedule
                      </button>

                      <button
                        onClick={() => handleCancel(appt.id)}
                        className="px-3 py-1.5 rounded-xl bg-white text-red-600 border border-red-200 hover:bg-red-50 font-semibold text-xs transition"
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  <Link
                    href="/dashboard/care-passport"
                    className="p-2 rounded-xl text-[#6d827a] hover:bg-[#edf3ee] transition border border-transparent hover:border-[#d5e2d9]"
                    title="View Care Passport history"
                  >
                    <History size={16} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── PATIENT PICK ALTERNATE SLOT MODAL (In response to Doctor) ── */}
      {alternatePickModalAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#dce7e0]">
            <div className="flex items-center justify-between pb-3 border-b border-[#eef2ef] mb-4">
              <div>
                <h3 className="text-base font-bold text-[#172b28]">Select Alternative Slot</h3>
                <p className="text-xs text-[#71847e]">Doctor: {alternatePickModalAppt.doctor_name}</p>
              </div>
              <button
                onClick={() => setAlternatePickModalAppt(null)}
                className="p-1.5 text-[#73857f] hover:bg-[#edf2ee] rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAlternateSlotSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#172b28] mb-1.5">
                  Select Convenient Date
                </label>
                <input
                  type="date"
                  required
                  value={alternateDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setAlternateDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#d6e2dc] bg-[#f8faf9] focus:bg-white focus:border-[#137b65] outline-none font-medium text-[#172b28]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172b28] mb-1.5 flex items-center justify-between">
                  <span>Select Time Slot</span>
                  {alternateSlotsLoading && (
                    <span className="text-[10px] text-[#137b65] flex items-center gap-1">
                      <Loader2 size={11} className="animate-spin" /> Loading slots...
                    </span>
                  )}
                </label>
                {alternateSlots.filter(s => s.is_available).length === 0 ? (
                  <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    No open slots on this date. Please pick another date.
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {alternateSlots.filter(s => s.is_available).map((s) => (
                      <button
                        type="button"
                        key={s.slot_time}
                        onClick={() => setAlternateSlot(s.slot_time)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition text-center ${
                          alternateSlot === s.slot_time
                            ? 'bg-[#137b65] text-white shadow-xs'
                            : 'bg-[#f4f8f5] text-[#203630] border border-[#d2dfd8] hover:bg-[#e4f3ea]'
                        }`}
                      >
                        {s.slot_time}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAlternatePickModalAppt(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#576b64] hover:bg-[#edf2ee]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !alternateSlot}
                  className="px-5 py-2.5 rounded-xl bg-[#137b65] text-white text-xs font-bold hover:bg-[#0c5949] shadow-md transition disabled:opacity-50"
                >
                  Confirm Alternate Time
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delay Modal */}
      {delayModalAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#dce7e0]">
            <div className="flex items-center justify-between pb-3 border-b border-[#eef2ef] mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Clock size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#172b28]">Report Arrival Delay</h3>
                  <p className="text-[11px] text-[#71847e]">{delayModalAppt.booking_reference}</p>
                </div>
              </div>
              <button onClick={() => setDelayModalAppt(null)} className="p-1 text-[#73857f] hover:bg-[#edf2ee] rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReportDelay} className="space-y-4">
              <p className="text-xs text-[#52665f] leading-relaxed">
                Notify <strong>{delayModalAppt.doctor_name}</strong> that you will arrive slightly late. The clinic will be asked to hold your slot without cancellation.
              </p>

              <div>
                <label className="block text-xs font-bold text-[#172b28] mb-1.5">
                  Estimated Delay
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 30, 45].map((mins) => (
                    <button
                      type="button"
                      key={mins}
                      onClick={() => setDelayMinutes(mins)}
                      className={`py-2 rounded-xl text-xs font-bold transition ${
                        delayMinutes === mins
                          ? 'bg-[#137b65] text-white shadow-xs'
                          : 'bg-[#f4f8f5] text-[#253d36] border border-[#d3e2d9] hover:bg-[#e4f3ea]'
                      }`}
                    >
                      +{mins} mins
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172b28] mb-1">
                  Reason for Delay (Optional)
                </label>
                <input
                  type="text"
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  placeholder="e.g. Bus delayed in traffic near Atlas Road"
                  className="w-full text-xs p-2.5 rounded-xl border border-[#d6e2dc] bg-[#f8faf9] focus:bg-white focus:border-[#137b65] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDelayModalAppt(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#576b64] hover:bg-[#edf2ee]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-[#137b65] text-white text-xs font-bold hover:bg-[#0c5949] shadow-xs transition"
                >
                  Confirm Delay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient Standard Reschedule Modal */}
      {rescheduleModalAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#dce7e0]">
            <div className="flex items-center justify-between pb-3 border-b border-[#eef2ef] mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#eaf4ee] text-[#137b65] flex items-center justify-center">
                  <RefreshCw size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#172b28]">Reschedule Appointment</h3>
                  <p className="text-[11px] text-[#71847e]">{rescheduleModalAppt.booking_reference}</p>
                </div>
              </div>
              <button onClick={() => setRescheduleModalAppt(null)} className="p-1 text-[#73857f] hover:bg-[#edf2ee] rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReschedule} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#172b28] mb-1.5">
                  Select New Date
                </label>
                <input
                  type="date"
                  required
                  value={newDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#d6e2dc] bg-[#f8faf9] focus:bg-white focus:border-[#137b65] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172b28] mb-1.5 flex items-center justify-between">
                  <span>Select Slot</span>
                  {slotsLoading && <span className="text-[10px] text-[#137b65]">Loading slots...</span>}
                </label>
                {availableSlots.filter((s) => s.is_available).length === 0 ? (
                  <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">
                    No available slots on this date.
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.filter((s) => s.is_available).map((s) => (
                      <button
                        type="button"
                        key={s.slot_time}
                        onClick={() => setNewSlot(s.slot_time)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold transition text-center ${
                          newSlot === s.slot_time
                            ? 'bg-[#137b65] text-white shadow-xs'
                            : 'bg-[#f4f8f5] text-[#203630] border border-[#d2dfd8] hover:bg-[#e4f3ea]'
                        }`}
                      >
                        {s.slot_time}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRescheduleModalAppt(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#576b64] hover:bg-[#edf2ee]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !newSlot}
                  className="px-4 py-2 rounded-xl bg-[#137b65] text-white text-xs font-bold hover:bg-[#0c5949] shadow-xs transition disabled:opacity-50"
                >
                  Save Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
