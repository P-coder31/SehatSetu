'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CalendarCheck, Clock, ClipboardList, ShieldCheck,
  ArrowRight, Sparkles, Bell, MapPin, Search, Stethoscope,
  HeartPulse, Activity, Check, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';

export default function PatientDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, quickDemoLogin } = useAuth();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDashboardData = async () => {
    try {
      const [appts, rems, notifs] = await Promise.all([
        apiRequest<any[]>('/appointments/bookings'),
        apiRequest<any[]>('/care-continuity/reminders'),
        apiRequest<any[]>('/care-continuity/notifications'),
      ]);
      setAppointments(appts);
      setReminders(rems);
      setNotifications(notifs.slice(0, 3));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        quickDemoLogin('patient').then(fetchDashboardData);
      } else {
        fetchDashboardData();
      }
    }
  }, [user, authLoading, quickDemoLogin]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/search');
    }
  };

  const handleMarkReminderComplete = async (id: number) => {
    try {
      await apiRequest(`/care-continuity/reminders/${id}/complete`, { method: 'PATCH' });
      await fetchDashboardData();
    } catch {
      // ignore
    }
  };

  const upcomingAppt = appointments.find(
    (a) => a.status === 'confirmed' || a.status === 'delay_reported' || a.status === 'rescheduled' || a.status === 'reschedule_requested'
  );

  const pendingDoctorReschedules = appointments.filter(
    (a) => a.status === 'reschedule_requested'
  );

  return (
    <div className="space-y-8">
      {/* Pending Doctor Reschedule Urgent Alert Banner */}
      {pendingDoctorReschedules.length > 0 && (
        <div className="bg-[#fff9eb] border-2 border-amber-400 rounded-3xl p-5 sm:p-6 shadow-md space-y-3 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Clock size={20} />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-900 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                  Action Required
                </div>
                <h3 className="text-base font-bold text-amber-950">
                  Doctor Reschedule Request Pending
                </h3>
                <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
                  <strong>{pendingDoctorReschedules[0].doctor_name}</strong> requested to reschedule visit <strong>{pendingDoctorReschedules[0].booking_reference}</strong>.
                  {pendingDoctorReschedules[0].notes && ` Reason: "${pendingDoctorReschedules[0].notes}".`}
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/appointments"
              className="px-4 py-2.5 rounded-xl bg-[#137b65] text-white text-xs font-bold hover:bg-[#0c5949] shadow-xs transition shrink-0 self-start sm:self-auto flex items-center gap-1.5"
            >
              Review &amp; Confirm <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}

      {/* 1. Welcome Banner */}
      <div className="bg-gradient-to-r from-[#172b28] via-[#104337] to-[#0d594a] text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#8be2cf] text-xs font-bold uppercase tracking-wider">
            <HeartPulse size={14} /> Patient Care Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Namaste, {user?.full_name || 'Asha Patel'}
          </h1>
          <p className="text-xs sm:text-sm text-[#b8dcd1] max-w-xl leading-relaxed">
            Welcome to your unified care hub. Discover verified practitioners, manage appointment slots, track arrival delays, and access your permanent Care Passport.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <Link
            href="/search"
            className="px-5 py-3 rounded-xl bg-[#38a67d] hover:bg-[#2e936d] text-white font-bold text-xs shadow-sm transition inline-flex items-center gap-2"
          >
            <Search size={15} /> Find Care Now
          </Link>
          <Link
            href="/dashboard/appointments"
            className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition"
          >
            View Appointments ({appointments.length})
          </Link>
        </div>
      </div>

      {/* 2. Prominent Find Care Feature Card */}
      <div className="bg-white border-2 border-[#137b65]/30 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#137b65] bg-[#edf7f2] px-2 py-0.5 rounded">
              Healthcare Discovery
            </span>
            <h2 className="text-base font-bold text-[#172b28] mt-1">
              Find Verified Doctors &amp; Health Facilities
            </h2>
          </div>
          <span className="text-xs text-[#6a8077]">
            Instant slot reservation backed by database constraints
          </span>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-3.5 text-[#6c8279]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by specialty, doctor name, or hospital (e.g. Pediatrics, Civil Hospital)..."
              className="w-full pl-10 pr-4 py-3 text-xs bg-[#fbfcfa] border border-[#d6e5dc] rounded-xl focus:bg-white focus:border-[#137b65] outline-none transition"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-[#137b65] text-white font-bold text-xs rounded-xl hover:bg-[#0e6351] transition shadow-xs flex items-center justify-center gap-1.5"
          >
            Search Care <ArrowRight size={14} />
          </button>
        </form>

        <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
          <span className="text-[11px] text-[#697f77] font-semibold">Popular Specialties:</span>
          {[
            { name: 'General Physician', icon: Stethoscope },
            { name: 'Pediatrics', icon: HeartPulse },
            { name: 'Dental Care', icon: Sparkles },
            { name: 'Orthopedics', icon: Activity },
          ].map((spec) => (
            <Link
              key={spec.name}
              href={`/search?specialty=${encodeURIComponent(spec.name)}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f4f9f6] hover:bg-[#e4f3ea] border border-[#d5e5db] text-[#344d44] font-medium text-[11px] transition"
            >
              <spec.icon size={12} className="text-[#137b65]" />
              {spec.name}
            </Link>
          ))}
        </div>
      </div>

      {/* 3. Main Grid: Upcoming Visit, Reminders, and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upcoming Visit & Quick Actions */}
        <div className="lg:col-span-7 space-y-6">
          {/* Upcoming Appointment Card */}
          <div className="bg-white border border-[#e2ece5] rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#edf3ee] mb-4">
              <div className="flex items-center gap-2">
                <CalendarCheck size={18} className="text-[#137b65]" />
                <h3 className="text-sm font-bold text-[#172b28]">Next Upcoming Appointment</h3>
              </div>
              <Link
                href="/dashboard/appointments"
                className="text-xs font-bold text-[#137b65] hover:underline flex items-center gap-1"
              >
                View all ({appointments.length}) <ChevronRight size={14} />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-[#6e827a]">Loading appointments...</div>
            ) : upcomingAppt ? (
              <div className="space-y-4">
                {/* Delay Alert Notice */}
                {upcomingAppt.status === 'delay_reported' && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                    <Clock size={16} className="text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <strong>Delay Reported (+{upcomingAppt.delay_minutes || 15} mins):</strong>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Clinic is aware of your estimated transit delay. Your slot remains reserved.
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-[#f8faf8] border border-[#e4ebe6] rounded-2xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-[#137b65] uppercase tracking-wider font-mono bg-[#edf7f2] px-2 py-0.5 rounded">
                        {upcomingAppt.booking_reference}
                      </span>
                      <h4 className="text-base font-bold text-[#172b28] mt-1.5">
                        {upcomingAppt.doctor_name}
                      </h4>
                      <p className="text-xs text-[#52645e] font-medium">
                        {upcomingAppt.doctor_specialties?.join(', ') || 'Consultant Physician'}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#e8f5ec] text-[#137b65] capitalize">
                      {upcomingAppt.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#eaf0eb] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#4e635c]">
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-[#137b65]" />
                      <span>{upcomingAppt.appointment_date} at {upcomingAppt.slot_time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin size={13} className="text-[#137b65] shrink-0" />
                      <span className="truncate">{upcomingAppt.facility_name}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href="/dashboard/appointments"
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#137b65] text-white text-xs font-bold text-center hover:bg-[#0e6351] transition"
                  >
                    Manage / Report Delay
                  </Link>
                  <Link
                    href="/dashboard/care-passport"
                    className="py-2.5 px-4 rounded-xl border border-[#cadbd1] text-[#2c413b] text-xs font-semibold text-center hover:bg-[#f2f6f4] transition"
                  >
                    Care Timeline
                  </Link>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-[#f0f6f2] text-[#137b65] flex items-center justify-center mx-auto">
                  <CalendarCheck size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#172b28]">No Upcoming Appointments</h4>
                  <p className="text-xs text-[#6e827a] mt-0.5 max-w-xs mx-auto">
                    You have no active visits scheduled right now. Search certified clinics to book a slot.
                  </p>
                </div>
                <Link
                  href="/search"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#137b65] text-white text-xs font-bold shadow-xs hover:bg-[#0e6351] transition"
                >
                  Find Care &amp; Book <ArrowRight size={13} />
                </Link>
              </div>
            )}
          </div>

          {/* Quick Hub Navigation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/dashboard/care-passport"
              className="bg-white border border-[#e2ece5] rounded-2xl p-4 hover:border-[#137b65] hover:shadow-xs transition"
            >
              <div className="w-8 h-8 rounded-lg bg-[#eaf4ee] text-[#137b65] flex items-center justify-center mb-2">
                <ClipboardList size={16} />
              </div>
              <h4 className="text-xs font-bold text-[#172b28]">My Care Passport</h4>
              <p className="text-[11px] text-[#6d8079] mt-0.5">Chronological timeline of visit events &amp; follow-ups</p>
            </Link>

            <Link
              href="/dashboard/health-schemes"
              className="bg-white border border-[#e2ece5] rounded-2xl p-4 hover:border-[#137b65] hover:shadow-xs transition"
            >
              <div className="w-8 h-8 rounded-lg bg-[#eaf4ee] text-[#137b65] flex items-center justify-center mb-2">
                <Sparkles size={16} />
              </div>
              <h4 className="text-xs font-bold text-[#172b28]">Health Schemes</h4>
              <p className="text-[11px] text-[#6d8079] mt-0.5">PM-JAY, e-Sanjeevani, and JSY plain-language guides</p>
            </Link>

            <Link
              href="/dashboard/profile"
              className="bg-white border border-[#e2ece5] rounded-2xl p-4 hover:border-[#137b65] hover:shadow-xs transition"
            >
              <div className="w-8 h-8 rounded-lg bg-[#eaf4ee] text-[#137b65] flex items-center justify-center mb-2">
                <ShieldCheck size={16} />
              </div>
              <h4 className="text-xs font-bold text-[#172b28]">Care Profile</h4>
              <p className="text-[11px] text-[#6d8079] mt-0.5">Demographics, emergency contacts, &amp; city</p>
            </Link>
          </div>
        </div>

        {/* Right Column: Active Reminders & Live Notifications */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Follow-up Reminders Card */}
          <div className="bg-white border border-[#e2ece5] rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#edf3ee]">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-[#137b65]" />
                <h3 className="text-sm font-bold text-[#172b28]">Follow-up Reminders</h3>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-semibold text-[#137b65] bg-[#eaf4ee] px-2 py-0.5 rounded-full">
                  {reminders.filter((r) => r.status === 'pending').length} pending
                </span>
                <Link href="/dashboard/reminders" className="text-xs text-[#137b65] font-bold hover:underline">
                  Manage &rarr;
                </Link>
              </div>
            </div>

            {reminders.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#71847e]">
                No pending medical reminders. Reminders created during consultations appear here.
              </div>
            ) : (
              <div className="space-y-2.5">
                {reminders.slice(0, 4).map((rem) => (
                  <div
                    key={rem.id}
                    className="p-3.5 rounded-2xl bg-[#f8faf8] border border-[#e6eee8] flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-[#1a2d29] truncate">{rem.title}</h4>
                      {rem.notes && (
                        <p className="text-[11px] text-[#627670] mt-0.5 line-clamp-2">{rem.notes}</p>
                      )}
                      <span className="text-[10px] text-[#137b65] font-semibold mt-1 block">
                        Due: {rem.reminder_date}
                      </span>
                    </div>

                    {rem.status === 'pending' ? (
                      <button
                        onClick={() => handleMarkReminderComplete(rem.id)}
                        className="px-2.5 py-1 text-[11px] rounded-lg bg-white border border-[#c6dfd0] text-[#137b65] hover:bg-[#eaf4ee] font-semibold shrink-0 transition"
                        title="Mark reminder completed"
                      >
                        <Check size={13} className="inline mr-1" /> Done
                      </button>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#e8f5ec] text-[#137b65] font-bold shrink-0">
                        Completed
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent In-App Notifications Preview */}
          <div className="bg-white border border-[#e2ece5] rounded-3xl p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#edf3ee]">
              <h3 className="text-sm font-bold text-[#172b28]">Recent Activity Updates</h3>
              <Link href="/dashboard/care-passport" className="text-xs text-[#137b65] font-bold hover:underline">
                Passport Timeline
              </Link>
            </div>

            {notifications.length === 0 ? (
              <p className="text-xs text-[#71847e] text-center py-4">No recent activity updates.</p>
            ) : (
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 rounded-xl bg-[#fbfdfc] border border-[#edf3ee] text-xs">
                    <div className="font-bold text-[#172b28] flex items-center justify-between">
                      <span>{n.title}</span>
                      <span className="text-[10px] font-normal text-[#758982]">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#556963] mt-0.5 leading-relaxed">{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
