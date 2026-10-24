'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export interface SpecialtyItem {
  id: string;
  name: string;
  query: string;
  renderIcon: () => React.ReactNode;
}

export const TOP_SPECIALTIES: SpecialtyItem[] = [
  {
    id: 'primary-care',
    name: 'Primary Care',
    query: 'General Physician',
    renderIcon: () => (
      <svg width="44" height="44" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Radiance ticks */}
        <line x1="24" y1="5" x2="24" y2="8" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="15" y1="8" x2="17" y2="10.5" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="33" y1="8" x2="31" y2="10.5" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
        {/* Golden Heart */}
        <path
          d="M24 16.5C21.5 12.5 16 12 13 15.5C9.5 19.5 10 24 13.5 27.5L24 37L34.5 27.5C38 24 38.5 19.5 35 15.5C32 12 26.5 12.5 24 16.5Z"
          fill="#fbb417"
        />
        {/* Supporting Hand */}
        <path
          d="M10 37C13 34.5 17 33 21 34C24 34.8 27 34 30 32C33 30 36 29 39 30C41 30.7 42 32 41 34C39.5 37 36 39 32 40.5L25 43C20 44.5 14 42 10 37Z"
          fill="#ffffff"
          stroke="#172b28"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M16 35.5C18.5 34 22 34 25 35.5"
          stroke="#172b28"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: 'dentist',
    name: 'Dentist',
    query: 'Dentist',
    renderIcon: () => (
      <svg width="44" height="44" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Whimsical Tooth Character with Legs and Big Smile */}
        {/* Top/Back head */}
        <path
          d="M14 20C12 14 16 8 24 8C32 8 36 14 34 20C33 25 31 34 29 37C28 38.5 26 38.5 25 36.5L24 34L23 36.5C22 38.5 20 38.5 19 37C17 34 15 25 14 20Z"
          fill="#fbb417"
          stroke="#172b28"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        {/* Open happy smile */}
        <path
          d="M17 21C20 26 28 26 31 21"
          stroke="#172b28"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* White front teeth inside mouth */}
        <rect x="21" y="17" width="3" height="4" rx="1" fill="white" stroke="#172b28" strokeWidth="1.8" />
        <rect x="24" y="17" width="3" height="4" rx="1" fill="white" stroke="#172b28" strokeWidth="1.8" />
        {/* Cute eyes */}
        <circle cx="19" cy="14" r="1.8" fill="#172b28" />
        <circle cx="29" cy="14" r="1.8" fill="#172b28" />
        {/* Little running legs */}
        <path d="M19 37L16 43" stroke="#172b28" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M29 37L32 43" stroke="#172b28" strokeWidth="2.2" strokeLinecap="round" />
        {/* Sparkle */}
        <path d="M36 11L38 13M38 11L36 13" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'ob-gyn',
    name: 'OB-GYN',
    query: 'Obstetrics & Gynaecology',
    renderIcon: () => (
      <svg width="44" height="44" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Whimsical Chromosome / DNA Spiral with sparkles */}
        {/* Left chromosome strand */}
        <path
          d="M16 10C18 14 18 19 16 23C13.5 28 13.5 33 16 38"
          stroke="#fbb417"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Right chromosome strand */}
        <path
          d="M32 10C30 14 30 19 32 23C34.5 28 34.5 33 32 38"
          stroke="#fbb417"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Connecting crossover loops */}
        <path
          d="M17 14L31 34"
          stroke="#172b28"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M31 14L17 34"
          stroke="#172b28"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* Center heart node */}
        <circle cx="24" cy="24" r="3.5" fill="#fbb417" stroke="#172b28" strokeWidth="2" />
        {/* Little sparkles */}
        <circle cx="12" cy="18" r="1.5" fill="#f59e0b" />
        <circle cx="36" cy="28" r="1.5" fill="#f59e0b" />
        <path d="M23 7L25 9M25 7L23 9" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'dermatologist',
    name: 'Dermatologist',
    query: 'Dermatologist',
    renderIcon: () => (
      <svg width="44" height="44" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Skin block layer with radiating soothing droplet */}
        {/* Bottom skin base */}
        <rect x="11" y="27" width="26" height="12" rx="3" fill="#fbb417" stroke="#172b28" strokeWidth="2.2" />
        {/* Pores on skin */}
        <circle cx="16" cy="33" r="1.3" fill="#172b28" />
        <circle cx="24" cy="33" r="1.3" fill="#172b28" />
        <circle cx="32" cy="33" r="1.3" fill="#172b28" />
        {/* Rising droplet / bump */}
        <path
          d="M24 13C24 13 18 20 18 23.5C18 26.8 20.7 29 24 29C27.3 29 30 26.8 30 23.5C30 20 24 13 24 13Z"
          fill="#f97316"
          stroke="#172b28"
          strokeWidth="2.2"
        />
        {/* Inner highlight */}
        <circle cx="22" cy="22" r="2" fill="white" />
        {/* Radiance sparkles around droplet */}
        <line x1="24" y1="8" x2="24" y2="10" stroke="#f97316" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="14" y1="13" x2="16" y2="15" stroke="#f97316" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="34" y1="13" x2="32" y2="15" stroke="#f97316" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'psychiatrist',
    name: 'Psychiatrist',
    query: 'Psychiatrist',
    renderIcon: () => (
      <svg width="44" height="44" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Whimsical tangled thoughts yellow yarn with spark ticks */}
        {/* Tangled brain cloud loops */}
        <path
          d="M17 24C15 20 17 15 22 14C24 11 28 11 30 13C33 13 36 15 36 19C38 21 38 25 36 28C38 31 36 35 32 36C29 38 25 37 23 35C20 37 16 35 15 31C13 28 14 25 17 24Z"
          fill="#fbb417"
        />
        {/* Playful scribble lines */}
        <path
          d="M18 22C21 17 27 17 30 21C33 25 25 28 22 24C19 20 28 16 32 24C34 28 27 33 23 30C20 27 24 23 28 26C31 28 30 33 27 34"
          stroke="#172b28"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Sparkle energy ticks */}
        <line x1="11" y1="14" x2="13" y2="16" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="37" y1="12" x2="35" y2="14" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="39" y1="23" x2="41" y2="23" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'eye-doctor',
    name: 'Eye Doctor',
    query: 'Ophthalmologist',
    renderIcon: () => (
      <svg width="44" height="44" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Whimsical round yellow spectacles with eyes and nose line */}
        {/* Left lens */}
        <circle cx="17" cy="24" r="8" fill="#fbb417" stroke="#172b28" strokeWidth="2.4" />
        {/* Right lens */}
        <circle cx="31" cy="24" r="8" fill="#fbb417" stroke="#172b28" strokeWidth="2.4" />
        {/* Bridge */}
        <path d="M25 24C25 22 23 22 23 24" stroke="#172b28" strokeWidth="2.4" strokeLinecap="round" />
        {/* Side arms */}
        <path d="M9 23L6 22" stroke="#172b28" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M39 23L42 22" stroke="#172b28" strokeWidth="2.4" strokeLinecap="round" />
        {/* Pupil dots looking friendly */}
        <circle cx="18" cy="23.5" r="2.2" fill="#172b28" />
        <circle cx="32" cy="23.5" r="2.2" fill="#172b28" />
        <circle cx="17" cy="22.5" r="0.8" fill="white" />
        <circle cx="31" cy="22.5" r="0.8" fill="white" />
        {/* Cute nose angle */}
        <path d="M24 28L25.5 32H22.5" stroke="#172b28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function TopSearchedSpecialties() {
  return (
    <section className="max-w-6xl mx-auto px-4" id="specialties">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl sm:text-[26px] font-extrabold text-[#172b28] tracking-tight">
          Top-searched specialties
        </h2>
        <Link
          href="/search"
          className="text-xs font-bold text-[#137b65] hover:underline inline-flex items-center gap-1 group shrink-0"
        >
          <span>All 18 specialties</span>
          <ArrowRight size={13} className="group-hover:translate-x-0.5 transition" />
        </Link>
      </div>

      {/* Grid matching reference from 2nd picture */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
        {TOP_SPECIALTIES.map((item) => (
          <Link
            key={item.id}
            href={`/search?service=${encodeURIComponent(item.query)}`}
            className="group relative bg-[#fef3c7] hover:bg-[#fee895] border border-[#fde48b] hover:border-[#fcd34d] rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-between text-center transition-all duration-200 transform hover:-translate-y-1 hover:shadow-md cursor-pointer"
          >
            {/* Crisp white circular icon badge */}
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-white flex items-center justify-center shadow-xs mb-3 group-hover:scale-108 transition-transform duration-200 shrink-0">
              {item.renderIcon()}
            </div>

            {/* Specialty title */}
            <span className="text-xs sm:text-[13px] font-bold text-[#1f2937] group-hover:text-[#111827] leading-tight">
              {item.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
