'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Video,
  Building2,
  CalendarCheck,
  ArrowRight,
  RefreshCw,
  Loader2,
  Sliders
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface AppointmentData {
  id: number;
  booking_reference: string;
  patient_id: number;
  patient_name?: string;
  patient_phone?: string;
  facility_name?: string;
  specialty_name?: string;
  appointment_date: string;
  slot_time: string;
  consultation_type?: string;
  status: string;
  chief_complaint?: string;
  delay_minutes?: number;
  notes?: string;
}

export default function ProfessionalCalendarPage() {
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Calendar view state
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiRequest<AppointmentData[]>('/professional/appointments');
      setAppointments(data);
      
      // If no selected date or today has no appointments, pick first date with appointments
      if (data.length > 0) {
        const todayStr = new Date().toISOString().split('T')[0];
        const hasToday = data.some(a => a.appointment_date === todayStr);
        if (!hasToday) {
          // Select date of nearest appointment
          setSelectedDateStr(data[0].appointment_date);
          const [year, month, day] = data[0].appointment_date.split('-').map(Number);
          setCurrentDate(new Date(year, month - 1, day));
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load appointments calendar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleStatusUpdate = async (id: number, newStatus: 'completed' | 'noshow') => {
    try {
      setActionLoading(id);
      await apiRequest(`/professional/appointments/${id}/status?new_status=${newStatus}`, {
        method: 'PATCH',
      });
      await fetchAppointments();
    } catch (err: any) {
      alert(err?.message || 'Failed to update appointment status.');
    } finally {
      setActionLoading(null);
    }
  };

  // Monthly calendar computations
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    return { firstDayOfMonth, totalDays };
  }, [currentYear, currentMonth]);

  const appointmentsByDate = useMemo(() => {
    const map: Record<string, AppointmentData[]> = {};
    appointments.forEach((appt) => {
      const d = appt.appointment_date;
      if (!map[d]) map[d] = [];
      map[d].push(appt);
    });
    return map;
  }, [appointments]);

  const selectedDateAppointments = useMemo(() => {
    const list = appointmentsByDate[selectedDateStr] || [];
    return [...list].sort((a, b) => a.slot_time.localeCompare(b.slot_time));
  }, [appointmentsByDate, selectedDateStr]);

  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(today.toISOString().split('T')[0]);
  };

  // Format selected date nicely
  const formattedSelectedDate = useMemo(() => {
    if (!selectedDateStr) return '';
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, [selectedDateStr]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      
      {/* ── Top Header ── */}
      <div className="bg-white border border-[#dce8df] rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eaf4ee] text-[#137b65] text-xs font-bold uppercase tracking-wider mb-2">
            <CalendarIcon size={14} /> Clinic Operations Calendar
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172b28]">
            Doctor Schedule &amp; Calendar
          </h1>
          <p className="text-xs sm:text-sm text-[#5a6f68] mt-1">
            Real-time visual schedule of confirmed patient slots, token holds, and completed OPD consultations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchAppointments}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl border border-[#d2dfd8] bg-white text-[#29423b] text-xs font-bold hover:bg-[#f2f8f5] transition flex items-center gap-1.5"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <Link
            href="/professional/availability"
            className="px-4 py-2 rounded-xl bg-[#137b65] text-white text-xs font-bold hover:bg-[#0c5949] transition flex items-center gap-1.5 shadow-xs"
          >
            <Sliders size={13} /> Manage Availability
          </Link>
        </div>
      </div>

      {/* ── Calendar & Day Details Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Monthly Calendar View (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-[#dce8df] rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            {/* Month Navigation Bar */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#172b28]">
                  {monthNames[currentMonth]} {currentYear}
                </h2>
                <button
                  onClick={goToToday}
                  className="px-2.5 py-0.5 rounded-md bg-[#edf6f1] text-[#137b65] text-[11px] font-bold hover:bg-[#dbeee2] transition"
                >
                  Today
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={goToPrevMonth}
                  className="p-1.5 rounded-lg border border-[#d8e6de] hover:bg-[#f4f7f5] text-[#4a5f57] transition"
                  aria-label="Previous Month"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={goToNextMonth}
                  className="p-1.5 rounded-lg border border-[#d8e6de] hover:bg-[#f4f7f5] text-[#4a5f57] transition"
                  aria-label="Next Month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Weekday Header */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="text-[11px] font-bold uppercase tracking-wider text-[#758a82] py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Empty leading cells */}
              {Array.from({ length: daysInMonth.firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[64px] sm:min-h-[74px] rounded-xl bg-transparent" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth.totalDays }).map((_, i) => {
                const dayNum = i + 1;
                const paddedMonth = String(currentMonth + 1).padStart(2, '0');
                const paddedDay = String(dayNum).padStart(2, '0');
                const dateKey = `${currentYear}-${paddedMonth}-${paddedDay}`;
                
                const dayAppts = appointmentsByDate[dateKey] || [];
                const isSelected = selectedDateStr === dateKey;
                const isToday = new Date().toISOString().split('T')[0] === dateKey;

                return (
                  <button
                    key={dateKey}
                    onClick={() => setSelectedDateStr(dateKey)}
                    className={`min-h-[64px] sm:min-h-[74px] p-1.5 sm:p-2 rounded-2xl border text-left transition flex flex-col justify-between relative group ${
                      isSelected
                        ? 'border-[#137b65] bg-[#edf7f2] shadow-sm ring-2 ring-[#137b65]/20'
                        : isToday
                        ? 'border-[#3b82f6] bg-[#f0f7ff]'
                        : dayAppts.length > 0
                        ? 'border-[#d4e4db] bg-white hover:border-[#137b65] hover:bg-[#fafdfb]'
                        : 'border-transparent bg-[#f8faf9] hover:bg-[#edf3f0] opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${
                          isToday
                            ? 'bg-blue-600 text-white'
                            : isSelected
                            ? 'bg-[#137b65] text-white'
                            : 'text-[#21352f]'
                        }`}
                      >
                        {dayNum}
                      </span>
                      {dayAppts.length > 0 && (
                        <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-[#137b65]/15 text-[#137b65]">
                          {dayAppts.length}
                        </span>
                      )}
                    </div>

                    {/* Dots / Tiny badges */}
                    <div className="w-full space-y-0.5 mt-1">
                      {dayAppts.slice(0, 2).map((a) => (
                        <div
                          key={a.id}
                          className={`text-[9px] font-semibold truncate px-1 rounded ${
                            a.status === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : a.status === 'completed'
                              ? 'bg-gray-100 text-gray-700'
                              : a.status === 'delay_reported'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {a.slot_time} {a.patient_name ? a.patient_name.split(' ')[0] : 'Patient'}
                        </div>
                      ))}
                      {dayAppts.length > 2 && (
                        <div className="text-[8px] text-[#5e746c] font-bold px-1">
                          +{dayAppts.length - 2} more
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-[#edf4f0] flex flex-wrap items-center gap-3 text-[11px] text-[#556962]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Confirmed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Delay Reported
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Rescheduled
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-400" /> Completed
            </span>
          </div>
        </div>

        {/* Right Column: Selected Date Schedule Details (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-[#dce8df] rounded-3xl p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#edf4f0] mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-[#172b28]">
                  Schedule for {formattedSelectedDate}
                </h3>
                <p className="text-[11px] text-[#697d76]">
                  {selectedDateAppointments.length} appointment{selectedDateAppointments.length === 1 ? '' : 's'} on this day
                </p>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#edf6f1] text-[#137b65]">
                {selectedDateStr}
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-[#6e827b] flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin text-[#137b65]" /> Loading schedule...
              </div>
            ) : selectedDateAppointments.length === 0 ? (
              <div className="py-10 text-center px-4">
                <CalendarCheck size={36} className="mx-auto text-[#9fb3a9] mb-2" />
                <h4 className="text-sm font-bold text-[#172b28]">No appointments for this date</h4>
                <p className="text-xs text-[#637770] mt-1 max-w-xs mx-auto leading-relaxed">
                  Your regular slot rules apply. Patients booking through SehatSetu will appear here immediately.
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    onClick={goToToday}
                    className="px-3 py-1.5 rounded-xl bg-[#edf6f1] text-[#137b65] text-xs font-bold hover:bg-[#dcefe5] transition"
                  >
                    View Today&apos;s Appointments
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {selectedDateAppointments.map((appt) => {
                  const isDelay = appt.status === 'delay_reported';
                  const isCompleted = appt.status === 'completed';
                  const isCancelled = appt.status.includes('cancelled');

                  return (
                    <div
                      key={appt.id}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition ${
                        isDelay
                          ? 'border-amber-300 bg-amber-50/50'
                          : isCompleted
                          ? 'border-[#e0ebe4] bg-[#fbfdfc] opacity-80'
                          : isCancelled
                          ? 'border-red-200 bg-red-50/40 opacity-70'
                          : 'border-[#d6e7dc] bg-[#fafdfb] hover:border-[#137b65]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 font-extrabold text-xs text-[#137b65] bg-white border border-[#cbe4d5] px-2 py-0.5 rounded-md">
                            <Clock size={12} /> {appt.slot_time}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7e77]">
                            {appt.booking_reference}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                            appt.status === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : appt.status === 'completed'
                              ? 'bg-gray-100 text-gray-700'
                              : isDelay
                              ? 'bg-amber-100 text-amber-800'
                              : isCancelled
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {appt.status.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Patient Name & Details */}
                      <div className="mt-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#172b28]">
                          <User size={13} className="text-[#137b65]" />
                          <span>{appt.patient_name || 'Patient'}</span>
                          {appt.consultation_type === 'video' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded font-semibold ml-1">
                              <Video size={10} /> Video
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold ml-1">
                              <Building2 size={10} /> In-Person
                            </span>
                          )}
                        </div>

                        {appt.chief_complaint && (
                          <p className="text-[11px] text-[#556962] mt-1 line-clamp-2">
                            <strong className="text-[#3c5049]">Reason:</strong> {appt.chief_complaint}
                          </p>
                        )}

                        {isDelay && (
                          <div className="mt-2 p-2 rounded-xl bg-amber-100/70 border border-amber-200 text-[11px] text-amber-900 font-semibold flex items-center gap-1.5">
                            <AlertCircle size={13} className="text-amber-600 shrink-0" />
                            <span>Patient running {appt.delay_minutes || 15} mins late. Delay hold requested.</span>
                          </div>
                        )}
                      </div>

                      {/* Doctor Actions */}
                      {!isCompleted && !isCancelled && (
                        <div className="mt-3 pt-2.5 border-t border-[#e2ede6] flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleStatusUpdate(appt.id, 'noshow')}
                            disabled={actionLoading === appt.id}
                            className="px-2.5 py-1 text-[11px] font-semibold text-[#6d8078] hover:text-red-700 transition"
                          >
                            Mark No-Show
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(appt.id, 'completed')}
                            disabled={actionLoading === appt.id}
                            className="px-3 py-1 rounded-lg bg-[#137b65] text-white text-[11px] font-bold hover:bg-[#0c5949] transition shadow-2xs flex items-center gap-1"
                          >
                            <CheckCircle2 size={12} />
                            {actionLoading === appt.id ? 'Updating...' : 'Mark Completed'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Nav Card */}
          <div className="bg-[#edf6f1] border border-[#cae4d4] rounded-2xl p-4 text-xs flex items-center justify-between gap-3">
            <div>
              <div className="font-bold text-[#172b28]">Need full patient list?</div>
              <p className="text-[11px] text-[#556962] mt-0.5">
                View all upcoming, delay-reported, and past appointments in table view.
              </p>
            </div>
            <Link
              href="/professional/appointments"
              className="px-3 py-1.5 rounded-xl bg-white border border-[#c1dbcc] text-[#137b65] font-bold text-xs hover:bg-[#137b65] hover:text-white transition whitespace-nowrap shadow-2xs"
            >
              All Appointments <ArrowRight size={12} className="inline ml-1" />
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}