'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, CalendarCheck, CheckCircle2,
  MapPin, Search, ShieldCheck, Languages,
  Sparkles, Star, Video, Building2, CreditCard,
  UserCheck, Shield, Clock, Globe
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';
import { ProviderProps } from '@/components/ProviderCard';
import FeaturedDoctorCard from '@/components/FeaturedDoctorCard';
import CareContinuityWalkthrough from '@/components/CareContinuityWalkthrough';
import SchemeCard, { SchemeProps } from '@/components/SchemeCard';
import AppDownloadBanner from '@/components/AppDownloadBanner';
import FaqSection from '@/components/FaqSection';
import ScrollReveal from '@/components/ScrollReveal';
import {
  GeneralPhysicianIcon,
  PediatricsIcon,
  ObstetricsIcon,
  DentalCareIcon,
  DermatologyIcon,
  CardiologyIcon,
  VideoTeleconsultIcon,
  CivilHospitalsIcon,
} from '@/components/SpecialtyIcons';

/* Subtle botanical leaf vector decoration */
function BotanicalBranch({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M60 270 Q55 180 62 90 T60 10"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M61 220 C40 210 25 190 28 175 C42 178 55 195 61 220 Z"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M60 185 C80 175 95 155 92 140 C78 143 65 160 60 185 Z"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M61 145 C40 135 25 115 28 100 C42 103 55 120 61 145 Z"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M60 110 C80 100 95 80 92 65 C78 68 65 85 60 110 Z"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M61 70 C42 60 30 42 33 28 C46 31 56 48 61 70 Z"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M60 40 C76 30 88 15 85 4 C73 7 63 22 60 40 Z"
        fill="currentColor"
        opacity="0.85"
      />
      <circle cx="60" cy="10" r="3.5" fill="currentColor" />
    </svg>
  );
}

const heroDoctors = [
  {
    id: 1,
    name: 'Dr. Rajesh Kumar',
    initials: 'RK',
    specialty: 'General Physician',
    hospital: 'Sonipat Civil Hospital',
    slot: 'Today 10:30 AM',
    image: '/illustrations/doctor_rajesh.jpg',
    rating: '4.9 / 5.0',
    ratingLabel: 'Verified Patients',
    bookUrl: '/book/1',
    tag: 'Real-Time Lock',
  },
  {
    id: 2,
    name: 'Dr. Ananya Sharma',
    initials: 'AS',
    specialty: 'Pediatrics',
    hospital: 'Mehta Women & Child Centre',
    slot: 'Today 11:15 AM',
    image: '/illustrations/doctor_ananya.jpg',
    rating: '4.9 / 5.0',
    ratingLabel: 'Verified Parents',
    bookUrl: '/book/2',
    tag: 'Child Priority',
  },
  {
    id: 3,
    name: 'Dr. Priya Nair',
    initials: 'PN',
    specialty: 'Dental Care',
    hospital: 'SmileWell Dental Care',
    slot: 'Today 1:15 PM',
    image: '/illustrations/doctor_priya.jpg',
    rating: '4.8 / 5.0',
    ratingLabel: 'Verified Patients',
    bookUrl: '/book/3',
    tag: 'Painless Care',
  },
  {
    id: 4,
    name: 'Dr. Arjun Mehta',
    initials: 'AM',
    specialty: 'Cardiology',
    hospital: 'Metro Heart Institute',
    slot: 'Tomorrow 9:30 AM',
    image: '/illustrations/doctor_arjun.jpg',
    rating: '5.0 / 5.0',
    ratingLabel: 'Senior Specialist',
    bookUrl: '/search?service=Cardiologist',
    tag: 'Direct Token Hold',
  },
];

