'use client';

import React, { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  MapPin,
  Stethoscope,
  X,
  ChevronDown,
  Sparkles,
  RotateCcw,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import ProviderCard, { ProviderProps } from '@/components/ProviderCard';

function SkeletonCard() {
  return (
    <div className="w-full bg-white border border-[#e2ece5] rounded-3xl p-5 sm:p-6 animate-pulse">
      <div className="grid grid-cols-1 min-[1200px]:grid-cols-[minmax(0,1.6fr)_minmax(360px,1fr)] gap-6">
        <div className="space-y-3">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#edf2ee] shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[#edf2ee] rounded w-1/3" />
              <div className="h-5 bg-[#edf2ee] rounded w-2/3" />
              <div className="h-3 bg-[#edf2ee] rounded w-1/2" />
            </div>
          </div>
          <div className="h-14 bg-[#edf2ee] rounded-2xl w-full" />
          <div className="h-10 bg-[#edf2ee] rounded-xl w-full" />
        </div>
        <div className="min-[1200px]:border-l min-[1200px]:border-[#edf2ee] min-[1200px]:pl-6 pt-4 min-[1200px]:pt-0 border-t border-[#edf2ee] min-[1200px]:border-t-0 space-y-4">
          <div className="h-4 bg-[#edf2ee] rounded w-1/2" />
          <div className="flex gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-[54px] h-[64px] bg-[#edf2ee] rounded-2xl shrink-0" />
            ))}
          </div>
          <div className="h-14 bg-[#edf2ee] rounded-2xl w-full" />
          <div className="h-10 bg-[#edf2ee] rounded-2xl w-full" />
        </div>
      </div>
    </div>
  );
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initial values from URL searchParams
  const initialQ = searchParams.get('q') || searchParams.get('service') || '';
  const initialCity = searchParams.get('city') || searchParams.get('location') || '';
  const initialSpecialty = searchParams.get('specialty') || '';
  const initialMode = searchParams.get('mode') || '';
  const initialLang = searchParams.get('language') || '';
  const initialFacType = searchParams.get('facility_type') || '';
  const initialDate = searchParams.get('available_date') || '';
  const initialFee = searchParams.get('max_fee') ? Number(searchParams.get('max_fee')) : 2500;
  const initialSort = searchParams.get('sort_by') || 'relevance';

  // Input states (bound directly to form inputs)
  const [searchInput, setSearchInput] = useState(initialQ);
  const [locationInput, setLocationInput] = useState(initialCity);

  // Applied search filters (actually used in API query)
  const [appliedQuery, setAppliedQuery] = useState(initialQ);
  const [appliedLocation, setAppliedLocation] = useState(initialCity);
  const [selectedSpecialty, setSelectedSpecialty] = useState(initialSpecialty);
  const [consultationMode, setConsultationMode] = useState(initialMode);
  const [language, setLanguage] = useState(initialLang);
  const [facilityType, setFacilityType] = useState(initialFacType);
  const [availableDate, setAvailableDate] = useState(initialDate);
  const [maxFee, setMaxFee] = useState<number>(initialFee);
  const [sortBy, setSortBy] = useState(initialSort);

  // Data & Status State
  const [specialties, setSpecialties] = useState<{ id: number; name: string }[]>([]);
  const [providers, setProviders] = useState<ProviderProps[]>([]);
  const [totalMatching, setTotalMatching] = useState<number>(0);
  const [verifiedMatching, setVerifiedMatching] = useState<number>(0);
  const [demoMatching, setDemoMatching] = useState<number>(0);
  const [offset, setOffset] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const PAGE_SIZE = 15;
  const searchReqIdRef = useRef(0);

  // Sync URL changes (e.g. browser back/forward or external navigation)
  useEffect(() => {
    const q = searchParams.get('q') || searchParams.get('service') || '';
    const city = searchParams.get('city') || searchParams.get('location') || '';
    const spec = searchParams.get('specialty') || '';
    const mode = searchParams.get('mode') || '';
    const lang = searchParams.get('language') || '';
    const fac = searchParams.get('facility_type') || '';
    const d = searchParams.get('available_date') || '';
    const fee = searchParams.get('max_fee') ? Number(searchParams.get('max_fee')) : 2500;
    const sort = searchParams.get('sort_by') || 'relevance';

    setSearchInput(q);
    setAppliedQuery(q);
    setLocationInput(city);
    setAppliedLocation(city);
    setSelectedSpecialty(spec);
    setConsultationMode(mode);
    setLanguage(lang);
    setFacilityType(fac);
    setAvailableDate(d);
    setMaxFee(fee);
    setSortBy(sort);
  }, [searchParams]);

  // Debounce search input: when typing pauses for 350ms, apply query automatically
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedQuery(searchInput.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Debounce location input: when typing pauses for 350ms, apply location automatically
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedLocation(locationInput.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [locationInput]);

  // Fetch specialties dropdown once on mount
  useEffect(() => {
    apiRequest<{ id: number; name: string }[]>('/discovery/specialties')
      .then((data) => setSpecialties(data || []))
      .catch(() => {});
  }, []);

  // Fetch providers and count with race-condition prevention
  const executeSearch = useCallback(
    async (newOffset = 0, append = false) => {
      const currentReqId = ++searchReqIdRef.current;

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      const params = new URLSearchParams();
      if (appliedQuery) params.set('q', appliedQuery);
      if (appliedLocation) params.set('city', appliedLocation);
      if (selectedSpecialty) params.set('specialty', selectedSpecialty);
      if (consultationMode) params.set('mode', consultationMode);
      if (language) params.set('language', language);
      if (facilityType) params.set('facility_type', facilityType);
      if (availableDate) params.set('available_date', availableDate);
      if (maxFee < 2500) params.set('max_fee', maxFee.toString());
      if (sortBy) params.set('sort_by', sortBy);

      params.set('limit', PAGE_SIZE.toString());
      params.set('offset', newOffset.toString());

      try {
        const [listData, countData] = await Promise.all([
          apiRequest<ProviderProps[]>(`/discovery/providers?${params.toString()}`),
          !append
            ? apiRequest<{ total: number; verified_count: number; demo_count: number }>(
                `/discovery/providers/count?${params.toString()}`
              )
            : Promise.resolve(null),
        ]);

        // Discard responses from older/superseded queries
        if (currentReqId !== searchReqIdRef.current) return;

        const list = listData || [];
        if (append) {
          setProviders((prev) => [...prev, ...list]);
        } else {
          setProviders(list);
          if (countData && typeof countData.total === 'number') {
            setTotalMatching(countData.total);
            setVerifiedMatching(countData.verified_count || 0);
            setDemoMatching(countData.demo_count || 0);
          } else {
            setTotalMatching(list.length);
            setVerifiedMatching(list.filter((p) => !p.is_sample && p.verification_status === 'verified').length);
            setDemoMatching(list.filter((p) => p.is_sample).length);
          }
        }

        setOffset(newOffset);
        setError(null);
      } catch (err: any) {
        if (currentReqId !== searchReqIdRef.current) return;
        console.error('Failed to fetch healthcare providers', err);
        setError(err.message || 'Unable to connect to healthcare discovery service.');
        if (!append) {
          setProviders([]);
          setTotalMatching(0);
          setVerifiedMatching(0);
          setDemoMatching(0);
        }
      } finally {
        if (currentReqId === searchReqIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [appliedQuery, appliedLocation, selectedSpecialty, consultationMode, language, facilityType, availableDate, maxFee, sortBy]
  );

  // Trigger search whenever applied filters change
  useEffect(() => {
    setOffset(0);
    executeSearch(0, false);
  }, [executeSearch]);

  // Form submit handler (immediate submission)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedQuery(searchInput.trim());
    setAppliedLocation(locationInput.trim());
  };

  const displayedCount = providers.length;
  const effectiveTotal = totalMatching;
  const hasMore = displayedCount < effectiveTotal;

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextOffset = offset + PAGE_SIZE;
      executeSearch(nextOffset, true);
    }
  };

  // Reset all filters and restore full provider list
  const handleResetFilters = () => {
    setSearchInput('');
    setAppliedQuery('');
    setLocationInput('');
    setAppliedLocation('');
    setSelectedSpecialty('');
    setConsultationMode('');
    setLanguage('');
    setFacilityType('');
    setAvailableDate('');
    setMaxFee(2500);
    setSortBy('relevance');
    setOffset(0);
    setError(null);
    router.replace('/search');
  };

  const hasActiveFilters = Boolean(
    appliedQuery ||
    appliedLocation ||
    selectedSpecialty ||
    consultationMode ||
    language ||
    facilityType ||
    availableDate ||
    maxFee < 2500 ||
    sortBy !== 'relevance'
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#eaf4ee] text-[#137b65] text-xs font-semibold mb-2">
          <Sparkles size={13} />
          SehatSetu Healthcare Discovery
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172b28] tracking-tight">
          Find Doctors &amp; Healthcare Professionals
        </h1>
        <p className="text-xs sm:text-sm text-[#5f746d] mt-1 max-w-3xl">
          Search qualified medical professionals, check real appointment schedules, and book direct consultations in Sonipat and Delhi NCR.
        </p>
      </div>

      {/* Main Search Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="bg-white border border-[#dce8df] rounded-2xl p-3 sm:p-4 shadow-sm mb-6 grid grid-cols-1 sm:grid-cols-12 gap-3"
      >
        <div className="sm:col-span-5 flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-[#e4ede6] bg-[#fbfcfa] focus-within:bg-white focus-within:border-[#137b65] transition">
          <Search size={18} className="text-[#687d75] shrink-0" />
          <div className="w-full">
            <label className="block text-[9px] font-bold text-[#687d75] uppercase tracking-wider">
              Doctor, Specialty, or Symptoms
            </label>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="e.g. Dishika Rajput, Clock It, Dentist, fever"
              className="w-full text-xs text-[#172b28] bg-transparent outline-none placeholder:text-[#9bb0a8]"
            />
          </div>
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setAppliedQuery('');
              }}
              className="text-[#9bb0a8] hover:text-[#172b28] p-1"
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="sm:col-span-4 flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-[#e4ede6] bg-[#fbfcfa] focus-within:bg-white focus-within:border-[#137b65] transition">
          <MapPin size={18} className="text-[#687d75] shrink-0" />
          <div className="w-full">
            <label className="block text-[9px] font-bold text-[#687d75] uppercase tracking-wider">
              City or Locality
            </label>
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="e.g. Sonipat, Model Town, Civil Lines"
              className="w-full text-xs text-[#172b28] bg-transparent outline-none placeholder:text-[#9bb0a8]"
            />
          </div>
          {locationInput && (
            <button
              type="button"
              onClick={() => {
                setLocationInput('');
                setAppliedLocation('');
              }}
              className="text-[#9bb0a8] hover:text-[#172b28] p-1"
              title="Clear location"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="sm:col-span-3">
          <button
            type="submit"
            className="w-full h-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#137b65] text-white text-xs font-bold hover:bg-[#0d6452] transition shadow-xs cursor-pointer"
          >
            <Search size={14} /> Find Doctors
          </button>
        </div>
      </form>

      {/* Filter and Sort Toolbar */}
      <div className="bg-[#f8faf8] border border-[#e2ece5] rounded-2xl p-4 mb-6 text-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Filters Row (Horizontal scroll on phone without scrollbars) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar sm:flex-wrap pb-1">
            {/* Specialty */}
            <div className="relative">
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="appearance-none bg-white border border-[#d2e2d7] rounded-xl px-3 py-1.5 pr-7 text-xs text-[#172b28] font-medium outline-none hover:border-[#137b65] transition cursor-pointer"
              >
                <option value="">All Specialties</option>
                {specialties.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-2.5 text-[#6c8078] pointer-events-none" />
            </div>

            {/* Consultation Mode */}
            <div className="relative">
              <select
                value={consultationMode}
                onChange={(e) => setConsultationMode(e.target.value)}
                className="appearance-none bg-white border border-[#d2e2d7] rounded-xl px-3 py-1.5 pr-7 text-xs text-[#172b28] font-medium outline-none hover:border-[#137b65] transition cursor-pointer"
              >
                <option value="">All Consultation Modes</option>
                <option value="in_person">In-Person Visits</option>
                <option value="video">Video Consultations</option>
              </select>
              <ChevronDown size={13} className="absolute right-2 top-2.5 text-[#6c8078] pointer-events-none" />
            </div>

            {/* Language */}
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="appearance-none bg-white border border-[#d2e2d7] rounded-xl px-3 py-1.5 pr-7 text-xs text-[#172b28] font-medium outline-none hover:border-[#137b65] transition cursor-pointer"
              >
                <option value="">All Languages</option>
                <option value="Hindi">Hindi</option>
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="Korean">Korean</option>
                <option value="Punjabi">Punjabi</option>
                <option value="Bengali">Bengali</option>
                <option value="Tamil">Tamil</option>
                <option value="Marathi">Marathi</option>
              </select>
              <ChevronDown size={13} className="absolute right-2 top-2.5 text-[#6c8078] pointer-events-none" />
            </div>

            {/* Max Fee */}
            <div className="relative">
              <select
                value={maxFee}
                onChange={(e) => setMaxFee(Number(e.target.value))}
                className="appearance-none bg-white border border-[#d2e2d7] rounded-xl px-3 py-1.5 pr-7 text-xs text-[#172b28] font-medium outline-none hover:border-[#137b65] transition cursor-pointer"
              >
                <option value={2500}>Any Fee</option>
                <option value={300}>Up to ₹300</option>
                <option value={500}>Up to ₹500</option>
                <option value={800}>Up to ₹800</option>
                <option value={1200}>Up to ₹1,200</option>
              </select>
              <ChevronDown size={13} className="absolute right-2 top-2.5 text-[#6c8078] pointer-events-none" />
            </div>

            {/* Date Picker */}
            <div className="flex items-center gap-1 bg-white border border-[#d2e2d7] rounded-xl px-2.5 py-1">
              <span className="text-[10px] font-bold text-[#6a8077] uppercase">Date:</span>
              <input
                type="date"
                value={availableDate}
                onChange={(e) => setAvailableDate(e.target.value)}
                className="text-xs text-[#172b28] bg-transparent outline-none cursor-pointer"
              />
              {availableDate && (
                <button
                  type="button"
                  onClick={() => setAvailableDate('')}
                  className="text-[#899c94] hover:text-[#172b28] p-0.5"
                  title="Clear date"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#6a7f76]">Sort:</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-[#d2e2d7] rounded-xl px-3 py-1.5 pr-7 text-xs text-[#172b28] font-semibold outline-none hover:border-[#137b65] transition cursor-pointer"
              >
                <option value="relevance">Best Match</option>
                <option value="fee_low">Lowest Fee First</option>
                <option value="fee_high">Highest Fee First</option>
                <option value="experience">Most Experienced</option>
              </select>
              <ChevronDown size={13} className="absolute right-2 top-2.5 text-[#6c8078] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Active Filters Pill Row */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-[#e5efe7] flex items-center justify-between gap-2 flex-wrap">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-[#788e84] font-semibold">Active filters:</span>
              {appliedQuery && (
                <span className="text-[10px] bg-white border border-[#d6e3da] px-2 py-0.5 rounded-full text-[#2c423a] inline-flex items-center gap-1 shadow-2xs">
                  <span>&ldquo;{appliedQuery}&rdquo;</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput('');
                      setAppliedQuery('');
                    }}
                    className="hover:text-red-500 text-[#8ba097] cursor-pointer"
                    title="Remove search query"
                  >
                    <X size={10} />
                  </button>
                </span>
              )}
              {selectedSpecialty && (
                <span className="text-[10px] bg-white border border-[#d6e3da] px-2 py-0.5 rounded-full text-[#2c423a] inline-flex items-center gap-1 shadow-2xs">
                  <span>{selectedSpecialty}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedSpecialty('')}
                    className="hover:text-red-500 text-[#8ba097] cursor-pointer"
                    title="Remove specialty filter"
                  >
                    <X size={10} />
                  </button>
                </span>
              )}
              {appliedLocation && (
                <span className="text-[10px] bg-white border border-[#d6e3da] px-2 py-0.5 rounded-full text-[#2c423a] inline-flex items-center gap-1 shadow-2xs">
                  <span>Loc: {appliedLocation}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setLocationInput('');
                      setAppliedLocation('');
                    }}
                    className="hover:text-red-500 text-[#8ba097] cursor-pointer"
                    title="Remove location filter"
                  >
                    <X size={10} />
                  </button>
                </span>
              )}
              {consultationMode && (
                <span className="text-[10px] bg-white border border-[#d6e3da] px-2 py-0.5 rounded-full text-[#2c423a] inline-flex items-center gap-1 shadow-2xs">
                  <span>{consultationMode === 'video' ? 'Video Consult' : 'In-Person'}</span>
                  <button
                    type="button"
                    onClick={() => setConsultationMode('')}
                    className="hover:text-red-500 text-[#8ba097] cursor-pointer"
                    title="Remove consultation mode"
                  >
                    <X size={10} />
                  </button>
                </span>
              )}
              {language && (
                <span className="text-[10px] bg-white border border-[#d6e3da] px-2 py-0.5 rounded-full text-[#2c423a] inline-flex items-center gap-1 shadow-2xs">
                  <span>Lang: {language}</span>
                  <button
                    type="button"
                    onClick={() => setLanguage('')}
                    className="hover:text-red-500 text-[#8ba097] cursor-pointer"
                    title="Remove language filter"
                  >
                    <X size={10} />
                  </button>
                </span>
              )}
              {availableDate && (
                <span className="text-[10px] bg-white border border-[#d6e3da] px-2 py-0.5 rounded-full text-[#2c423a] inline-flex items-center gap-1 shadow-2xs">
                  <span>On {availableDate}</span>
                  <button
                    type="button"
                    onClick={() => setAvailableDate('')}
                    className="hover:text-red-500 text-[#8ba097] cursor-pointer"
                    title="Remove date filter"
                  >
                    <X size={10} />
                  </button>
                </span>
              )}
              {maxFee < 2500 && (
                <span className="text-[10px] bg-white border border-[#d6e3da] px-2 py-0.5 rounded-full text-[#2c423a] inline-flex items-center gap-1 shadow-2xs">
                  <span>&le; ₹{maxFee}</span>
                  <button
                    type="button"
                    onClick={() => setMaxFee(2500)}
                    className="hover:text-red-500 text-[#8ba097] cursor-pointer"
                    title="Remove fee limit"
                  >
                    <X size={10} />
                  </button>
                </span>
              )}
            </div>
            <button
              onClick={handleResetFilters}
              className="text-[11px] font-semibold text-[#137b65] hover:underline inline-flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <RotateCcw size={11} /> Reset All
            </button>
          </div>
        )}
      </div>

      {/* Error State Banner */}
      {error && !loading && (
        <div className="bg-[#fef3f2] border border-[#fecdca] rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 mb-6 text-xs text-[#b42318]">
          <AlertCircle size={18} className="shrink-0 text-[#d92d20] mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-sm text-[#b42318] mb-0.5">Search Request Failed</h4>
            <p className="text-xs text-[#7a271a] leading-relaxed">{error}</p>
          </div>
          <button
            onClick={() => executeSearch(0, false)}
            className="px-3.5 py-1.5 rounded-xl bg-[#d92d20] text-white text-xs font-bold hover:bg-[#b42318] transition shrink-0 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Results Header: Clearly distinguishing total, current page, and verified vs demo profiles */}
      {!loading && !error && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="text-xs sm:text-sm font-semibold text-[#172b28]">
            Showing <span className="font-bold text-[#137b65]">{displayedCount}</span> of{' '}
            <span className="font-bold text-[#172b28]">{effectiveTotal}</span> healthcare{' '}
            {effectiveTotal === 1 ? 'provider' : 'providers'}
            {effectiveTotal > 0 && (
              <span className="text-xs font-normal text-[#60756e] ml-2">
                ({verifiedMatching} verified, {demoMatching || effectiveTotal - verifiedMatching} demo{' '}
                {(demoMatching || effectiveTotal - verifiedMatching) === 1 ? 'profile' : 'profiles'})
              </span>
            )}
          </div>

          {hasMore && (
            <div className="text-xs text-[#71867e]">
              Page {Math.floor(offset / PAGE_SIZE) + 1} · {effectiveTotal - displayedCount} remaining
            </div>
          )}
        </div>
      )}

      {/* Results List: Full-Width Horizontal Cards */}
      {loading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : providers.length === 0 && !error ? (
        <div className="bg-white border border-[#e2ede5] rounded-3xl p-12 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-[#edf6f0] text-[#137b65] flex items-center justify-center mx-auto mb-3">
            <Stethoscope size={28} />
          </div>
          <h3 className="text-base font-bold text-[#172b28]">No matching healthcare providers found</h3>
          <p className="text-xs text-[#637770] mt-1.5 leading-relaxed">
            {appliedQuery
              ? `We couldn't find any healthcare providers matching "${appliedQuery}". Check the spelling, try searching by specialty or clinic name, or clear filters.`
              : `We couldn't find doctors matching your current filters. Try choosing a different specialty or clearing filters to see all available practitioners.`}
          </p>
          <div className="mt-5 flex items-center justify-center gap-2 flex-wrap">
            {appliedQuery && (
              <button
                onClick={() => {
                  setSearchInput('');
                  setAppliedQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-white border border-[#cfded4] text-[#172b28] text-xs font-bold hover:bg-[#f6faf7] transition shadow-xs cursor-pointer"
              >
                Clear Search Query
              </button>
            )}
            <button
              onClick={handleResetFilters}
              className="px-5 py-2 rounded-xl bg-[#137b65] text-white text-xs font-bold hover:bg-[#0d6452] transition shadow-xs cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {providers.map((p) => (
            <ProviderCard key={p.id} provider={p} />
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-6 pb-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-3 rounded-2xl bg-white border border-[#cfded4] text-[#172b28] text-xs font-bold hover:border-[#137b65] hover:bg-[#f6faf7] transition shadow-xs disabled:opacity-60 inline-flex items-center gap-2 cursor-pointer"
              >
                {loadingMore ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-[#137b65]" />
                    Loading more healthcare providers...
                  </>
                ) : (
                  `Load More Healthcare Providers (${effectiveTotal - displayedCount} remaining)`
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto px-4 py-12 text-center text-xs text-[#6e827a]">
          Loading healthcare provider discovery...
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
