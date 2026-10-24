'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  MapPin,
  IndianRupee,
  Video,
  Building2,
  ChevronRight,
  Calendar,
  Globe,
  UserCheck,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { formatINR } from '@/lib/api';
import FeaturedDoctorCard from './FeaturedDoctorCard';
import DoctorAvatarImage from './DoctorAvatarImage';

export { default as FeaturedDoctorCard } from './FeaturedDoctorCard';

export interface DayAvailability {
  date: string;
  day_name: string;
  formatted_date: string;
  available_count: number;
  is_available: boolean;
  is_today: boolean;
  slots_sample: string[];
}

export interface ProviderProps {
  id: number;
  user_id: number;
  title: string;
  full_name: string;
  qualification: string;
  experience_years: number;
  consultation_fee: number;
  verification_status: string;
  is_sample?: boolean;
  gender?: string;
  languages?: string;
  teleconsultation_available?: boolean;
  in_person_available?: boolean;
  rating?: number | null;
  review_count?: number;
  avatar_seed?: string;
  services_offered?: string;
  specialties: string[];
  facilities: Array<{
    id: number;
    name: string;
    facility_type: string;
    address: string;
    city: string;
  }>;
  available_slots_sample?: string[];
  distance_km?: number;
  next_available_date?: string | null;
  availability_days?: DayAvailability[];
}

/** Deterministic HSL color generator for avatar initials */
function seedToHsl(seed: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  const sat = 36 + (Math.abs(hash >> 4) % 24); // 36-60%
  const light = 34 + (Math.abs(hash >> 8) % 16); // 34-50%
  const bgLight = 92 + (Math.abs(hash >> 12) % 6); // 92-98%
  return {
    bg: `hsl(${hue}, ${sat}%, ${bgLight}%)`,
    text: `hsl(${hue}, ${sat}%, ${light}%)`,
  };
}

function DoctorAvatar({ seed, name, specialty, size = 64 }: { seed?: string; name: string; specialty?: string; size?: number }) {
  return (
    <DoctorAvatarImage
      name={name}
      specialty={specialty}
      size={size}
      showBadge={true}
      className="shadow-sm border border-white/80 shrink-0 rounded-2xl"
    />
  );
}

