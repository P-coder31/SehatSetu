'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CalendarCheck, CheckCircle2, X, Clock, AlertTriangle,
  Calendar, Send, RefreshCw, AlertCircle, User, Loader2
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

const CLINICAL_RESCHEDULE_REASONS = [
  "🚨 Emergency OT Surgery / ICU On-Call",
  "🤒 Doctor Sick Leave / Health Emergency",
  "🏛️ Clinical Duty / Hospital OPD Overrun",
  "⚠️ Clinic Infrastructure / Technical Issue",
  "📝 Personal Emergency / Unavoidable Conflict"
];

const CLINICAL_CANCEL_REASONS = [
  "🚨 Emergency OT Surgery / ICU Duty",
  "🏥 Urgent In-Patient Ward Rounds",
  "🤒 Doctor Emergency Medical Leave",
  "⚠️ Facility Sanitization / Infrastructure Failure",
  "📝 Unavoidable Clinical Schedule Conflict"
];

export default function ProfessionalAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Doctor Reschedule Modal
  const [rescheduleModalAppt, setRescheduleModalAppt] = useState<any | null>(null);
  const [selectedReason, setSelectedReason] = useState(CLINICAL_RESCHEDULE_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [targetSlot, setTargetSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Doctor Cancel Modal
  const [cancelModalAppt, setCancelModalAppt] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState(CLINICAL_CANCEL_REASONS[0]);
  const [cancelNotes, setCancelNotes] = useState('');

  const fetchAppts = async () => {
    try {
      const data = await apiRequest<any[]>('/professional/appointments');
      setAppointments(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppts();
  }, []);

  // Set default targetDate to tomorrow when reschedule modal opens
  useEffect(() => {
    if (rescheduleModalAppt) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const dd = String(tomorrow.getDate()).padStart(2, '0');
      setTargetDate(`${yyyy}-${mm}-${dd}`);
      setSelectedReason(CLINICAL_RESCHEDULE_REASONS[0]);
      setCustomReason('');
      setDoctorNotes('');
    }
  }, [rescheduleModalAppt]);

  // Fetch doctor slots when targetDate changes
  useEffect(() => {
    if (!rescheduleModalAppt || !targetDate) return;
    setSlotsLoading(true);
    apiRequest<{ slots: any[] }>(`/discovery/slots?professional_id=${rescheduleModalAppt.professional_id}&target_date=${targetDate}`)
      .then((res) => {
        const slots = res.slots || [];
        setAvailableSlots(slots);
        const firstAvail = slots.find((s: any) => s.is_available);
        setTargetSlot(firstAvail ? firstAvail.slot_time : '');
      })
      .catch(() => {
        // Fallback default slots
        setAvailableSlots([
          { slot_time: '10:00', is_available: true },
          { slot_time: '11:30', is_available: true },
          { slot_time: '14:00', is_available: true },
          { slot_time: '16:30', is_available: true }
        ]);
        setTargetSlot('10:00');
      })
      .finally(() => setSlotsLoading(false));
  }, [targetDate, rescheduleModalAppt]);

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      await apiRequest(`/professional/appointments/${id}/status?new_status=${newStatus}`, {
        method: 'PATCH',
      });
      setSuccessMsg(`Appointment marked as ${newStatus}.`);
      await fetchAppts();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating status.');
    }
  };

  const handleDoctorSubmitReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleModalAppt || !targetDate || !targetSlot) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const finalReason = selectedReason.includes('Other') ? customReason : selectedReason;
      await apiRequest(`/professional/appointments/${rescheduleModalAppt.id}/request-reschedule`, {
        method: 'POST',
        body: JSON.stringify({
          new_date: targetDate,
          new_slot_time: targetSlot,
          reason: finalReason || 'Clinical Duty Overrun',
          notes: doctorNotes.trim() || undefined
        })
      });
      setSuccessMsg(`Reschedule request sent to patient ${rescheduleModalAppt.patient_name}. Patient notified.`);
      setRescheduleModalAppt(null);
      await fetchAppts();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit reschedule request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDoctorSubmitCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalAppt) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await apiRequest(`/professional/appointments/${cancelModalAppt.id}/request-cancel`, {
        method: 'POST',
        body: JSON.stringify({
          reason: cancelReason,
          notes: cancelNotes.trim() || undefined
        })
      });
      setSuccessMsg(`Visit cancelled. Patient ${cancelModalAppt.patient_name} notified with your explanation.`);
      setCancelModalAppt(null);
      await fetchAppts();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to cancel appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = appointments.filter((a) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return ['confirmed', 'delay_reported', 'rescheduled', 'reschedule_requested'].includes(a.status);
    return a.status === statusFilter;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172b28]">Clinical Appointment Management</h1>
          <p className="text-xs text-[#617670] mt-0.5">
            Review appointments, propose patient-notified reschedules, or log clinical cancellations with notifications.
          </p>
        </div>
        <Link
          href="/professional/dashboard"
          className="px-4 py-2 rounded-xl border border-[#cadbd1] text-[#2c413b] text-xs font-semibold hover:bg-[#f2f7f4] transition self-start sm:self-auto"
        >
          Back to Dashboard
        </Link>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-[#edf7f1] border border-[#bce2cc] text-[#137b65] text-xs flex items-center justify-between">
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
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-700 hover:opacity-80">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filter Tabs (Horizontal scroll on phones without scrollbar) */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 no-scrollbar">
        {[
          { id: 'all', label: 'All' },
          { id: 'active', label: 'Active Queue' },
          { id: 'confirmed', label: 'Confirmed' },
          { id: 'delay_reported', label: 'Delay Reported' },
          { id: 'reschedule_requested', label: 'Reschedule Pending' },
          { id: 'rescheduled', label: 'Rescheduled' },
          { id: 'completed', label: 'Completed' },
          { id: 'cancelled_by_doctor', label: 'Doctor Cancelled' },
          { id: 'cancelled', label: 'Cancelled' },
          { id: 'noshow', label: 'No Show' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl font-semibold capitalize whitespace-nowrap transition ${
              statusFilter === tab.id
                ? 'bg-[#137b65] text-white shadow-xs'
                : 'bg-white border border-[#dce6df] text-[#4d625b] hover:bg-[#f2f7f4]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-[#71847e]">Loading appointment records...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#e2ede5] rounded-3xl p-12 text-center max-w-md mx-auto">
          <CalendarCheck size={36} className="text-[#9ab1a6] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#172b28]">No appointments in this view</h3>
          <p className="text-xs text-[#637770] mt-1">Change your filter tab to see other patient records.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((a) => {
            const isPendingReschedule = a.status === 'reschedule_requested';
            const isCancelledByDoc = a.status === 'cancelled_by_doctor';
            const isActive = ['confirmed', 'delay_reported', 'rescheduled'].includes(a.status);

            return (
              <div
                key={a.id}
                className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                  isPendingReschedule
                    ? 'border-amber-300 bg-amber-50/20'
                    : isCancelledByDoc
                    ? 'border-red-200 bg-red-50/20'
                    : 'border-[#e2ece5]'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] font-bold text-[#137b65] bg-[#eaf5ee] px-2 py-0.5 rounded">
                      {a.booking_reference}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        isPendingReschedule
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : isCancelledByDoc
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : a.status === 'delay_reported'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : a.status === 'completed'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-[#e8f5ec] text-[#137b65]'
                      }`}
                    >
                      {isPendingReschedule
                        ? 'RESCHEDULE PENDING PATIENT CONFIRMATION'
                        : isCancelledByDoc
                        ? 'CANCELLED BY DOCTOR'
                        : a.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#172b28] flex items-center gap-2">
                    <User size={16} className="text-[#137b65]" />
                    {a.patient_name} · <span className="font-normal text-xs text-[#596d66]">{a.facility_name}</span>
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#52645e]">
                    <span className="font-semibold text-[#172b28]">
                      {a.appointment_date} at {a.slot_time}
                    </span>
                    {a.chief_complaint && (
                      <span className="italic text-[#687b74]">
                        Complaint: &ldquo;{a.chief_complaint}&rdquo;
                      </span>
                    )}
                  </div>

                  {/* Reschedule Proposal Details Alert */}
                  {isPendingReschedule && a.latest_proposal && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2 max-w-xl">
                      <Clock size={15} className="text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold">You proposed a new visit time:</div>
                        <div>
                          {a.latest_proposal.proposed_date} at {a.latest_proposal.proposed_slot_time}
                        </div>
                        {a.notes && <div className="text-[11px] text-amber-800 mt-0.5">{a.notes}</div>}
                        <div className="text-[10px] text-amber-700 mt-1 italic">
                          Patient has been notified via SMS &amp; portal. Awaiting patient acceptance.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cancellation Reason Alert */}
                  {isCancelledByDoc && a.notes && (
                    <div className="p-2.5 bg-red-50 rounded-xl border border-red-200 text-xs text-red-800 flex items-center gap-2">
                      <AlertTriangle size={14} className="shrink-0 text-red-600" />
                      <span>{a.notes}</span>
                    </div>
                  )}
                </div>

                {/* Status Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-[#f0f4f1]">
                  {isActive && (
                    <>
                      {/* Doctor Request Reschedule Button */}
                      <button
                        onClick={() => setRescheduleModalAppt(a)}
                        className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 font-semibold text-xs transition flex items-center gap-1.5"
                      >
                        <Clock size={13} /> Request Reschedule
                      </button>

                      {/* Doctor Request Cancellation Button */}
                      <button
                        onClick={() => setCancelModalAppt(a)}
                        className="px-3 py-1.5 rounded-xl bg-white text-red-700 border border-red-200 hover:bg-red-50 font-semibold text-xs transition flex items-center gap-1.5"
                      >
                        <X size={13} /> Cancel Visit
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(a.id, 'completed')}
                        className="px-3 py-1.5 rounded-xl bg-[#eaf4ee] text-[#137b65] hover:bg-[#d8ecdf] font-semibold text-xs transition"
                      >
                        Complete
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(a.id, 'noshow')}
                        className="px-3 py-1.5 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 font-semibold text-xs transition"
                      >
                        No Show
                      </button>
                    </>
                  )}

                  {isPendingReschedule && (
                    <button
                      onClick={() => handleUpdateStatus(a.id, 'confirmed')}
                      className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold text-xs transition"
                    >
                      Revert Request
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── DOCTOR RESCHEDULE REQUEST MODAL ── */}
      {rescheduleModalAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#dce7e0] max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#eef2ef] mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Clock size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172b28]">Propose Reschedule to Patient</h3>
                  <p className="text-xs text-[#71847e]">Patient: <strong>{rescheduleModalAppt.patient_name}</strong> ({rescheduleModalAppt.booking_reference})</p>
                </div>
              </div>
              <button
                onClick={() => setRescheduleModalAppt(null)}
                className="p-1.5 text-[#73857f] hover:bg-[#edf2ee] rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleDoctorSubmitReschedule} className="space-y-4">
              {/* Clinical Reason Picker */}
              <div>
                <label className="block text-xs font-bold text-[#172b28] mb-1.5">
                  Clinical / Unforeseen Reason for Reschedule
                </label>
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#d6e2dc] bg-[#f8faf9] focus:bg-white focus:border-[#137b65] outline-none transition"
                >
                  {CLINICAL_RESCHEDULE_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {selectedReason.includes('Other') && (
                <div>
                  <label className="block text-xs font-bold text-[#172b28] mb-1">
                    Describe Reason
                  </label>
                  <input
                    type="text"
                    required
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="e.g. Urgent emergency conference"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#d6e2dc] bg-[#f8faf9] focus:bg-white focus:border-[#137b65] outline-none"
                  />
                </div>
              )}

              {/* Target Date Selector */}
              <div>
                <label className="block text-xs font-bold text-[#172b28] mb-1.5 flex items-center gap-1.5">
                  <Calendar size={14} className="text-[#137b65]" /> Propose New Date
                </label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#d6e2dc] bg-[#f8faf9] focus:bg-white focus:border-[#137b65] outline-none font-medium text-[#172b28]"
                />
              </div>

              {/* Live Slot Selector */}
              <div>
                <label className="block text-xs font-bold text-[#172b28] mb-1.5 flex items-center justify-between">
                  <span>Propose Time Slot</span>
                  {slotsLoading && <span className="text-[10px] text-[#137b65] flex items-center gap-1"><Loader2 size={11} className="animate-spin" /> Checking availability...</span>}
                </label>
                {availableSlots.filter(s => s.is_available).length === 0 ? (
                  <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                    No open slots found on this date. Please pick another date.
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.filter(s => s.is_available).map((s) => (
                      <button
                        type="button"
                        key={s.slot_time}
                        onClick={() => setTargetSlot(s.slot_time)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition text-center ${
                          targetSlot === s.slot_time
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

              {/* Optional Doctor Note to Patient */}
              <div>
                <label className="block text-xs font-bold text-[#172b28] mb-1">
                  Personal Note or Guidance to Patient (Optional)
                </label>
                <textarea
                  rows={2}
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="e.g. Sincere apologies for the delay. We will take your consultation on priority at this time."
                  className="w-full text-xs p-2.5 rounded-xl border border-[#d6e2dc] bg-[#f8faf9] focus:bg-white focus:border-[#137b65] outline-none resize-none"
                />
              </div>

              {/* Notification Guarantee Box */}
              <div className="p-3 bg-[#f0f7f3] rounded-2xl border border-[#cbe3d4] text-[11px] text-[#254d40] space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-[#137b65]">
                  <Send size={12} /> Patient Notification Guarantee
                </div>
                <p>
                  Submitting this will send an urgent portal alert &amp; notification to <strong>{rescheduleModalAppt.patient_name}</strong>. The patient will be given 1-click options to <strong>Confirm the New Time</strong> or <strong>Pick an Alternate Slot</strong>.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRescheduleModalAppt(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#576b64] hover:bg-[#edf2ee]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !targetSlot}
                  className="px-5 py-2.5 rounded-xl bg-[#137b65] text-white text-xs font-bold hover:bg-[#0c5949] shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Sending...
                    </>
                  ) : (
                    <>
                      <Send size={13} /> Send Reschedule Request
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ── DOCTOR CANCEL VISIT MODAL ── */}
      {cancelModalAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#dce7e0]">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#eef2ef] mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-100 text-red-800 flex items-center justify-center">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172b28]">Cancel Visit &amp; Notify Patient</h3>
                  <p className="text-xs text-[#71847e]">{cancelModalAppt.patient_name} ({cancelModalAppt.booking_reference})</p>
                </div>
              </div>
              <button
                onClick={() => setCancelModalAppt(null)}
                className="p-1.5 text-[#73857f] hover:bg-[#edf2ee] rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleDoctorSubmitCancel} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#172b28] mb-1.5">
                  Reason for Cancellation
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#d6e2dc] bg-[#f8faf9] focus:bg-white focus:border-[#137b65] outline-none"
                >
                  {CLINICAL_CANCEL_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172b28] mb-1">
                  Guidance / Apology Note for Patient
                </label>
                <textarea
                  rows={2}
                  value={cancelNotes}
                  onChange={(e) => setCancelNotes(e.target.value)}
                  placeholder="e.g. Please consult the duty doctor in OPD-2 if immediate care is needed."
                  className="w-full text-xs p-2.5 rounded-xl border border-[#d6e2dc] bg-[#f8faf9] focus:bg-white focus:border-[#137b65] outline-none resize-none"
                />
              </div>

              <div className="p-3 bg-red-50 rounded-2xl border border-red-200 text-[11px] text-red-900 leading-relaxed">
                The appointment slot will be released, and <strong>{cancelModalAppt.patient_name}</strong> will receive an immediate notification with your explanation and zero-charge alternative doctor discovery options.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalAppt(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#576b64] hover:bg-[#edf2ee]"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Notifying...
                    </>
                  ) : (
                    <>
                      <Send size={13} /> Notify Patient &amp; Cancel
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
