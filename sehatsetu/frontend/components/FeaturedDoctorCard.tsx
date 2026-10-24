'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  MapPin,
  IndianRupee,
  Video,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { formatINR } from '@/lib/api';
import { ProviderProps } from './ProviderCard';
import DoctorAvatarImage from './DoctorAvatarImage';

function seedToHsl(seed: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  const sat = 36 + (Math.abs(hash >> 4) % 24);
  const light = 34 + (Math.abs(hash >> 8) % 16);
  const bgLight = 92 + (Math.abs(hash >> 12) % 6);
  return {
    bg: `hsl(${hue}, ${sat}%, ${bgLight}%)`,
    text: `hsl(${hue}, ${sat}%, ${light}%)`,
  };
}

export default function FeaturedDoctorCard({ provider }: { provider: ProviderProps }) {
  const primaryFacility = provider.facilities?.[0];
  const { bg, text } = seedToHsl(provider.avatar_seed || provider.full_name);
  const initials = provider.full_name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Extract slots for today/upcoming
  const todayEntry = provider.availability_days?.find((d) => d.is_today && d.is_available);
  const firstAvailableEntry = provider.availability_days?.find((d) => d.is_available && d.available_count > 0);
  const activeDay = todayEntry || firstAvailableEntry;
  const activeDate = activeDay?.date || new Date().toISOString().split('T')[0];
  const sampleSlots = activeDay?.slots_sample || provider.available_slots_sample || ['10:00', '11:30', '14:00', '16:00'];

  return (
    <article className="bg-white border border-[#e2ece5] rounded-3xl p-5 shadow-xs hover:shadow-md hover:border-[#b8d8c3] transition duration-200 flex flex-col justify-between h-full min-w-0">
      <div>
        {/* Top Header: Avatar + Badges + Doctor Info */}
        <div className="flex items-start gap-3.5 mb-3.5">
          <DoctorAvatarImage
            name={provider.full_name}
            specialty={provider.specialties?.[0]}
            size={52}
            showBadge={true}
            className="w-[52px] h-[52px] rounded-2xl shrink-0 border border-white/60 shadow-xs"
          />

          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              {provider.is_sample ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#486358] bg-[#edf4f0] px-2 py-0.5 rounded-full border border-[#d2e2d8]">
                  Demo profile
                </span>
              ) : provider.verification_status === 'verified' ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck size={11} /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Pending
                </span>
              )}

              {provider.teleconsultation_available && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100">
                  <Video size={10} /> Video
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-[#172b28] leading-tight truncate">
              {provider.title} {provider.full_name}
            </h3>

            <p className="text-xs text-[#245244] font-semibold mt-0.5 truncate">
              {provider.specialties.join(', ')}
              {provider.qualification && (
                <span className="text-[#647b72] font-normal"> · {provider.qualification}</span>
              )}
            </p>
          </div>
        </div>

        {/* Facility Info */}
        {primaryFacility && (
          <div className="bg-[#f9fbf9] p-3 rounded-2xl border border-[#edf3ee] mb-3 text-xs text-[#485d56]">
            <div className="font-bold text-[#1a2e28] flex items-center justify-between gap-1 mb-1">
              <span className="truncate">{primaryFacility.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-white border border-[#e2ece5] text-[#556963] font-medium shrink-0">
                {primaryFacility.facility_type}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#6d827a] truncate">
              <MapPin size={12} className="shrink-0 text-[#8ba29a]" />
              <span className="truncate">
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

        {/* Experience & Fee */}
        <div className="grid grid-cols-2 gap-2 py-2.5 border-y border-[#edf2ee] mb-3 text-xs text-[#52665f]">
          <div>
            <span className="text-[10px] text-[#7d9089] uppercase tracking-wider block font-semibold">
              Experience
            </span>
            <span className="font-bold text-[#1a2d29] text-xs sm:text-sm mt-0.5 block">
              {provider.experience_years} Years
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#7d9089] uppercase tracking-wider block font-semibold">
              Consultation Fee
            </span>
            <span className="font-bold text-[#137b65] text-xs sm:text-sm flex items-center justify-end mt-0.5 whitespace-nowrap">
              <IndianRupee size={13} className="shrink-0 mr-0.5" />
              {formatINR(provider.consultation_fee)}
            </span>
          </div>
        </div>

        {/* Available Slots */}
        <div className="mb-2">
          <div className="text-[11px] font-semibold text-[#556a63] flex items-center justify-between mb-2">
            <span className="flex items-center gap-1">
              <Clock size={12} className="text-[#137b65]" />
              {activeDay?.is_today ? "Today's Slots" : 'Available Slots'}
            </span>
            {activeDay && !activeDay.is_today && (
              <span className="text-[10px] text-[#137b65] bg-[#eef7f2] px-1.5 py-0.5 rounded font-medium">
                {activeDay.day_name} {activeDay.formatted_date}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sampleSlots.slice(0, 4).map((slot) => (
              <Link
                key={slot}
                href={`/book/${provider.id}?date=${activeDate}&slot=${encodeURIComponent(slot)}`}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#f2f8f4] text-[#137b65] border border-[#d2e7da] hover:bg-[#137b65] hover:text-white transition shadow-2xs"
              >
                {slot}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 pt-3 border-t border-[#edf2ee] grid grid-cols-2 gap-2">
        <Link
          href={`/providers/${provider.id}`}
          className="w-full inline-flex items-center justify-center py-2 px-3 rounded-xl border border-[#dce8e0] bg-white text-[#203a31] text-xs font-semibold hover:bg-[#f6faf8] transition text-center"
        >
          View Profile
        </Link>
        <Link
          href={`/book/${provider.id}?date=${activeDate}&slot=${encodeURIComponent(sampleSlots[0] || '10:00')}`}
          className="w-full inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-[#137b65] text-white text-xs font-semibold hover:bg-[#0f6754] transition text-center shadow-xs"
        >
          Book <ArrowRight size={12} />
        </Link>
      </div>
    </article>
  );
}