export default function Home() {
  const router = useRouter();
  const { t, openLanguageModal, languageOption } = useLanguage();
  const [visitMode, setVisitMode] = useState<'all' | 'in_person' | 'video'>('all');
  const [searchService, setSearchService] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedScheme, setSelectedScheme] = useState('');
  const [providers, setProviders] = useState<ProviderProps[]>([]);
  const [schemes, setSchemes] = useState<SchemeProps[]>([]);

  // Rotating hero doctor showcase
  const [activeHeroDocIndex, setActiveHeroDocIndex] = useState(0);
  const [isHeroHovered, setIsHeroHovered] = useState(false);

  useEffect(() => {
    if (isHeroHovered) return;
    const timer = setInterval(() => {
      setActiveHeroDocIndex((prev) => (prev + 1) % heroDoctors.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [isHeroHovered]);

  const currentHeroDoc = heroDoctors[activeHeroDocIndex];

  useEffect(() => {
    async function loadData() {
      try {
        const [provData, schemeData] = await Promise.all([
          apiRequest<ProviderProps[]>('/discovery/providers'),
          apiRequest<SchemeProps[]>('/schemes')
        ]);
        setProviders(provData);
        setSchemes(schemeData);
      } catch {
        // Fallback sample providers for instant display
        setProviders([
          {
            id: 1,
            user_id: 2,
            title: "Dr.",
            full_name: "Rajesh Kumar",
            qualification: "MBBS, MD (General Medicine)",
            experience_years: 12,
            consultation_fee: 300,
            verification_status: "verified",
            is_sample: true,
            specialties: ["General Physician"],
            facilities: [{ id: 1, name: "Sonipat Civil Hospital OPD", facility_type: "Government", address: "Civil Lines", city: "Sonipat" }],
            available_slots_sample: ["10:30", "11:15", "12:00"],
            distance_km: 1.2
          },
          {
            id: 2,
            user_id: 3,
            title: "Dr.",
            full_name: "Ananya Sharma",
            qualification: "MBBS, DCH (Pediatrics)",
            experience_years: 8,
            consultation_fee: 400,
            verification_status: "verified",
            is_sample: true,
            specialties: ["Pediatrics"],
            facilities: [{ id: 4, name: "Mehta Women & Child Centre", facility_type: "Private", address: "Model Town", city: "Sonipat" }],
            available_slots_sample: ["11:00", "12:30", "16:00"],
            distance_km: 2.4
          },
          {
            id: 3,
            user_id: 4,
            title: "Dr.",
            full_name: "Priya Nair",
            qualification: "BDS, MDS (Conservative Dentistry)",
            experience_years: 6,
            consultation_fee: 350,
            verification_status: "verified",
            is_sample: true,
            specialties: ["Dental Care"],
            facilities: [{ id: 5, name: "SmileWell Dental Care", facility_type: "Private", address: "Atlas Road", city: "Sonipat" }],
            available_slots_sample: ["09:45", "13:15", "15:30"],
            distance_km: 3.1
          }
        ]);
      }
    }
    loadData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchService) params.set('service', searchService);
    if (searchLocation) params.set('location', searchLocation);
    if (visitMode !== 'all') params.set('mode', visitMode);
    if (selectedScheme) params.set('scheme', selectedScheme);
    router.push(`/search?${params.toString()}`);
  };

  const popularSpecialties = [
    { name: t('generalPhysician'), query: "General Physician" },
    { name: t('dentist'), query: "Dentist" },
    { name: t('dermatologist'), query: "Dermatologist" },
    { name: t('pediatrician'), query: "Pediatrician" },
    { name: t('cardiologist'), query: "Cardiologist" },
    { name: t('orthopedist'), query: "Orthopedist" },
  ];

  const services = [
    {
      title: "General Physician",
      detail: "Fever, cold, health checks & chronic care",
      id: "General Physician",
      Icon: GeneralPhysicianIcon,
      accentBg: "bg-[#eaf7ef]",
      accentBorder: "hover:border-[#137b65]",
    },
    {
      title: "Pediatrics",
      detail: "Child care, immunizations & growth",
      id: "Pediatrics",
      Icon: PediatricsIcon,
      accentBg: "bg-[#fef5ee]",
      accentBorder: "hover:border-[#f97316]",
    },
    {
      title: "Obstetrics & Gynae",
      detail: "Maternal care, women's health & delivery",
      id: "Obstetrics & Gynaecology",
      Icon: ObstetricsIcon,
      accentBg: "bg-[#fbf0f7]",
      accentBorder: "hover:border-[#ec4899]",
    },
    {
      title: "Dental Care",
      detail: "Painless treatments, hygiene & fillings",
      id: "Dentist",
      Icon: DentalCareIcon,
      accentBg: "bg-[#eff8fb]",
      accentBorder: "hover:border-[#0284c7]",
    },
    {
      title: "Dermatology",
      detail: "Skin care, acne treatment & allergy tests",
      id: "Dermatologist",
      Icon: DermatologyIcon,
      accentBg: "bg-[#fef9ec]",
      accentBorder: "hover:border-[#d97706]",
    },
    {
      title: "Cardiology",
      detail: "Heart health, ECG, BP & chest comfort",
      id: "Cardiologist",
      Icon: CardiologyIcon,
      accentBg: "bg-[#fdf2f2]",
      accentBorder: "hover:border-[#ef4444]",
    },
    {
      title: "Video Teleconsult",
      detail: "e-Sanjeevani & instant virtual consults",
      id: "video",
      Icon: VideoTeleconsultIcon,
      accentBg: "bg-[#f0f4fd]",
      accentBorder: "hover:border-[#2563eb]",
    },
    {
      title: "Civil Hospitals",
      detail: "Empaneled OPDs & zero-queue token hold",
      id: "Government",
      Icon: CivilHospitalsIcon,
      accentBg: "bg-[#eef7f3]",
      accentBorder: "hover:border-[#137b65]",
    },
  ];

  return (
    <main className="space-y-16 sm:space-y-24 pb-24 sm:pb-20 bg-gradient-to-b from-[#fbfdfc] via-[#f4faf6] to-[#fbfdfc] relative">
      
      {/* ── 1. HERO SECTION (Zocdoc-Inspired Clean, Warm & Segmented Search) ── */}
      <section className="relative overflow-hidden pt-6 sm:pt-8 md:pt-14 pb-12 sm:pb-16">
        
        {/* Ambient background soft glow orbs */}
        <div className="absolute top-0 right-1/4 w-[32rem] h-[32rem] bg-gradient-to-br from-[#caeedc]/45 to-[#b0e4ce]/25 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-16 left-6 w-[26rem] h-[26rem] bg-gradient-to-tr from-[#fef5e7]/60 to-[#f9eed5]/35 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute -bottom-10 right-10 w-80 h-80 bg-[#d9f2e4]/40 rounded-full blur-2xl pointer-events-none -z-10" />

        {/* Subtle decorative botanical elements on outer edges */}
        <div className="hidden xl:block absolute top-12 -left-6 pointer-events-none select-none text-[#137b65]/20">
          <BotanicalBranch className="w-24 h-64 transform -rotate-12" />
        </div>
        <div className="hidden xl:block absolute top-20 -right-6 pointer-events-none select-none text-[#137b65]/20">
          <BotanicalBranch className="w-24 h-64 transform rotate-12 scale-x-[-1]" />
        </div>

        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-center">
            
            {/* Left Column: Heading + Value Props + Segmented Search Bar */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6">
              
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#eaf6ee]/90 backdrop-blur-xs text-[#137b65] text-[11px] sm:text-xs font-bold tracking-wide border border-[#cae5d4] shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#137b65] animate-ping" />
                <span>{t('verifiedBadge')}</span>
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#102d26] leading-[1.1]">
                {t('heroTitle1')} <span className="font-serif italic font-normal text-[#137b65]">{t('heroTitle2')}</span>
              </h1>

              {/* Subtext */}
              <p className="text-sm sm:text-lg text-[#4a635b] leading-relaxed max-w-xl font-normal">
                {t('heroSubtitle')}
              </p>

              {/* Zocdoc-Style Visit Mode Selector + Segmented Search Card */}
              <div className="space-y-2.5 sm:space-y-3">
                {/* Visit Mode Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-[#eef5f1] rounded-xl w-full sm:w-fit border border-[#d2e5db] overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setVisitMode('all')}
                    className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                      visitMode === 'all'
                        ? 'bg-[#e8f5ee] text-[#103e33] font-bold border border-[#b2ddc7] shadow-xs'
                        : 'text-[#5d736b] hover:text-[#172b28] border border-transparent'
                    }`}
                  >
                    {t('allVisits')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisitMode('in_person')}
                    className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                      visitMode === 'in_person'
                        ? 'bg-[#e8f5ee] text-[#103e33] font-bold border border-[#b2ddc7] shadow-xs'
                        : 'text-[#5d736b] hover:text-[#172b28] border border-transparent'
                    }`}
                  >
                    <Building2 size={13} className="text-[#137b65]" /> {t('inPerson')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisitMode('video')}
                    className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                      visitMode === 'video'
                        ? 'bg-[#e8f5ee] text-[#103e33] font-bold border border-[#b2ddc7] shadow-xs'
                        : 'text-[#5d736b] hover:text-[#172b28] border border-transparent'
                    }`}
                  >
                    <Video size={13} className="text-[#2563eb]" /> {t('videoVisit')}
                  </button>
                </div>

                {/* 3-Field Segmented Glassmorphic Search Panel */}
                <div className="bg-white/95 backdrop-blur-md border border-[#cde2d6] rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 shadow-xl shadow-[#137b65]/8 transition hover:border-[#137b65]/60 hover:shadow-2xl hover:shadow-[#137b65]/12">
                  <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-2">
                    
                    {/* Field 1: Doctor / Specialty / Condition */}
                    <div className="md:col-span-5 flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#f8faf9] border border-[#e2ede7] focus-within:bg-white focus-within:border-[#137b65] focus-within:ring-2 focus-within:ring-[#137b65]/15 transition">
                      <Search size={18} className="text-[#137b65] shrink-0" />
                      <div className="w-full">
                        <label className="block text-[9px] font-bold text-[#627770] uppercase tracking-wider">
                          {t('searchCondition')}
                        </label>
                        <input
                          type="text"
                          value={searchService}
                          onChange={(e) => setSearchService(e.target.value)}
                          placeholder="e.g. General Physician, Dentist, Fever"
                          className="w-full text-xs font-medium text-[#172b28] bg-transparent outline-none placeholder:text-[#91a39c]"
                        />
                      </div>
                    </div>

                    {/* Field 2: City / Locality */}
                    <div className="md:col-span-3 flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#f8faf9] border border-[#e2ede7] focus-within:bg-white focus-within:border-[#137b65] focus-within:ring-2 focus-within:ring-[#137b65]/15 transition">
                      <MapPin size={18} className="text-[#137b65] shrink-0" />
                      <div className="w-full">
                        <label className="block text-[9px] font-bold text-[#627770] uppercase tracking-wider">
                          {t('searchCity')}
                        </label>
                        <input
                          type="text"
                          value={searchLocation}
                          onChange={(e) => setSearchLocation(e.target.value)}
                          placeholder="e.g. Sonipat"
                          className="w-full text-xs font-medium text-[#172b28] bg-transparent outline-none placeholder:text-[#91a39c]"
                        />
                      </div>
                    </div>

                    {/* Field 3: Insurance / Health Scheme Dropdown */}
                    <div className="md:col-span-2 flex items-center gap-2 px-2.5 py-2.5 rounded-xl bg-[#f8faf9] border border-[#e2ede7] focus-within:bg-white focus-within:border-[#137b65] focus-within:ring-2 focus-within:ring-[#137b65]/15 transition">
                      <CreditCard size={17} className="text-[#137b65] shrink-0" />
                      <div className="w-full overflow-hidden">
                        <label className="block text-[9px] font-bold text-[#627770] uppercase tracking-wider truncate">
                          {t('insuranceScheme')}
                        </label>
                        <select
                          value={selectedScheme}
                          onChange={(e) => setSelectedScheme(e.target.value)}
                          className="w-full text-xs font-medium text-[#172b28] bg-transparent outline-none cursor-pointer truncate"
                        >
                          <option value="">All Plans / Cash</option>
                          <option value="pmjay">PM-JAY (Ayushman)</option>
                          <option value="cghs">CGHS / ECHS</option>
                          <option value="esanjeevani">e-Sanjeevani</option>
                          <option value="state">State Scheme</option>
                        </select>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="md:col-span-2">
                      <button
                        type="submit"
                        className="w-full h-full min-h-[46px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#137b65] to-[#0e6150] text-white font-bold text-xs hover:from-[#0f6754] hover:to-[#0a483c] shadow-md shadow-[#137b65]/20 hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                      >
                        {t('searchBtn')} <ArrowRight size={14} />
                      </button>
                    </div>

                  </form>
                </div>
              </div>

              {/* Popular quick tags with smooth hover transition */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="font-bold text-[#60776f] text-[11px] uppercase tracking-wider">{t('popular')}</span>
                {popularSpecialties.map((spec) => (
                  <Link
                    key={spec.name}
                    href={`/search?service=${encodeURIComponent(spec.query)}`}
                    className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs border border-[#d4e4db] text-[#243d35] hover:border-[#137b65] hover:text-[#137b65] hover:bg-[#edf7f2] hover:-translate-y-0.5 transition-all duration-150 text-[11px] font-medium shadow-2xs"
                  >
                    {spec.name}
                  </Link>
                ))}
              </div>

              {/* Real Value Pillars */}
              <div className="flex flex-wrap gap-4 text-xs font-semibold text-[#486058] pt-2">
                <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-[#137b65]" /> {t('slotLock')}</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-[#137b65]" /> {t('delayHold')}</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-[#137b65]" /> {t('pmjayVerified')}</span>
              </div>
            </div>

            {/* Right Column: Dynamic Rotating Doctor Showcase */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div
                className="relative w-full max-w-md mx-auto"
                onMouseEnter={() => setIsHeroHovered(true)}
                onMouseLeave={() => setIsHeroHovered(false)}
              >
                
                {/* Large Rounded Card Container with Layered Glow & Glass Border */}
                <div className="relative p-2.5 sm:p-3 rounded-[2.5rem] bg-gradient-to-br from-white/95 via-[#edf8f2]/90 to-[#fdf7ea]/90 border border-white/80 shadow-2xl backdrop-blur-sm group">
                  
                  {/* Doctor Carousel Progress Dots */}
                  <div className="absolute top-5 right-6 z-20 flex items-center gap-1.5 bg-black/35 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
                    {heroDoctors.map((doc, idx) => (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => setActiveHeroDocIndex(idx)}
                        aria-label={`Switch to ${doc.name}`}
                        className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                          idx === activeHeroDocIndex
                            ? 'w-5 bg-white'
                            : 'w-1.5 bg-white/40 hover:bg-white/80'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Photo container with layered cross-fade images */}
                  <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-[#ebf6f0] to-[#fff7e6] aspect-[4/4.5] sm:aspect-[4/4.6]">
                    {heroDoctors.map((doc, idx) => (
                      <img
                        key={doc.id}
                        src={doc.image}
                        alt={`${doc.name} - Verified ${doc.specialty} at SehatSetu`}
                        decoding="async"
                        className={`absolute inset-0 w-full h-full object-cover object-top transition-all duration-700 ease-out ${
                          idx === activeHeroDocIndex
                            ? 'opacity-100 scale-100'
                            : 'opacity-0 scale-104 pointer-events-none'
                        }`}
                      />
                    ))}
                    
                    {/* Subtle Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent pointer-events-none" />

                    {/* Doctor Info Pill inside image bottom */}
                    <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-white/70 z-10 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-[#137b65] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                            {currentHeroDoc.initials}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#172b28] flex items-center gap-1 truncate">
                              <span className="truncate">{currentHeroDoc.name}</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            </div>
                            <p className="text-[10px] text-[#137b65] font-semibold truncate">
                              {currentHeroDoc.specialty} · {currentHeroDoc.hospital}
                            </p>
                            <span className="text-[9px] text-[#6a8077] block font-medium">
                              {t('nextSlotLabel')} <strong className="text-[#172b28]">{currentHeroDoc.slot}</strong>
                            </span>
                          </div>
                        </div>
                        <Link
                          href={currentHeroDoc.bookUrl}
                          className="px-3 py-1.5 rounded-lg bg-[#137b65] text-white text-[11px] font-bold hover:bg-[#0c5949] transition-all shadow-xs shrink-0 cursor-pointer ml-2"
                        >
                          {t('bookNow')}
                        </Link>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Floating Badge 1: Confirmed Slot Status */}
                <div className="absolute -top-3 left-2 sm:-left-4 bg-white/95 backdrop-blur-md border border-[#cde4d6] rounded-2xl p-2.5 sm:p-3 shadow-xl flex items-center gap-2 sm:gap-2.5 transform hover:-translate-y-0.5 transition-all z-20">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#eaf6ee] text-[#137b65] flex items-center justify-center">
                    <CalendarCheck size={16} />
                  </div>
                  <div>
                    <span className="text-[8px] sm:text-[9px] uppercase font-bold text-[#137b65] tracking-wider block">
                      {currentHeroDoc.tag}
                    </span>
                    <span className="text-[11px] sm:text-xs font-bold text-[#172b28]">{t('zeroQueueWait')}</span>
                  </div>
                </div>

                {/* Floating Badge 2: Verified Rating */}
                <div className="absolute -bottom-3 right-2 sm:-right-4 bg-white/95 backdrop-blur-md border border-[#f8e7ca] rounded-2xl p-2.5 sm:p-3 shadow-xl flex items-center gap-2 sm:gap-2.5 transform hover:-translate-y-0.5 transition-all z-20">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Star size={16} className="fill-amber-400 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-[11px] sm:text-xs font-bold text-[#172b28] flex items-center gap-1">
                      {currentHeroDoc.rating}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-[#697d75] font-medium">
                      {t('verifiedPatients')}
                    </span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 2. TRUST BENEFITS STRIP (Row of 3 Supported Guarantees - Scroll Reveal) ── */}
      <section className="max-w-6xl mx-auto px-4 -mt-4 sm:-mt-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-5">
          
          {/* Pillar 1: Trusted Doctors */}
          <ScrollReveal delayMs={0} className="h-full">
            <div className="h-full bg-white/95 backdrop-blur-md border border-[#d6e8de] rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-lg hover:border-[#137b65] transition-all duration-200 flex items-start gap-3.5 group">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#eaf6ee] text-[#137b65] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <UserCheck size={20} />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#172b28]">{t('trustedDoctorsTitle')}</h3>
                <p className="text-[11px] sm:text-xs text-[#5c736b] mt-0.5 leading-relaxed">
                  NMC &amp; State Medical Council verified. Zero unverified credentials or sponsored rankings.
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Pillar 2: Cashless Treatment */}
          <ScrollReveal delayMs={100} className="h-full">
            <div className="h-full bg-white/95 backdrop-blur-md border border-[#d6e8de] rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-lg hover:border-[#0284c7] transition-all duration-200 flex items-start gap-3.5 group">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#eff8fb] text-[#0284c7] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#172b28]">{t('cashlessTreatmentTitle')}</h3>
                <p className="text-[11px] sm:text-xs text-[#5c736b] mt-0.5 leading-relaxed">
                  PM-JAY Ayushman Bharat &amp; CGHS empaneled clinics with transparent package coverage.
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Pillar 3: Faster Appointments */}
          <ScrollReveal delayMs={200} className="h-full">
            <div className="h-full bg-white/95 backdrop-blur-md border border-[#d6e8de] rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-lg hover:border-[#ea580c] transition-all duration-200 flex items-start gap-3.5 group">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#fef5ee] text-[#ea580c] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#172b28]">{t('fasterAppointmentsTitle')}</h3>
                <p className="text-[11px] sm:text-xs text-[#5c736b] mt-0.5 leading-relaxed">
                  Real-time slot lock with FairSlot™ delay hold. Zero physical queue wait at the clinic.
                </p>
              </div>
            </div>
          </ScrollReveal>

        </div>
      </section>

      {/* ── Flowing Curved Wave Shape Transition ── */}
      <div className="w-full overflow-hidden leading-none -mb-1 pointer-events-none">
        <svg
          className="relative block w-full h-8 sm:h-12 md:h-14 text-[#fff9eb]"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0 C150,90 350,-30 500,45 C650,120 900,10 1200,50 L1200,120 L0,120 Z"
            fill="currentColor"
          />
        </svg>
      </div>

      {/* ── 3. "LET'S GET YOU A DOC WHO GETS YOU" SECTION (Warm Editorial Banner - Scroll Reveal) ── */}
      <section className="bg-[#fff9eb] border-b border-[#f6e8c7] py-14 sm:py-16 -mt-1">
        <div className="max-w-6xl mx-auto px-4">
          
          {/* Header */}
          <ScrollReveal delayMs={0}>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#137b65] mb-2">
                <Sparkles size={14} /> {t('careTailored')}
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#172b28] tracking-tight">
                {t('getDocTitle')}
              </h2>
              <p className="text-sm text-[#5d6f69] mt-2">
                Finding the right healthcare provider shouldn&apos;t feel stressful or complicated.
              </p>
            </div>
          </ScrollReveal>

          {/* 3 Editorial Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            
            {/* Card 1: Browse providers who take your insurance */}
            <ScrollReveal delayMs={0} className="h-full">
              <div className="h-full bg-white border border-[#eddcb6] rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-xl hover:border-[#137b65] transition duration-300 flex flex-col justify-between group">
                <div>
                  <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#faf7ef] mb-6 flex items-center justify-center border border-[#f4ead5]">
                    <img
                      src="/illustrations/feature_insurance.jpg"
                      alt="Browse healthcare providers who take your scheme or insurance"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>

                  <h3 className="text-lg font-bold text-[#172b28] leading-snug mb-2">
                    Browse providers who take your insurance
                  </h3>
                  <p className="text-xs text-[#5f746d] leading-relaxed">
                    Easily find doctors and clinics that support Ayushman Bharat PM-JAY, CGHS, and state health benefits with 100% cashless transparency.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#f4eee0]">
                  <Link
                    href="/search?specialty=General+Physician"
                    className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl border border-[#d2dfd8] bg-white text-[#172b28] font-bold text-xs hover:bg-[#137b65] hover:text-white hover:border-[#137b65] transition shadow-2xs"
                  >
                    See specialties
                  </Link>
                </div>
              </div>
            </ScrollReveal>

            {/* Card 2: Read reviews from users */}
            <ScrollReveal delayMs={120} className="h-full">
              <div className="h-full bg-white border border-[#eddcb6] rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-xl hover:border-[#137b65] transition duration-300 flex flex-col justify-between group">
                <div>
                  <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#faf7ef] mb-6 flex items-center justify-center border border-[#f4ead5]">
                    <img
                      src="/illustrations/feature_reviews.jpg"
                      alt="Read genuine verified reviews and credentials"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>

                  <h3 className="text-lg font-bold text-[#172b28] leading-snug mb-2">
                    Read reviews from verified patients
                  </h3>
                  <p className="text-xs text-[#5f746d] leading-relaxed">
                    Doctor credentials and clinic details cross-verified against State Medical Council records. Zero fabricated reviews or inflated claims.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#f4eee0]">
                  <Link
                    href="/search"
                    className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl border border-[#d2dfd8] bg-white text-[#172b28] font-bold text-xs hover:bg-[#137b65] hover:text-white hover:border-[#137b65] transition shadow-2xs"
                  >
                    See providers
                  </Link>
                </div>
              </div>
            </ScrollReveal>

            {/* Card 3: Book an appointment today, online */}
            <ScrollReveal delayMs={240} className="h-full">
              <div className="h-full bg-white border border-[#eddcb6] rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-xl hover:border-[#137b65] transition duration-300 flex flex-col justify-between group">
                <div>
                  <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#faf7ef] mb-6 flex items-center justify-center border border-[#f4ead5]">
                    <img
                      src="/illustrations/feature_booking.jpg"
                      alt="Book an appointment online with real-time slot locks"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>

                  <h3 className="text-lg font-bold text-[#172b28] leading-snug mb-2">
                    Book an appointment today, online
                  </h3>
                  <p className="text-xs text-[#5f746d] leading-relaxed">
                    Skip the long morning OPD queue. Pick your date and time with real transaction locks, whether for an in-person clinic visit or video consult.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#f4eee0]">
                  <Link
                    href="/search"
                    className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl border border-[#d2dfd8] bg-white text-[#172b28] font-bold text-xs hover:bg-[#137b65] hover:text-white hover:border-[#137b65] transition shadow-2xs"
                  >
                    See availability
                  </Link>
                </div>
              </div>
            </ScrollReveal>

          </div>
        </div>
      </section>

      {/* ── 4. TRUST & STATS PROOF BAR (Scroll Reveal) ── */}
      <section className="max-w-6xl mx-auto px-4">
        <ScrollReveal delayMs={0}>
          <div className="bg-[#172b28] text-white rounded-3xl p-8 shadow-xl grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#7dd3b9]">80+</div>
              <div className="text-xs text-[#b0ccc2] mt-1 font-medium">Verified Healthcare Providers</div>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#7dd3b9]">18</div>
              <div className="text-xs text-[#b0ccc2] mt-1 font-medium">Medical Specialties Covered</div>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#7dd3b9]">22</div>
              <div className="text-xs text-[#b0ccc2] mt-1 font-medium">Indian Languages Supported</div>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#7dd3b9]">100%</div>
              <div className="text-xs text-[#b0ccc2] mt-1 font-medium">FairSlot™ Queue Protection</div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ── 5. SPECIALTY CATEGORIES (Scroll Reveal Staggered Grid) ── */}
      <section className="max-w-6xl mx-auto px-4" id="services">
        <ScrollReveal delayMs={0}>
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#137b65]">
                {t('exploreSpecialties')}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172b28]">Care tailored to your situation.</h2>
            </div>
            <Link href="/search" className="text-xs font-bold text-[#137b65] hover:underline flex items-center gap-1">
              {t('browseAll')} <ArrowRight size={13} />
            </Link>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {services.map((item, index) => {
            const IconComponent = item.Icon;
            return (
              <ScrollReveal
                key={item.id}
                delayMs={(index % 4) * 70}
                className="h-full"
              >
                <Link
                  href={item.id === 'video' ? '/search?mode=video' : `/search?service=${encodeURIComponent(item.id)}`}
                  className={`h-full bg-white border border-[#e4ece6] rounded-2xl p-3.5 sm:p-5 hover:shadow-md transition duration-200 flex flex-col justify-between group ${item.accentBorder}`}
                >
                  <div>
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${item.accentBg} flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-108 transition-transform duration-200 shadow-2xs`}>
                      <IconComponent />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#172b28] mb-1 leading-snug">{item.title}</h3>
                    <p className="text-[11px] sm:text-xs text-[#6a7d77] leading-relaxed line-clamp-2 sm:line-clamp-none">{item.detail}</p>
                  </div>
                  <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-[#f0f4f1] flex items-center justify-between text-[11px] sm:text-xs font-semibold text-[#137b65]">
                    <span>Explore</span>
                    <ArrowRight size={13} className="group-hover:translate-x-1 transition shrink-0" />
                  </div>
                </Link>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* ── 6. FEATURED VERIFIED PROVIDERS (Scroll Reveal) ── */}
      <section className="max-w-6xl mx-auto px-4" id="sample-facilities">
        <ScrollReveal delayMs={0}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase text-[#137b65]">
                <ShieldCheck size={13} /> Real Doctors &amp; Verified Clinics
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172b28]">Compare facilities and select your time.</h2>
              <p className="text-xs text-[#637770] mt-1">
                Real-time slot availability backed by transaction locks.
              </p>
            </div>
            <Link
              href="/search"
              className="text-xs font-bold text-[#137b65] hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              View full directory ({providers.length} doctors) <ArrowRight size={13} />
            </Link>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {providers.slice(0, 3).map((provider, idx) => (
            <ScrollReveal key={provider.id} delayMs={idx * 120} className="h-full">
              <FeaturedDoctorCard provider={provider} />
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── 7. CARE CONTINUITY LOOP WALKTHROUGH (Scroll Reveal) ── */}
      <section className="max-w-6xl mx-auto px-4" id="how-it-works">
        <ScrollReveal delayMs={0}>
          <CareContinuityWalkthrough />
        </ScrollReveal>
      </section>

      {/* ── 8. GOVERNMENT HEALTH SCHEMES (Scroll Reveal) ── */}
      <section className="max-w-6xl mx-auto px-4" id="schemes">
        <ScrollReveal delayMs={0}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase text-[#137b65]">
                <Languages size={13} /> Simple Language Health Navigation
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172b28]">Public healthcare schemes, demystified.</h2>
              <p className="text-xs text-[#637770] mt-1">
                Source-backed government information with one-click Hindi and English plain-language explanations.
              </p>
            </div>
            <Link
              href="/dashboard/health-schemes"
              className="text-xs font-bold text-[#137b65] hover:underline flex items-center gap-1"
            >
              All health schemes <ArrowRight size={13} />
            </Link>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {schemes.slice(0, 3).map((scheme, idx) => (
            <ScrollReveal key={scheme.id} delayMs={idx * 120} className="h-full">
              <SchemeCard scheme={scheme} />
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── 9. MOBILE APP DOWNLOAD CTA BANNER (Scroll Reveal) ── */}
      <ScrollReveal delayMs={0}>
        <AppDownloadBanner />
      </ScrollReveal>

      {/* ── 10. FREQUENTLY ASKED QUESTIONS (Scroll Reveal) ── */}
      <ScrollReveal delayMs={0}>
        <FaqSection />
      </ScrollReveal>

    </main>
  );
}
