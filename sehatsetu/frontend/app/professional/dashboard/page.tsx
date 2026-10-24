'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar, Clock, CheckCircle2,
  X, ShieldCheck, ArrowRight
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';

export default function ProfessionalDashboard() {
  const { user, loading: authLoading, quickDemoLogin } = useAuth();

  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Propose alternative slot state
  const [proposeModalAppt, setProposeModalAppt] = useState<any | null>(null);
  const [altDate, setAltDate] = useState<string>('');
  const [altSlot, setAltSlot] = useState<string>('12:00');

  const fetchDashboard = async () => {
    try {
      const data = await apiRequest<any>('/professional/dashboard');
      setDashboardData(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'professional') {
        // Auto-login as Dr. Rajesh Kumar for demo
        quickDemoLogin('professional').then(fetchDashboard);
      } else {
        fetchDashboard();
      }
    }
  }, [user, authLoading, quickDemoLogin]);

  // Handle delay approval
  const handleApproveDelay = async (apptId: number) => {
    setActionLoading(true);
    try {
      await apiRequest('/care-continuity/clinic-response', {
        method: 'POST',
        body: JSON.stringify({
          appointment_id: apptId,
          approve: true,
          notes: 'Clinic approved late arrival.',
        }),
      });
      setSuccessMsg('Late arrival approved. Patient Care Passport updated.');
      await fetchDashboard();
    } catch (err: any) {
      alert(err.message || 'Error approving delay.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle alternative proposal
  const handleProposeAlternative = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposeModalAppt) return;
    setActionLoading(true);
    try {
      await apiRequest('/care-continuity/clinic-response', {
        method: 'POST',
        body: JSON.stringify({
          appointment_id: proposeModalAppt.id,
          approve: false,
          notes: 'Schedule is tightly packed. Proposing next open consultation window.',
          propose_alternative_date: altDate,
          propose_alternative_slot: altSlot,
        }),
      });
      setSuccessMsg('Alternative time proposed to patient.');
      setProposeModalAppt(null);
      await fetchDashboard();
    } catch (err: any) {
      alert(err.message || 'Error proposing alternative slot.');
    } finally {
      setActionLoading(false);
    }
  };

  // Mark Completed
  const handleMarkCompleted = async (apptId: number) => {
    try {
      await apiRequest(`/professional/appointments/${apptId}/status?new_status=completed`, {
        method: 'PATCH',
      });
      setSuccessMsg('Appointment marked as completed.');
      await fetchDashboard();
    } catch (err: any) {
      alert(err.message || 'Error updating status.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="bg-[#172b28] text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-[#82c8b7] uppercase tracking-wider">
              Doctor Clinical Workspace
            </span>
            {dashboardData?.verification_status === 'verified' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#137b65] text-white px-2 py-0.5 rounded-full">
                <ShieldCheck size={11} /> Verified Practitioner
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {dashboardData?.doctor_name || 'Dr. Rajesh Kumar'}
          </h1>
          <p className="text-xs text-[#b8d6cb] mt-1 max-w-lg leading-relaxed">
            Today&apos;s schedule: {dashboardData?.stats?.today_count || 0} visits scheduled · {dashboardData?.pending_delays?.length || 0} active delay requests
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/professional/availability"
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition"
          >
            Manage Working Hours
          </Link>
          <Link
            href="/professional/appointments"
            className="px-4 py-2 rounded-xl bg-[#137b65] hover:bg-[#0e6351] text-white text-xs font-bold transition shadow-xs"
          >
            All Appointments
          </Link>
        </div>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#e2ece5] rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-bold text-[#6a7d76] uppercase tracking-wider block">Today&apos;s Schedule</span>
          <span className="text-2xl font-bold text-[#172b28] mt-1 block">
            {dashboardData?.stats?.today_count || 0}
          </span>
          <span className="text-[11px] text-[#6e827a] mt-0.5 block">Booked consultations</span>
        </div>

        <div className="bg-white border border-[#e2ece5] rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Pending Delays</span>
          <span className="text-2xl font-bold text-amber-800 mt-1 block">
            {dashboardData?.pending_delays?.length || 0}
          </span>
          <span className="text-[11px] text-amber-700 mt-0.5 block">Patients reported late</span>
        </div>

        <div className="bg-white border border-[#e2ece5] rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-bold text-[#137b65] uppercase tracking-wider block">Total Active</span>
          <span className="text-2xl font-bold text-[#137b65] mt-1 block">
            {dashboardData?.stats?.total_active || 0}
          </span>
          <span className="text-[11px] text-[#6e827a] mt-0.5 block">Upcoming bookings</span>
        </div>

        <div className="bg-white border border-[#e2ece5] rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-bold text-[#6a7d76] uppercase tracking-wider block">Completed</span>
          <span className="text-2xl font-bold text-[#172b28] mt-1 block">
            {dashboardData?.stats?.total_completed || 0}
          </span>
          <span className="text-[11px] text-[#6e827a] mt-0.5 block">Patient visits finished</span>
        </div>
      </div>

      {/* Active Delay Management Queue */}
      {dashboardData?.pending_delays && dashboardData.pending_delays.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-amber-800" />
            <h2 className="text-sm font-bold text-amber-950">
              Action Required: Patient Delay Notifications ({dashboardData.pending_delays.length})
            </h2>
          </div>

          <div className="space-y-3">
            {dashboardData.pending_delays.map((del: any) => (
              <div
                key={del.id}
                className="bg-white border border-amber-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                      {del.booking_reference}
                    </span>
                    <h3 className="text-xs font-bold text-[#172b28]">{del.patient_name}</h3>
                    <span className="text-[11px] text-amber-800 font-semibold">
                      Reported: +{del.delay_minutes} min late
                    </span>
                  </div>
                  <p className="text-xs text-[#52645e] mt-1">
                    Original slot: <strong>{del.slot_time}</strong> · {del.facility_name}
                  </p>
                  {del.chief_complaint && (
                    <p className="text-[11px] text-[#6b7e77] italic mt-0.5">
                      Complaint: &ldquo;{del.chief_complaint}&rdquo;
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApproveDelay(del.id)}
                    disabled={actionLoading}
                    className="px-3 py-1.5 rounded-xl bg-[#137b65] text-white text-xs font-bold hover:bg-[#0e6351] transition"
                  >
                    Confirm &amp; Hold Slot
                  </button>
                  <button
                    onClick={() => {
                      setProposeModalAppt(del);
                      setAltDate(del.appointment_date);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs font-bold hover:bg-amber-100 transition"
                  >
                    Propose Alternative Slot
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Schedule */}
      <div className="bg-white border border-[#e2ece5] rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-[#edf3ee] mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-[#137b65]" />
            <h2 className="text-base font-bold text-[#172b28]">Today&apos;s Appointments</h2>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/professional/calendar"
              className="text-xs font-bold text-[#137b65] hover:underline flex items-center gap-1"
            >
              <Calendar size={13} /> Full Schedule Calendar
            </Link>
            <span className="text-[#ccd9d2] text-xs">|</span>
            <Link
              href="/professional/appointments"
              className="text-xs font-bold text-[#137b65] hover:underline flex items-center gap-1"
            >
              All appointments <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-[#6e827a]">Loading schedule...</div>
        ) : !dashboardData?.today_appointments || dashboardData.today_appointments.length === 0 ? (
          <div className="py-10 text-center text-xs text-[#6e827a]">
            No patient appointments scheduled for today.
          </div>
        ) : (
          <div className="space-y-3">
            {dashboardData.today_appointments.map((a: any) => (
              <div
                key={a.id}
                className="p-4 rounded-2xl border border-[#e9eee9] bg-[#fbfcfa] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#137b65]">{a.slot_time}</span>
                    <span className="text-xs font-bold text-[#172b28]">{a.patient_name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-white border border-[#d6e5dc] text-[#556963]">
                      {a.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#52645e] mt-1">
                    {a.facility_name} · Complaint: {a.chief_complaint || 'General'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {a.status !== 'completed' && a.status !== 'cancelled' && (
                    <button
                      onClick={() => handleMarkCompleted(a.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#eaf4ee] text-[#137b65] hover:bg-[#d8ecdf] font-semibold text-xs transition"
                    >
                      Mark Completed
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Propose Alternative Slot Modal */}
      {proposeModalAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-[#dce7e0]">
            <div className="flex items-center justify-between pb-3 border-b border-[#eef2ef] mb-4">
              <h3 className="text-sm font-bold text-[#172b28]">Propose Alternative Slot</h3>
              <button onClick={() => setProposeModalAppt(null)} className="p-1 text-[#73857f] hover:bg-[#edf2ee] rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProposeAlternative} className="space-y-4 text-xs">
              <p className="text-[#556963] leading-relaxed">
                If you cannot accommodate <strong>{proposeModalAppt.patient_name}</strong>&apos;s delay, select an alternative slot to propose. The patient can review and accept this alternative time.
              </p>

              <div>
                <label className="block font-bold text-[#172b28] mb-1">Proposed Date</label>
                <input
                  type="date"
                  required
                  value={altDate}
                  onChange={(e) => setAltDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#d8e3dc] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#172b28] mb-1">Proposed Time Slot</label>
                <input
                  type="text"
                  required
                  value={altSlot}
                  onChange={(e) => setAltSlot(e.target.value)}
                  placeholder="e.g. 14:30"
                  className="w-full p-2.5 rounded-xl border border-[#d8e3dc] outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setProposeModalAppt(null)}
                  className="px-4 py-2 rounded-xl border border-[#d0ded5] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-[#137b65] text-white text-xs font-bold hover:bg-[#0e6351] transition"
                >
                  {actionLoading ? 'Sending Proposal...' : 'Send Proposal to Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
