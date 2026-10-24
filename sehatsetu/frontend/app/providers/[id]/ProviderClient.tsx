'use client';

import React, { useEffect, useState, use, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  MapPin,
  IndianRupee,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Globe,
  Video,
  Building2,
  Clock,
  Info,
} from 'lucide-react';
import { apiRequest, formatINR } from '@/lib/api';

/** Deterministic HSL color from a string seed */
function seedToHsl(seed: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  const sat = 35 + (Math.abs(hash >> 4) % 30);
  const light = 38 + (Math.abs(hash >> 8) % 18);
  const bgLight = 92 + (Math.abs(hash >> 12) % 6);
  return {
    bg: `hsl(${hue}, ${sat}%, ${bgLight}%)`,
    text: `hsl(${hue}, ${sat}%, ${light}%)`,
  };
}

function ProviderProfileContent({ providerId }: { providerId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const initialSlot = searchParams.get('slot') || '';

  const [provider, setProvider] = useState<any | null>(null);
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>(initialSlot);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Generate next 14 days for date picker
  const nextDays = React.useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      iso: d.toISOString().split('T')[0],
      dayName: i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateNum: d.getDate(),
      monthName: d.toLocaleDateString('en-US', { month: 'short' }),
    };
  }), []);

  // Fetch provider details
  useEffect(() => {
    apiRequest<any>(`/discovery/providers/${providerId}`)
      .then((data) => {
        setProvider(data);
        if (data.facilities && data.facilities.length > 0) {
          setSelectedFacilityId(data.facilities[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [providerId]);

  // Fetch slots whenever target date changes
  useEffect(() => {
    if (!selectedDate || !providerId) return;
    setSlotsLoading(true);
    apiRequest<{ slots: any[] }>(`/discovery/slots?professional_id=${providerId}&target_date=${selectedDate}`)
      .then((res) => {
        const slots = res.slots || [];
        setAvailableSlots(slots);

        // If the initial slot is present and available on this date, retain it; otherwise select first available
        if (initialSlot && selectedDate === initialDate && slots.some((s: any) => s.slot_time === initialSlot && s.is_available)) {
          setSelectedSlot(initialSlot);
        } else {
          const firstAvail = slots.find((s: any) => s.is_available);
          setSelectedSlot(firstAvail ? firstAvail.slot_time : '');
        }
      })
      .catch(() => setAvailableSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate, providerId, initialSlot, initialDate]);

  const handleProceedToBooking = () => {
    if (!selectedSlot) return;
    router.push(
      `/book/${providerId}?date=${selectedDate}&slot=${encodeURIComponent(selectedSlot)}&facility_id=${selectedFacilityId || ''}`
    );
  };

  if (loading) {
    return <div className="p-20 text-center text-xs text-[#6e827a]">Loading doctor profile...</div>;
  }

  if (!provider) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h2 className="text-lg font-bold text-[#172b28]">Doctor Not Found</h2>
        <p className="text-xs text-[#677b73] mt-1 mb-4">
          The requested healthcare provider record could not be loaded.
        </p>
        <Link href="/search" className="px-4 py-2 rounded-xl bg-[#137b65] text-white text-xs font-bold">
          Return to search
        </Link>
      </div>
    );
  }

  const { bg: avatarBg, text: avatarText } = seedToHsl(provider.avatar_seed || provider.full_name);
  const initials = provider.full_name
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const languages = provider.languages_list || (provider.languages ? provider.languages.split(',').map((l: string) => l.trim()) : []);
  const services = provider.services_list || (provider.services_offered ? provider.services_offered.split(',').map((s: string) => s.trim()) : []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-[#6e827a] mb-6">
        <Link href="/" className="hover:text-[#137b65]">Home</Link>
        <ChevronRight size={12} />
        <Link href="/search" className="hover:text-[#137b65]">Discovery</Link>
        <ChevronRight size={12} />
        <span className="text-[#172b28] font-semibold">{provider.title} {provider.full_name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Doctor Bio & Credentials */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Info Card */}
          <div className="bg-white border border-[#e2ece5] rounded-3xl p-6 sm:p-8 shadow-xs">
            <div className="flex items-start gap-5">
              <div
                style={{ backgroundColor: avatarBg, color: avatarText }}
                className="w-20 h-20 rounded-2xl font-bold text-2xl flex items-center justify-center shrink-0 tracking-wider shadow-xs"
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  {provider.is_sample ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#486358] bg-[#edf4f0] border border-[#d2e2d8] px-2.5 py-0.5 rounded-full">
                      Demo profile
                    </span>
                  ) : provider.verification_status === 'verified' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      <ShieldCheck size={13} /> Verified Professional
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                      Pending Verification
                    </span>
                  )}
                  {provider.gender && provider.gender !== 'Any' && (
                    <span className="text-[10px] text-[#556963] bg-[#f2f7f4] px-2 py-0.5 rounded-full">
                      {provider.gender}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl font-extrabold text-[#172b28] tracking-tight">
                  {provider.title} {provider.full_name}
                </h1>
                <p className="text-sm font-semibold text-[#137b65] mt-0.5">
                  {provider.specialties?.map((s: any) => s.name).join(', ')} ·{' '}
                  <span className="text-[#687e76] font-normal">{provider.qualification}</span>
                </p>

                {/* Consultation Modes & Languages */}
                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
                  {provider.teleconsultation_available && (
                    <span className="inline-flex items-center gap-1 text-blue-700 font-medium">
                      <Video size={13} /> Video Consultation Available
                    </span>
                  )}
                  {(provider.in_person_available ?? true) && (
                    <span className="inline-flex items-center gap-1 text-[#137b65] font-medium">
                      <Building2 size={13} /> In-person Visits
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-[#5f746d] mt-3 pt-3 border-t border-[#edf2ee]">
                  <span>{provider.experience_years} Years Experience</span>
                  <span>·</span>
                  <span className="font-bold text-[#172b28] flex items-center">
                    Consultation Fee: <IndianRupee size={12} className="ml-1 mr-0.5" />{formatINR(provider.consultation_fee)}
                  </span>
                  <span>·</span>
                  <span className="text-[11px] text-[#81958d]">Reg: {provider.registration_number}</span>
                </div>
              </div>
            </div>

            {/* Languages Spoken */}
            {languages.length > 0 && (
              <div className="mt-5 pt-4 border-t border-[#edf2ee] flex items-center gap-2">
                <Globe size={14} className="text-[#899f96] shrink-0" />
                <span className="text-xs font-semibold text-[#50645e]">Languages:</span>
                <div className="flex flex-wrap gap-1.5">
                  {languages.map((l: string) => (
                    <span
                      key={l}
                      className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#f4f8f5] text-[#2c443c] border border-[#dce8e0]"
                    >
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Bio */}
            {provider.bio && (
              <div className="mt-6 pt-5 border-t border-[#edf2ee]">
                <h3 className="text-xs font-bold text-[#172b28] uppercase tracking-wider mb-2">
                  Professional Background
                </h3>
                <p className="text-xs text-[#52665f] leading-relaxed">
                  {provider.bio}
                </p>
              </div>
            )}

            {/* Services Offered */}
            {services.length > 0 && (
              <div className="mt-6 pt-5 border-t border-[#edf2ee]">
                <h3 className="text-xs font-bold text-[#172b28] uppercase tracking-wider mb-2.5">
                  Specialized Services &amp; Treatments
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {services.map((svc: string) => (
                    <span
                      key={svc}
                      className="text-xs px-3 py-1 rounded-xl bg-[#f7faf8] text-[#137b65] border border-[#d6e7dc] font-medium"
                    >
                      {svc}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer for Demo Record */}
            {provider.is_sample && (
              <div className="mt-6 p-3.5 bg-[#fbfcfb] border border-[#e5ebe7] rounded-2xl flex items-start gap-2.5 text-[11px] text-[#71867e]">
                <Info size={15} className="shrink-0 text-[#8fa39b] mt-0.5" />
                <span>
                  <strong>Demo Directory Record:</strong> This healthcare professional profile is created for demonstration and testing purposes. Availability slots simulate real practice schedules.
                </span>
              </div>
            )}
          </div>

          {/* Affiliated Facilities */}
          <div className="bg-white border border-[#e2ece5] rounded-3xl p-6 shadow-xs">
            <h3 className="text-sm font-bold text-[#172b28] mb-4">Practice Locations &amp; Hospitals</h3>
            <div className="space-y-3">
              {provider.facilities?.map((f: any) => (
                <div
                  key={f.id}
                  onClick={() => setSelectedFacilityId(f.id)}
                  className={`p-4 rounded-2xl border transition cursor-pointer flex items-start justify-between ${
                    selectedFacilityId === f.id
                      ? 'bg-[#f4f9f6] border-[#137b65]'
                      : 'bg-white border-[#e9eee9] hover:border-[#ccd9d1]'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-[#172b28]">{f.name}</h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-[#e1eae3] text-[#556963]">
                        {f.facility_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-[#6d8079] mt-1">
                      <MapPin size={12} /> {f.address}, {f.city}
                    </div>
                  </div>
                  {selectedFacilityId === f.id && (
                    <CheckCircle2 size={18} className="text-[#137b65] shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Appointment Scheduler */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 bg-white border border-[#e2ece5] rounded-3xl p-6 shadow-md">
            <div className="flex items-center justify-between pb-4 border-b border-[#edf2ee] mb-5">
              <div>
                <h3 className="text-base font-bold text-[#172b28]">Select Appointment Time</h3>
                <p className="text-[11px] text-[#6e827a] mt-0.5">Direct calendar booking with instant confirmation</p>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-[#137b65]" />
            </div>

            {/* Date Selector */}
            <div className="mb-5">
              <label className="block text-[10px] font-bold text-[#6a7d76] uppercase tracking-wider mb-2">
                Choose Date (Next 14 Days)
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {nextDays.map((d) => (
                  <button
                    key={d.iso}
                    onClick={() => setSelectedDate(d.iso)}
                    className={`shrink-0 w-14 py-2 rounded-xl text-center border transition ${
                      selectedDate === d.iso
                        ? 'bg-[#137b65] text-white border-[#137b65] shadow-xs'
                        : 'bg-[#fbfcfa] border-[#e2ece5] text-[#485d56] hover:bg-[#f2f7f4]'
                    }`}
                  >
                    <span className="block text-[10px] font-medium opacity-90">{d.dayName}</span>
                    <span className="block text-sm font-bold mt-0.5">{d.dateNum}</span>
                    <span className="block text-[9px] opacity-75">{d.monthName}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Slot Picker */}
            <div className="mb-6">
              <label className="block text-[10px] font-bold text-[#6a7d76] uppercase tracking-wider mb-2">
                Available Consultation Slots
              </label>

              {slotsLoading ? (
                <div className="py-8 text-center text-xs text-[#71847e] flex items-center justify-center gap-2">
                  <Clock size={14} className="animate-spin text-[#137b65]" />
                  Loading available slots...
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="p-4 bg-[#f9fbf9] border border-[#e8eee9] rounded-xl text-center text-xs text-[#6e8079]">
                  No consultation slots available on this date.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {availableSlots.map((s) => (
                    <button
                      key={s.slot_time}
                      disabled={!s.is_available}
                      onClick={() => setSelectedSlot(s.slot_time)}
                      className={`py-2 px-1 text-xs font-semibold rounded-xl border text-center transition ${
                        !s.is_available
                          ? 'bg-[#f5f7f5] text-[#a5b2ac] border-[#eaefea] cursor-not-allowed line-through'
                          : selectedSlot === s.slot_time
                          ? 'bg-[#137b65] text-white border-[#137b65] shadow-xs'
                          : 'bg-[#f8faf8] text-[#1c302b] border-[#d8e7dc] hover:border-[#137b65]'
                      }`}
                    >
                      {s.slot_time}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Booking Summary Strip */}
            <div className="bg-[#f7faf8] p-3.5 rounded-xl border border-[#e4eee7] text-xs text-[#52665f] space-y-1 mb-5">
              <div className="flex justify-between">
                <span>Consultation Fee:</span>
                <span className="font-bold text-[#172b28]">₹{formatINR(provider.consultation_fee)}</span>
              </div>
              <div className="flex justify-between">
                <span>Selected Date:</span>
                <span className="font-bold text-[#172b28]">{selectedDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Selected Time:</span>
                <span className="font-bold text-[#137b65]">
                  {selectedSlot || 'None selected'}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleProceedToBooking}
              disabled={!selectedSlot}
              className={`w-full py-3 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-2 transition ${
                selectedSlot
                  ? 'bg-[#137b65] text-white shadow-sm hover:bg-[#0e6351] cursor-pointer'
                  : 'bg-[#e2ece5] text-[#869690] cursor-not-allowed'
              }`}
            >
              Continue to Confirm Booking <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProviderProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return (
    <Suspense fallback={<div className="p-20 text-center text-xs text-[#6e827a]">Loading doctor profile...</div>}>
      <ProviderProfileContent providerId={resolvedParams.id} />
    </Suspense>
  );
}
