'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck, Users, Building2, CalendarCheck,
  AlertCircle, ArrowRight
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';

export default function AdminDashboardPage() {
  const { user, loading: authLoading, quickDemoLogin } = useAuth();

  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const data = await apiRequest<any>('/admin/dashboard');
      setStats(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        // Auto-login as Admin CMO for demo
        quickDemoLogin('admin').then(fetchStats);
      } else {
        fetchStats();
      }
    }
  }, [user, authLoading, quickDemoLogin]);

  if (loading && !stats) {
    return <div className="max-w-6xl mx-auto px-4 py-20 text-center text-xs text-[#71847e]">Loading platform analytics...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="bg-[#172b28] text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#82c8b7] text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck size={14} /> State Health Administration
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Administrative Control Center
          </h1>
          <p className="text-xs text-[#b8d6cb] mt-1 max-w-lg leading-relaxed">
            Real-time aggregate queries against the SehatSetu database. Verification queues, facility network, and platform audit trail.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/verifications"
            className="px-4 py-2.5 rounded-xl bg-[#137b65] hover:bg-[#0e6351] text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
          >
            Review Verifications ({stats?.pending_verifications || 0}) <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Real Aggregate Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#e2ece5] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#687d75] mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Platform Users</span>
            <Users size={16} />
          </div>
          <span className="text-2xl font-bold text-[#172b28] block">
            {stats?.total_users || 0}
          </span>
          <span className="text-[11px] text-[#6d8079] mt-0.5 block">
            {stats?.total_patients || 0} Patients · {stats?.total_professionals || 0} Doctors
          </span>
        </div>

        <div className="bg-white border border-[#e2ece5] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Verification Queue</span>
            <AlertCircle size={16} />
          </div>
          <span className="text-2xl font-bold text-amber-800 block">
            {stats?.pending_verifications || 0}
          </span>
          <span className="text-[11px] text-amber-700 mt-0.5 block">Pending applications</span>
        </div>

        <div className="bg-white border border-[#e2ece5] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#137b65] mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Bookings</span>
            <CalendarCheck size={16} />
          </div>
          <span className="text-2xl font-bold text-[#137b65] block">
            {stats?.total_appointments || 0}
          </span>
          <span className="text-[11px] text-[#6d8079] mt-0.5 block">Across all facilities</span>
        </div>

        <div className="bg-white border border-[#e2ece5] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#687d75] mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Health Facilities</span>
            <Building2 size={16} />
          </div>
          <span className="text-2xl font-bold text-[#172b28] block">
            {stats?.total_facilities || 0}
          </span>
          <span className="text-[11px] text-[#6d8079] mt-0.5 block">Government &amp; Private</span>
        </div>
      </div>

      {/* Appointment Status Breakdown */}
      <div className="bg-white border border-[#e2ece5] rounded-3xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#172b28]">Live Appointment Status Breakdown</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {stats?.appointments_by_status &&
            Object.entries(stats.appointments_by_status).map(([st, count]: any) => (
              <div key={st} className="p-3.5 rounded-2xl bg-[#f8faf8] border border-[#e4ebe6]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6a7d76] block">
                  {st.replace('_', ' ')}
                </span>
                <span className="text-lg font-bold text-[#172b28] mt-1 block">{count}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Navigation Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/admin/verifications"
          className="bg-white border border-[#e2ece5] rounded-2xl p-5 hover:border-[#137b65] hover:shadow-xs transition flex items-center justify-between"
        >
          <div>
            <h4 className="text-xs font-bold text-[#172b28]">Professional Verification Queue</h4>
            <p className="text-[11px] text-[#6c8078] mt-0.5">Approve or reject doctor applications</p>
          </div>
          <ArrowRight size={15} className="text-[#137b65]" />
        </Link>

        <Link
          href="/admin/users"
          className="bg-white border border-[#e2ece5] rounded-2xl p-5 hover:border-[#137b65] hover:shadow-xs transition flex items-center justify-between"
        >
          <div>
            <h4 className="text-xs font-bold text-[#172b28]">User &amp; Practitioner Directory</h4>
            <p className="text-[11px] text-[#6c8078] mt-0.5">Search and manage accounts</p>
          </div>
          <ArrowRight size={15} className="text-[#137b65]" />
        </Link>

        <Link
          href="/admin/reports"
          className="bg-white border border-[#e2ece5] rounded-2xl p-5 hover:border-[#137b65] hover:shadow-xs transition flex items-center justify-between"
        >
          <div>
            <h4 className="text-xs font-bold text-[#172b28]">Audit Trail &amp; Reports</h4>
            <p className="text-[11px] text-[#6c8078] mt-0.5">System activity and security log</p>
          </div>
          <ArrowRight size={15} className="text-[#137b65]" />
        </Link>
      </div>
    </div>
  );
}
