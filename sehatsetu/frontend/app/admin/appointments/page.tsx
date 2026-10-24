'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  CalendarCheck, Search, Clock, CheckCircle2,
  XCircle, Copy, Check, Filter,
  Building2, Stethoscope, User, RefreshCw
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (searchTerm) params.set('q', searchTerm);
      const data = await apiRequest<any[]>(`/admin/appointments?${params.toString()}`);
      setAppointments(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleCopyRef = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#e8f6ee] text-[#137b65] border border-[#bce2cc]">
            <CheckCircle2 size={12} />
            Confirmed
          </span>
        );
      case 'delay_reported':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#fef7ea] text-[#b45309] border border-[#fde4b6] animate-pulse">
            <Clock size={12} />
            Delay Reported
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#f1f5f9] text-[#475569] border border-[#cbd5e1]">
            <CheckCircle2 size={12} />
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca]">
            <XCircle size={12} />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#f8faf8] text-[#556962] border border-[#e4eae5] capitalize">
            {status}
          </span>
        );
    }
  };

  const confirmedCount = appointments.filter((a) => a.status === 'confirmed').length;
  const delayCount = appointments.filter((a) => a.status === 'delay_reported').length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172b28]">System Appointments Registry</h1>
          <p className="text-xs text-[#5a7067] mt-0.5">
            Real-time view of state-wide clinical appointments, delay continuity events, and slot allocations.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchAppointments()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#d6e5dc] text-[#2c413b] text-xs font-semibold hover:bg-[#f2f7f4] transition cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <Link
            href="/admin/dashboard"
            className="px-3.5 py-2 rounded-xl bg-[#137b65] text-white text-xs font-semibold hover:bg-[#0f6754] transition shadow-xs"
          >
            Admin Dashboard
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-[#e2ece5] rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#6f827b] block">Total Loaded</span>
          <span className="text-2xl font-bold text-[#172b28] mt-1 block">{appointments.length}</span>
          <span className="text-[10px] text-[#788e84]">State records</span>
        </div>
        <div className="bg-white border border-[#e2ece5] rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#137b65] block">Confirmed</span>
          <span className="text-2xl font-bold text-[#137b65] mt-1 block">{confirmedCount}</span>
          <span className="text-[10px] text-[#788e84]">Active slots</span>
        </div>
        <div className="bg-white border border-[#e2ece5] rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#b45309] block">Delay Reported</span>
          <span className="text-2xl font-bold text-[#b45309] mt-1 block">{delayCount}</span>
          <span className="text-[10px] text-[#788e84]">Care Continuity active</span>
        </div>
        <div className="bg-white border border-[#e2ece5] rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#475569] block">Completed</span>
          <span className="text-2xl font-bold text-[#475569] mt-1 block">{completedCount}</span>
          <span className="text-[10px] text-[#788e84]">Consulted patients</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#e2ece5] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7d928a]" />
          <input
            type="text"
            placeholder="Search booking reference (e.g. APT-)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#dce6e0] bg-[#fbfdfc] text-xs text-[#172b28] placeholder-[#8ca097] outline-none focus:border-[#137b65]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={14} className="text-[#6d827a] shrink-0 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-44 px-3 py-2 rounded-xl border border-[#dce6e0] bg-[#fbfdfc] text-xs text-[#172b28] outline-none"
          >
            <option value="">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="delay_reported">Delay Reported</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white border border-[#e2ece5] rounded-3xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#6a8077]">
            Fetching appointments from database...
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#6a8077] space-y-2">
            <CalendarCheck size={32} className="mx-auto text-[#a2b5ac]" />
            <p className="font-semibold text-sm text-[#172b28]">No appointments match the criteria</p>
            <p className="text-[11px] text-[#7a8f86]">Try clearing filters or search queries</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f7faf8] border-b border-[#e6eee8] text-[#556b62] font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Booking Ref</th>
                  <th className="px-4 py-3.5">Schedule</th>
                  <th className="px-4 py-3.5">Patient</th>
                  <th className="px-4 py-3.5">Doctor &amp; Facility</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf3ee]">
                {appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-[#fbfdfc] transition">
                    {/* Booking Reference */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[#137b65]">
                          {appt.booking_reference}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyRef(appt.booking_reference)}
                          className="p-1 text-[#83978f] hover:text-[#137b65] rounded cursor-pointer"
                          title="Copy Reference"
                        >
                          {copiedRef === appt.booking_reference ? (
                            <Check size={12} className="text-[#137b65]" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                      <span className="text-[10px] text-[#7d928a] block mt-0.5">
                        ID: #{appt.id}
                      </span>
                    </td>

                    {/* Schedule Date & Time */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="font-semibold text-[#172b28]">{appt.appointment_date}</div>
                      <div className="text-[11px] text-[#5f746d] font-mono mt-0.5">
                        {appt.slot_time} ({appt.duration_minutes || 30} mins)
                      </div>
                    </td>

                    {/* Patient */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 font-bold text-[#172b28]">
                        <User size={13} className="text-[#137b65] shrink-0" />
                        <span>{appt.patient_name || 'Patient'}</span>
                      </div>
                      <div className="text-[11px] text-[#6d827a] mt-0.5">
                        {appt.patient_phone || appt.patient_email || 'Verified User'}
                      </div>
                    </td>

                    {/* Doctor & Facility */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 font-semibold text-[#172b28]">
                        <Stethoscope size={13} className="text-[#137b65] shrink-0" />
                        <span>{appt.doctor_name || 'Medical Officer'}</span>
                      </div>
                      <div className="text-[11px] text-[#6d827a] flex items-center gap-1 mt-0.5">
                        <Building2 size={11} className="text-[#8ca097]" />
                        <span>{appt.facility_name || 'District Hospital'}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      {getStatusBadge(appt.status)}
                      {appt.delay_minutes && (
                        <div className="text-[10px] text-[#b45309] font-medium mt-1">
                          +{appt.delay_minutes} min transit delay
                        </div>
                      )}
                    </td>

                    {/* Consultation Fee */}
                    <td className="px-5 py-4 text-right whitespace-nowrap font-bold text-[#172b28]">
                      ₹{appt.consultation_fee || 500}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
