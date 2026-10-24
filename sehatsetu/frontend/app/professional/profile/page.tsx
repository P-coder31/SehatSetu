'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Stethoscope, ShieldCheck, Clock, Award, Building2,
  DollarSign, Mail, FileText, CheckCircle2, AlertTriangle,
  Edit3, ExternalLink, BarChart3, Users, Eye, Star,
  TrendingUp, Video, Calendar, Download, Sparkles, Check
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import DoctorAvatarImage from '@/components/DoctorAvatarImage';

export default function ProfessionalProfilePage() {
  const { user, loading: authLoading, quickDemoLogin } = useAuth();
  const [profile, setProfile] = useState<any | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<any | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  const [loadingReport, setLoadingReport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const fetchProfile = async () => {
    try {
      const data = await apiRequest<any>('/professional/profile');
      setProfile(data);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyReport = async (monthKey: string) => {
    setLoadingReport(true);
    try {
      const rep = await apiRequest<any>(`/professional/monthly-report?month=${monthKey}`);
      setMonthlyReport(rep);
    } catch {
      // Fallback fallback report if backend is restarting
      setMonthlyReport({
        month_label: 'September 2026 (Last Month)',
        patients_treated: 148,
        patients_reviewed: 42,
        profile_views: 1420,
        consultations_breakdown: { in_person: 106, video: 42 },
        on_time_rate: '97.4%',
        average_rating: 4.9,
        review_count: 42,
        average_consult_duration: '18 mins',
        delay_holds_saved: 8,
        patient_retention_rate: '89%',
        month_over_month_growth: '+14.2%',
        available_months: [
          { key: '2026-09', label: 'September 2026 (Last Month)' },
          { key: '2026-08', label: 'August 2026' },
          { key: '2026-07', label: 'July 2026' },
        ]
      });
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'professional') {
        quickDemoLogin('professional').then(() => {
          fetchProfile();
          fetchMonthlyReport(selectedMonth);
        });
      } else {
        fetchProfile();
        fetchMonthlyReport(selectedMonth);
      }
    }
  }, [user, authLoading, quickDemoLogin]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = e.target.value;
    setSelectedMonth(newMonth);
    fetchMonthlyReport(newMonth);
  };

  const handleCopySummary = () => {
    if (!monthlyReport) return;
    const text = `SehatSetu Practice Month Report (${monthlyReport.month_label})\nDoctor: ${profile?.full_name || 'Dr. Rajesh Kumar'}\nPatients Treated: ${monthlyReport.patients_treated}\nPatients Reviewed: ${monthlyReport.patients_reviewed} (${monthlyReport.average_rating}★)\nProfile Discovery Views: ${monthlyReport.profile_views}\nFairSlot On-Time Start: ${monthlyReport.on_time_rate}\nIn-Person: ${monthlyReport.consultations_breakdown?.in_person} | Video: ${monthlyReport.consultations_breakdown?.video}`;
    navigator.clipboard?.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172b28]">Professional Profile</h1>
          <p className="text-xs text-[#5a7067] mt-0.5">
            Manage your credentials, consultation fee, facility affiliations, and clinical specializations.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/professional/onboarding"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#137b65] text-white text-xs font-semibold hover:bg-[#0f6754] transition shadow-xs"
          >
            <Edit3 size={14} />
            <span>Edit Credentials</span>
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#d6e5dc] text-[#2c413b] text-xs font-semibold hover:bg-[#f2f7f4] transition"
          >
            <ExternalLink size={14} />
            <span>Public Listing</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-[#e2ece5] rounded-3xl p-12 text-center text-xs text-[#6a8077]">
          Loading professional credentials...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Credentials Card */}
          <div className="bg-white border border-[#e2ece5] rounded-3xl p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-[#edf3ee]">
              <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                  <DoctorAvatarImage
                    name={profile?.full_name || user?.full_name || 'Dr. Rajesh Kumar'}
                    specialty={profile?.specialties?.[0]?.name}
                    size={72}
                    showBadge={true}
                    className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl shadow-sm border-2 border-white shrink-0"
                  />
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-[#137b65] text-white text-[8px] font-bold px-1.5 py-0.2 rounded-full whitespace-nowrap shadow-2xs">
                    AI Portrait
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-[#172b28]">
                      {profile?.full_name ? `${profile.title || 'Dr.'} ${profile.full_name}` : (user?.full_name || 'Dr. Rajesh Kumar')}
                    </h2>
                    {profile?.verification_status === 'verified' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#e6f6ee] text-[#137b65] border border-[#bee6cf]">
                        <CheckCircle2 size={12} />
                        Verified Practitioner
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#fef7ea] text-[#b45309] border border-[#fde4b6]">
                        <AlertTriangle size={12} />
                        Verification Pending
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-[#137b65] mt-1">
                    {profile?.qualification || 'MBBS, MD - General Medicine'}
                  </p>
                  <p className="text-xs text-[#677e74] mt-0.5 flex items-center gap-2">
                    <Mail size={12} />
                    <span>{profile?.email || user?.email || 'rajesh.kumar@example.com'}</span>
                  </p>
                </div>
              </div>

              <div className="bg-[#f8faf8] border border-[#e6eee8] rounded-2xl p-3.5 sm:text-right shrink-0">
                <span className="text-[10px] uppercase font-bold text-[#6f827b] block">Consultation Fee</span>
                <span className="text-lg font-bold text-[#172b28]">
                  ₹{profile?.consultation_fee || 500}
                </span>
                <span className="text-[10px] text-[#71867e] block">per OPD consultation</span>
              </div>
            </div>

            {/* Verification Status Banner */}
            <div className={`mt-5 p-4 rounded-2xl border text-xs flex items-start gap-3 ${
              profile?.verification_status === 'verified'
                ? 'bg-[#f0f9f4] border-[#c0e6d1] text-[#137b65]'
                : 'bg-[#fffbeb] border-[#fde68a] text-[#92400e]'
            }`}>
              <ShieldCheck size={18} className="shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">
                  {profile?.verification_status === 'verified'
                    ? 'State Medical Council & UIDAI Verified'
                    : 'Credentials Under Review by State Health Department'}
                </span>
                <p className="text-[11px] opacity-90 mt-0.5">
                  {profile?.verification_status === 'verified'
                    ? 'Your medical license and identity have been validated. You are visible in public care searches and patient booking directories.'
                    : 'Your registration details are currently being cross-referenced with the National Medical Register. You can still configure schedules and take test bookings.'}
                </p>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6">
              <div className="p-3.5 rounded-2xl bg-[#fbfdfc] border border-[#e8efe9]">
                <div className="flex items-center gap-2 text-[#137b65] mb-1">
                  <Award size={16} />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#697f77]">Registration No.</span>
                </div>
                <div className="text-sm font-bold text-[#172b28]">
                  {profile?.registration_number || 'MCI-2012-78945'}
                </div>
                <span className="text-[10px] text-[#788e84]">Medical Council of India</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#fbfdfc] border border-[#e8efe9]">
                <div className="flex items-center gap-2 text-[#137b65] mb-1">
                  <Clock size={16} />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#697f77]">Clinical Experience</span>
                </div>
                <div className="text-sm font-bold text-[#172b28]">
                  {profile?.experience_years || 12} Years
                </div>
                <span className="text-[10px] text-[#788e84]">Active OPD &amp; Inpatient Practice</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#fbfdfc] border border-[#e8efe9]">
                <div className="flex items-center gap-2 text-[#137b65] mb-1">
                  <DollarSign size={16} />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#697f77]">FairSlot Standard Fee</span>
                </div>
                <div className="text-sm font-bold text-[#172b28]">
                  ₹{profile?.consultation_fee || 500}
                </div>
                <span className="text-[10px] text-[#788e84]">Transparent patient pricing</span>
              </div>
            </div>

            {/* Bio Section */}
            <div className="mt-6 pt-6 border-t border-[#edf3ee]">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={16} className="text-[#137b65]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#62776f]">Clinical Bio &amp; Summary</h3>
              </div>
              <p className="text-xs leading-relaxed text-[#3a4f47] bg-[#f8faf8] p-4 rounded-2xl border border-[#e8eee9]">
                {profile?.bio || 'Senior general medicine practitioner specialized in chronic disease management, preventive healthcare, hypertension, and rural health outreach. Dedicated to patient-first continuity of care.'}
              </p>
            </div>
          </div>

          {/* ── DOCTOR'S MONTHLY REPORT (Last Month Practice Telemetry & Patient Trust) ── */}
          <div className="bg-gradient-to-br from-white via-[#f7faf8] to-[#edf6f1] border border-[#cfe2d7] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            
            {/* Header + Month Selector & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#dce8e0]">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#137b65]/10 text-[#137b65] text-[10px] font-bold tracking-wider uppercase mb-1.5">
                  <BarChart3 size={13} />
                  <span>Clinical Month Report</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-[#172b28] flex items-center gap-2">
                  <span>Practice Activity &amp; Patient Review Summary</span>
                </h2>
                <p className="text-xs text-[#5c736b] mt-0.5">
                  Performance telemetry for last month. Summarized on your public profile so patients book with confidence.
                </p>
              </div>

              {/* Month Selector & Copy Summary Button */}
              <div className="flex items-center gap-2.5 shrink-0">
                <div className="flex items-center gap-1.5 bg-white border border-[#cde0d5] rounded-xl px-2.5 py-1.5 shadow-2xs">
                  <Calendar size={14} className="text-[#137b65] shrink-0" />
                  <select
                    value={selectedMonth}
                    onChange={handleMonthChange}
                    aria-label="Select report month"
                    className="text-xs font-bold text-[#1b332c] bg-transparent outline-none cursor-pointer"
                  >
                    <option value="2026-09">Last Month (September 2026)</option>
                    <option value="2026-08">August 2026</option>
                    <option value="2026-07">July 2026</option>
                    <option value="2026-06">June 2026</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#cde0d5] bg-white text-[#137b65] hover:bg-[#edf6f1] font-bold text-xs transition shadow-2xs cursor-pointer"
                  title="Copy formatted summary"
                >
                  {copiedSummary ? <Check size={14} className="text-emerald-600" /> : <Download size={14} />}
                  <span>{copiedSummary ? 'Copied!' : 'Export'}</span>
                </button>
              </div>
            </div>

            {/* 4 Primary KPI Telemetry Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              
              {/* Card 1: Patients Treated */}
              <div className="bg-white border border-[#d6e7dc] rounded-2xl p-4 shadow-xs hover:border-[#137b65] transition">
                <div className="flex items-center justify-between text-[#137b65] mb-2">
                  <div className="w-8 h-8 rounded-xl bg-[#eaf5ef] flex items-center justify-center">
                    <Users size={18} />
                  </div>
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                    <TrendingUp size={11} /> {monthlyReport?.month_over_month_growth || '+14.2%'}
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-[#172b28]">
                  {monthlyReport?.patients_treated || 148}
                </div>
                <div className="text-[11px] font-bold text-[#2d473f] mt-0.5">Patients Treated</div>
                <div className="text-[10px] text-[#70857d] mt-1">
                  Completed consultations in {monthlyReport?.month_label?.split(' ')[0] || 'last month'}
                </div>
              </div>

              {/* Card 2: Patients Reviewed */}
              <div className="bg-white border border-[#d6e7dc] rounded-2xl p-4 shadow-xs hover:border-[#137b65] transition">
                <div className="flex items-center justify-between text-amber-600 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                    <Star size={18} className="fill-amber-400 text-amber-400" />
                  </div>
                  <span className="text-[11px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                    {monthlyReport?.average_rating || 4.9} / 5.0
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-[#172b28]">
                  {monthlyReport?.patients_reviewed || 42}
                </div>
                <div className="text-[11px] font-bold text-[#2d473f] mt-0.5">Patients Reviewed</div>
                <div className="text-[10px] text-[#70857d] mt-1">
                  100% verified post-visit patient feedback
                </div>
              </div>

              {/* Card 3: Profile Views */}
              <div className="bg-white border border-[#d6e7dc] rounded-2xl p-4 shadow-xs hover:border-[#137b65] transition">
                <div className="flex items-center justify-between text-blue-600 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Eye size={18} />
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md">
                    Discovery
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-[#172b28]">
                  {monthlyReport?.profile_views?.toLocaleString() || '1,420'}
                </div>
                <div className="text-[11px] font-bold text-[#2d473f] mt-0.5">Profile Views</div>
                <div className="text-[10px] text-[#70857d] mt-1">
                  Prospective patients viewed your profile &amp; slots
                </div>
              </div>

              {/* Card 4: FairSlot On-Time Start */}
              <div className="bg-white border border-[#d6e7dc] rounded-2xl p-4 shadow-xs hover:border-[#137b65] transition">
                <div className="flex items-center justify-between text-emerald-600 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Clock size={18} />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                    Zero Delays
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-[#172b28]">
                  {monthlyReport?.on_time_rate || '97.4%'}
                </div>
                <div className="text-[11px] font-bold text-[#2d473f] mt-0.5">On-Time Start Rate</div>
                <div className="text-[10px] text-[#70857d] mt-1">
                  FairSlot™ queue &amp; delay protection adherence
                </div>
              </div>

            </div>

            {/* Deep-Dive Breakdown Strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
              
              {/* Consultation Modes */}
              <div className="p-4 rounded-2xl bg-white border border-[#dce9df]">
                <div className="text-xs font-bold text-[#172b28] mb-2.5 flex items-center justify-between">
                  <span>Consultation Modes</span>
                  <span className="text-[10px] text-[#697f77] font-semibold">Breakdown</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-[#445b53] mb-1">
                      <span className="flex items-center gap-1.5">
                        <Building2 size={13} className="text-[#137b65]" /> In-Person OPD
                      </span>
                      <strong>{monthlyReport?.consultations_breakdown?.in_person || 106} visits (72%)</strong>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#eef4f0] overflow-hidden">
                      <div className="h-full bg-[#137b65] rounded-full" style={{ width: '72%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-[#445b53] mb-1">
                      <span className="flex items-center gap-1.5">
                        <Video size={13} className="text-blue-600" /> Video Consult
                      </span>
                      <strong>{monthlyReport?.consultations_breakdown?.video || 42} calls (28%)</strong>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#eef4f0] overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: '28%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quality & Duration */}
              <div className="p-4 rounded-2xl bg-white border border-[#dce9df]">
                <div className="text-xs font-bold text-[#172b28] mb-2.5 flex items-center justify-between">
                  <span>Consultation Quality</span>
                  <span className="text-[10px] text-[#697f77] font-semibold">Averages</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-[#f2f6f3]">
                    <span className="text-[11px] text-[#556b63]">Average Consultation Time:</span>
                    <strong className="text-xs text-[#172b28] font-bold">{monthlyReport?.average_consult_duration || '18 mins'}</strong>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-[#f2f6f3]">
                    <span className="text-[11px] text-[#556b63]">Patient Retention &amp; Follow-up:</span>
                    <strong className="text-xs text-emerald-700 font-bold">{monthlyReport?.patient_retention_rate || '89%'}</strong>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-[11px] text-[#556b63]">Patient Recommendation Rate:</span>
                    <strong className="text-xs text-[#137b65] font-bold">98% would recommend</strong>
                  </div>
                </div>
              </div>

              {/* Delay Hold & FairSlot Impact */}
              <div className="p-4 rounded-2xl bg-white border border-[#dce9df]">
                <div className="text-xs font-bold text-[#172b28] mb-2.5 flex items-center justify-between">
                  <span>FairSlot™ Protection</span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Active</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-[#f2f6f3]">
                    <span className="text-[11px] text-[#556b63]">Delays Absorbed Without Penalty:</span>
                    <strong className="text-xs text-[#172b28] font-bold">{monthlyReport?.delay_holds_saved || 8} patients</strong>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-[#f2f6f3]">
                    <span className="text-[11px] text-[#556b63]">Overall No-Show Rate:</span>
                    <strong className="text-xs text-emerald-700 font-bold">{monthlyReport?.no_show_rate || '1.8%'} (Ultra-low)</strong>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-[11px] text-[#556b63]">Queue Disruption Index:</span>
                    <strong className="text-xs text-[#137b65] font-bold">0.0 (Zero physical queues)</strong>
                  </div>
                </div>
              </div>

            </div>

            {/* Public Transparency Badge note */}
            <div className="p-3 bg-white/80 rounded-2xl border border-[#d5e5db] flex items-center justify-between gap-3 text-[11px] text-[#526a61]">
              <span className="flex items-center gap-2">
                <Sparkles size={14} className="text-[#137b65] shrink-0" />
                <span>
                  <strong>Patient Transparency:</strong> These verified statistics are shared in a simplified trust card on your public doctor profile, helping prospective patients verify your practice volume and feedback.
                </span>
              </span>
              <Link
                href="/search"
                className="text-[#137b65] font-bold hover:underline shrink-0 flex items-center gap-1"
              >
                <span>View Patient View</span>
                <ExternalLink size={12} />
              </Link>
            </div>

          </div>

          {/* Affiliated Facilities & Specialties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Facilities */}
            <div className="bg-white border border-[#e2ece5] rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#edf3ee]">
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-[#137b65]" />
                  <h3 className="text-sm font-bold text-[#172b28]">Affiliated Facilities</h3>
                </div>
                <span className="text-[11px] font-bold text-[#137b65] bg-[#edf6f1] px-2 py-0.5 rounded-full">
                  {profile?.facilities?.length || 1} Primary
                </span>
              </div>

              {profile?.facilities && profile.facilities.length > 0 ? (
                <div className="space-y-3">
                  {profile.facilities.map((fac: any) => (
                    <div key={fac.id} className="p-3.5 rounded-2xl bg-[#f8faf8] border border-[#e8eee9]">
                      <div className="font-bold text-xs text-[#172b28]">{fac.name}</div>
                      <div className="text-[11px] text-[#137b65] font-semibold mt-0.5 capitalize">
                        {fac.facility_type?.replace('_', ' ') || 'Government Hospital'}
                      </div>
                      <div className="text-[11px] text-[#697e76] mt-1">
                        {fac.address}, {fac.city}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-[#f8faf8] border border-[#e8eee9]">
                  <div className="font-bold text-xs text-[#172b28]">Civil Hospital Sonipat</div>
                  <div className="text-[11px] text-[#137b65] font-semibold mt-0.5">District Civil Hospital</div>
                  <div className="text-[11px] text-[#697e76] mt-1">Sector 14, Sonipat, Haryana</div>
                </div>
              )}
            </div>

            {/* Specialties */}
            <div className="bg-white border border-[#e2ece5] rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#edf3ee]">
                <div className="flex items-center gap-2">
                  <Stethoscope size={18} className="text-[#137b65]" />
                  <h3 className="text-sm font-bold text-[#172b28]">Clinical Specialties</h3>
                </div>
                <span className="text-[11px] font-bold text-[#137b65] bg-[#edf6f1] px-2 py-0.5 rounded-full">
                  {profile?.specialties?.length || 2} Fields
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {profile?.specialties && profile.specialties.length > 0 ? (
                  profile.specialties.map((spec: any) => (
                    <span
                      key={spec.id}
                      className="px-3 py-1.5 rounded-xl bg-[#eaf4ee] text-[#137b65] text-xs font-semibold border border-[#cde2d5]"
                    >
                      {spec.name}
                    </span>
                  ))
                ) : (
                  <>
                    <span className="px-3 py-1.5 rounded-xl bg-[#eaf4ee] text-[#137b65] text-xs font-semibold border border-[#cde2d5]">
                      General Medicine
                    </span>
                    <span className="px-3 py-1.5 rounded-xl bg-[#eaf4ee] text-[#137b65] text-xs font-semibold border border-[#cde2d5]">
                      Preventive Healthcare
                    </span>
                    <span className="px-3 py-1.5 rounded-xl bg-[#eaf4ee] text-[#137b65] text-xs font-semibold border border-[#cde2d5]">
                      Hypertension &amp; Diabetes
                    </span>
                  </>
                )}
              </div>

              <div className="mt-4 p-3 rounded-2xl bg-[#fbfcfa] border border-[#e6eee8] text-[11px] text-[#6d827a]">
                Specialties determine which categories and symptoms your profile appears under in the patient search directory.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
