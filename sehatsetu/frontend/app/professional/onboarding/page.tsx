'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Stethoscope, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function ProfessionalOnboardingPage() {
  const router = useRouter();

  const [title, setTitle] = useState('Dr.');
  const [regNumber, setRegNumber] = useState('');
  const [qualification, setQualification] = useState('');
  const [bio, setBio] = useState('');
  const [consultationFee, setConsultationFee] = useState<number>(350);
  const [experienceYears, setExperienceYears] = useState<number>(5);

  const [facilities, setFacilities] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<number[]>([]);
  const [selectedSpecialtyIds, setSelectedSpecialtyIds] = useState<number[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiRequest<any[]>('/discovery/facilities'),
      apiRequest<any[]>('/discovery/specialties')
    ]).then(([facs, specs]) => {
      setFacilities(facs);
      setSpecialties(specs);
      if (facs.length > 0) setSelectedFacilityIds([facs[0].id]);
      if (specs.length > 0) setSelectedSpecialtyIds([specs[0].id]);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiRequest('/professional/onboarding', {
        method: 'POST',
        body: JSON.stringify({
          title,
          registration_number: regNumber.trim(),
          qualification: qualification.trim(),
          bio: bio.trim(),
          consultation_fee: consultationFee,
          experience_years: experienceYears,
          facility_ids: selectedFacilityIds,
          specialty_ids: selectedSpecialtyIds,
        }),
      });

      router.push('/professional/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error submitting onboarding credentials.');
    } finally {
      setLoading(false);
    }
  };

  const toggleFacility = (id: number) => {
    setSelectedFacilityIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSpecialty = (id: number) => {
    setSelectedSpecialtyIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white border border-[#dce8df] rounded-3xl p-6 sm:p-9 shadow-md">
        <div className="flex items-center gap-3 pb-4 border-b border-[#edf3ee] mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#eaf5ee] text-[#137b65] flex items-center justify-center">
            <Stethoscope size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#172b28]">Doctor Onboarding &amp; Verification</h1>
            <p className="text-xs text-[#5e726b] mt-0.5">Submit practice credentials for state register verification.</p>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-[#172b28] mb-1">Title</label>
              <select
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#d8e3dc] bg-white outline-none"
              >
                <option value="Dr.">Dr.</option>
                <option value="Prof. Dr.">Prof. Dr.</option>
                <option value="Vaidya">Vaidya</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-[#172b28] mb-1">State Council / MCI Registration No.</label>
              <input
                type="text"
                required
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value)}
                placeholder="e.g. HN-MCI-2026-0928"
                className="w-full p-2.5 rounded-xl border border-[#d8e3dc] bg-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#172b28] mb-1">Medical Degrees / Qualifications</label>
              <input
                type="text"
                required
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                placeholder="e.g. MBBS, MD (Medicine)"
                className="w-full p-2.5 rounded-xl border border-[#d8e3dc] bg-white outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-[#172b28] mb-1">Experience (Years)</label>
              <input
                type="number"
                min={1}
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-[#d8e3dc] bg-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#172b28] mb-1">Consultation Fee (₹)</label>
            <input
              type="number"
              min={0}
              value={consultationFee}
              onChange={(e) => setConsultationFee(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl border border-[#d8e3dc] bg-white outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-[#172b28] mb-1">Professional Bio &amp; Clinical Focus</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Summary of experience, clinical interests, and approach to patient care"
              className="w-full p-2.5 rounded-xl border border-[#d8e3dc] bg-white outline-none"
            />
          </div>

          {/* Specialties Checklist */}
          <div>
            <label className="block font-bold text-[#172b28] mb-1.5">Select Primary Specialties</label>
            <div className="flex flex-wrap gap-2">
              {specialties.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => toggleSpecialty(s.id)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                    selectedSpecialtyIds.includes(s.id)
                      ? 'bg-[#137b65] text-white border-[#137b65]'
                      : 'bg-[#fbfcfa] text-[#42554f] border-[#d4e2d8] hover:bg-[#eaf4ee]'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Facilities Checklist */}
          <div>
            <label className="block font-bold text-[#172b28] mb-1.5">Practice Facilities</label>
            <div className="space-y-2">
              {facilities.map((f) => (
                <div
                  key={f.id}
                  onClick={() => toggleFacility(f.id)}
                  className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition ${
                    selectedFacilityIds.includes(f.id)
                      ? 'bg-[#f4f9f6] border-[#137b65]'
                      : 'bg-white border-[#e9eee9] hover:border-[#ccd9d1]'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-[#172b28]">{f.name}</h4>
                    <p className="text-[11px] text-[#647972]">{f.address}, {f.city}</p>
                  </div>
                  {selectedFacilityIds.includes(f.id) && (
                    <CheckCircle2 size={16} className="text-[#137b65]" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#edf2ee] flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-[#137b65] text-white font-bold hover:bg-[#0e6351] transition"
            >
              {loading ? 'Submitting...' : 'Complete Onboarding & Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