function FullWidthDoctorCard({ provider }: { provider: ProviderProps }) {
  const primaryFacility = provider.facilities?.[0];
  const availDays = provider.availability_days || [];

  // Default to first available date or first day in strip
  const firstAvailableDay = availDays.find((d) => d.is_available);
  const [selectedDate, setSelectedDate] = useState<string | null>(
    firstAvailableDay ? firstAvailableDay.date : availDays[0]?.date || null
  );
  const [showMoreDates, setShowMoreDates] = useState(false);

  // Show 7 days normally, 14 when expanded
  const visibleDays = showMoreDates ? availDays : availDays.slice(0, 7);
  const selectedDayEntry = availDays.find((d) => d.date === selectedDate);

  const languages = provider.languages
    ? provider.languages.split(',').map((l) => l.trim()).filter(Boolean)
    : [];

  const nextAvailDateStr = provider.next_available_date;
  const nextAvailEntry = availDays.find((d) => d.date === nextAvailDateStr);

  // Determine booking target href
  const targetDate = selectedDate || nextAvailDateStr || new Date().toISOString().split('T')[0];
  const firstSlot = selectedDayEntry?.slots_sample?.[0] || '10:00';
  const bookHref = `/book/${provider.id}?date=${targetDate}&slot=${encodeURIComponent(firstSlot)}`;

  return (
    <article className="w-full bg-white border border-[#e2ece5] rounded-3xl p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-[#b8d8c3] transition duration-200">
      {/* 
        Responsive Layout:
        - Mobile & Tablet (<1200px): Single-column stacked (grid-cols-1), giving doctor details 100% width.
        - Desktop (>=1200px): 2-column layout (min-[1200px]:grid-cols-[minmax(0,1.6fr)_minmax(360px,1fr)]),
          allocating approx 62% width to doctor details and 38% to availability.
      */}
      <div className="grid grid-cols-1 min-[1200px]:grid-cols-[minmax(0,1.6fr)_minmax(360px,1fr)] gap-6 items-stretch min-w-0">
        
        {/* ── Left Section: Doctor Details (62% width on desktop, 100% on tablet/mobile) ── */}
        <div className="flex flex-col justify-between space-y-4 min-w-0">
          <div className="min-w-0">
            {/* Header: Avatar & Doctor Identity */}
            <div className="flex items-start gap-4 min-w-0">
              <DoctorAvatar
                seed={provider.avatar_seed || provider.full_name}
                name={provider.full_name}
                specialty={provider.specialties?.[0]}
                size={64}
              />

              <div className="flex-1 min-w-0">
                {/* Status Badges */}
                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                  {/* Demo Profile Label: Never falsely verify fictional doctors */}
                  {provider.is_sample ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#486358] bg-[#edf4f0] px-2.5 py-0.5 rounded-full border border-[#d2e2d8] shrink-0">
                      Demo profile
                    </span>
                  ) : provider.verification_status === 'verified' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                      <ShieldCheck size={11} /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 shrink-0">
                      Pending Verification
                    </span>
                  )}

                  {/* Consultation Mode Badges */}
                  {provider.teleconsultation_available && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 shrink-0">
                      <Video size={10} /> Video
                    </span>
                  )}
                  {(provider.in_person_available ?? true) && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#137b65] bg-[#eaf5ee] px-2 py-0.5 rounded-full border border-[#c8e2d4] shrink-0">
                      <Building2 size={10} /> In-person
                    </span>
                  )}
                </div>

                {/* Name */}
                <h2 className="text-lg sm:text-xl font-bold text-[#172b28] leading-snug break-normal">
                  {provider.title} {provider.full_name}
                </h2>

                {/* Specialties & Qualification */}
                <p className="text-xs sm:text-sm text-[#245244] font-semibold mt-1 leading-normal break-normal">
                  {provider.specialties.join(' · ')}
                  {provider.qualification && (
                    <span className="text-[#5b7269] font-normal"> · {provider.qualification}</span>
                  )}
                </p>
              </div>
            </div>

            {/* Clinic / Facility Location */}
            {primaryFacility && (
              <div className="mt-3.5 bg-[#f9fbf9] p-3.5 rounded-2xl border border-[#edf3ee] text-xs text-[#485d56] min-w-0">
                <div className="font-bold text-[#1a2e28] flex items-center justify-between gap-2">
                  <span className="break-normal">{primaryFacility.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-[#e2ece5] text-[#556963] font-medium shrink-0">
                    {primaryFacility.facility_type}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#6d827a] mt-1 break-normal">
                  <MapPin size={12} className="shrink-0 text-[#8ba29a]" />
                  <span>
                    {primaryFacility.address}, {primaryFacility.city}
                  </span>
                  {provider.distance_km && (
                    <span className="text-[#137b65] font-semibold shrink-0">
                      · {provider.distance_km} km
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Experience & Consultation Fee */}
            <div className="grid grid-cols-2 gap-4 py-3 border-y border-[#edf2ee] mt-3.5 text-xs text-[#52665f]">
              <div>
                <span className="text-[10px] text-[#7d9089] uppercase tracking-wider block font-semibold">
                  Experience
                </span>
                <span className="font-bold text-[#1a2d29] text-xs sm:text-sm mt-0.5 block">
                  {provider.experience_years} Years
                </span>
              </div>
              <div className="text-right min-w-0">
                <span className="text-[10px] text-[#7d9089] uppercase tracking-wider block font-semibold truncate">
                  Consultation Fee
                </span>
                <span className="font-bold text-[#137b65] text-sm sm:text-base flex items-center justify-end mt-0.5 whitespace-nowrap">
                  <IndianRupee size={14} className="shrink-0 mr-0.5" />{formatINR(provider.consultation_fee)}
                </span>
              </div>
            </div>

            {/* Languages Spoken */}
            {languages.length > 0 && (
              <div className="flex items-center gap-1.5 mt-3 text-xs text-[#52665f] flex-wrap">
                <Globe size={13} className="shrink-0 text-[#8aa198]" />
                <span className="text-[11px] font-medium text-[#70847c]">Languages:</span>
                <div className="flex flex-wrap gap-1">
                  {languages.map((l) => (
                    <span
                      key={l}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-[#f4f8f5] text-[#2f4940] border border-[#dce8e0]"
                    >
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* View Profile Action */}
          <div className="pt-2">
            <Link
              href={`/providers/${provider.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#137b65] hover:text-[#0b5444] hover:underline"
            >
              <UserCheck size={14} /> View Full Doctor Profile &amp; Practice Details
            </Link>
          </div>
        </div>

        {/* ── Right Section: Availability Calendar & Booking (38% width on desktop, 100% on tablet/mobile) ── */}
        <div className="min-[1200px]:border-l min-[1200px]:border-[#edf2ee] min-[1200px]:pl-6 pt-5 min-[1200px]:pt-0 border-t border-[#edf2ee] min-[1200px]:border-t-0 flex flex-col justify-between min-w-0">
          <div>
            {/* Header: Next Available appointment & Toggle */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#edf2ee] min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#172b28] min-w-0">
                <Calendar size={14} className="text-[#137b65] shrink-0" />
                <span className="shrink-0">Availability</span>
                {nextAvailEntry && (
                  <span className="text-[11px] font-medium text-[#137b65] bg-[#edf8f2] px-2 py-0.5 rounded-full truncate">
                    Next: {nextAvailEntry.day_name} {nextAvailEntry.formatted_date}
                  </span>
                )}
              </div>

              {availDays.length > 7 && (
                <button
                  type="button"
                  onClick={() => setShowMoreDates(!showMoreDates)}
                  className="text-[11px] font-bold text-[#137b65] hover:underline flex items-center gap-0.5 shrink-0 ml-2"
                >
                  {showMoreDates ? 'Show 7 days' : 'More dates'}
                  <ChevronRight
                    size={12}
                    className={`transition-transform duration-200 ${showMoreDates ? 'rotate-90' : ''}`}
                  />
                </button>
              )}
            </div>

            {/* Date Selection Strip */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none min-w-0">
              {visibleDays.length === 0 ? (
                <div className="text-xs text-[#899f96] py-3">Schedule data currently syncing...</div>
              ) : (
                visibleDays.map((day) => {
                  const isSelected = selectedDate === day.date;
                  const hasSlots = day.is_available && day.available_count > 0;

                  return (
                    <button
                      key={day.date}
                      type="button"
                      disabled={!hasSlots}
                      onClick={() => setSelectedDate(day.date)}
                      title={
                        hasSlots
                          ? `${day.available_count} slot${day.available_count !== 1 ? 's' : ''} available`
                          : 'No open slots on this date'
                      }
                      className={`
                        shrink-0 flex flex-col items-center justify-center w-[52px] sm:w-[56px] py-2 px-1 rounded-2xl border text-center transition-all
                        ${
                          isSelected
                            ? 'bg-[#137b65] border-[#137b65] text-white shadow-sm'
                            : hasSlots
                            ? day.is_today
                              ? 'bg-[#edf9f3] border-[#137b65] text-[#137b65] hover:bg-[#dff3e8]'
                              : 'bg-white border-[#d2e7da] text-[#2b4840] hover:border-[#137b65] hover:bg-[#f2f8f5]'
                            : 'bg-[#f6f8f7] border-[#e9eeea] text-[#b4c3bd] cursor-not-allowed opacity-60'
                        }
                      `}
                    >
                      <span className="text-[9px] font-semibold uppercase tracking-wider opacity-85 leading-none">
                        {day.day_name}
                      </span>
                      <span className="text-sm font-extrabold mt-1 leading-none">
                        {day.formatted_date.split(' ')[0]}
                      </span>
                      <span className="text-[8px] opacity-75 mt-0.5 leading-none">
                        {day.formatted_date.split(' ')[1] || ''}
                      </span>

                      {hasSlots ? (
                        <span
                          className={`mt-1.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full leading-tight ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-[#eaf5ee] text-[#137b65]'
                          }`}
                        >
                          {day.available_count}
                        </span>
                      ) : (
                        <span className="mt-2 w-3 h-0.5 rounded bg-[#ccd6d2]" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Time Slots Preview for Selected Date */}
            <div className="mt-3.5 bg-[#fbfcfa] p-3.5 rounded-2xl border border-[#edf3ee] min-w-0">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#4c635b] mb-2.5">
                <span className="flex items-center gap-1 truncate">
                  <Clock size={12} className="shrink-0" />
                  {selectedDayEntry
                    ? `${selectedDayEntry.day_name}, ${selectedDayEntry.formatted_date} Slots`
                    : 'Available Slots'}
                </span>
                <span className="text-[10px] font-normal text-[#758981] shrink-0">
                  {selectedDayEntry?.available_count || 0} open slots
                </span>
              </div>

              {selectedDayEntry?.is_available && selectedDayEntry.slots_sample.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {selectedDayEntry.slots_sample.map((slot) => (
                    <Link
                      key={slot}
                      href={`/book/${provider.id}?date=${selectedDate}&slot=${encodeURIComponent(slot)}`}
                      className="py-1.5 px-2 text-xs font-bold rounded-xl text-center bg-white text-[#137b65] border border-[#cbe1d3] hover:bg-[#137b65] hover:text-white transition shadow-xs"
                    >
                      {slot}
                    </Link>
                  ))}
                  <Link
                    href={`/providers/${provider.id}?date=${selectedDate}`}
                    className="py-1.5 px-2 text-xs font-semibold rounded-xl text-center bg-[#f2f7f4] text-[#415951] border border-[#d5e4db] hover:bg-[#137b65] hover:text-white transition"
                  >
                    All slots →
                  </Link>
                </div>
              ) : (
                <p className="text-[11px] text-[#869b92] italic py-1">
                  No direct slots available on this date. Please select another date above.
                </p>
              )}
            </div>
          </div>

          {/* Primary CTA */}
          <div className="mt-4 pt-3 border-t border-[#edf2ee]">
            <Link
              href={bookHref}
              className="w-full py-3 px-4 rounded-2xl bg-[#137b65] text-white text-xs font-bold hover:bg-[#0e6351] transition shadow-xs inline-flex items-center justify-center gap-2"
            >
              Book Appointment <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function ProviderCard({
  provider,
  layout = 'full',
}: {
  provider: ProviderProps;
  layout?: 'full' | 'compact';
}) {
  if (layout === 'compact') {
    return <FeaturedDoctorCard provider={provider} />;
  }
  return <FullWidthDoctorCard provider={provider} />;
}
