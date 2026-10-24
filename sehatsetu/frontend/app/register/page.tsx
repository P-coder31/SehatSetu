'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { HeartPulse, ArrowRight, AlertCircle, Stethoscope, User } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();

  const roleParam = searchParams.get('role');

  const [role, setRole] = useState<'patient' | 'professional'>('patient');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  
  // Professional specific
  const [regNumber, setRegNumber] = useState('');
  const [qualification, setQualification] = useState('');
  const [consultationFee, setConsultationFee] = useState<number>(300);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (roleParam === 'professional') {
      setRole('professional');
    } else if (roleParam === 'patient') {
      setRole('patient');
    }
  }, [roleParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const newUser = await register({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        phone: phone.trim() || undefined,
        registration_number: role === 'professional' ? regNumber.trim() : undefined,
        qualification: role === 'professional' ? qualification.trim() : undefined,
        consultation_fee: role === 'professional' ? consultationFee : undefined,
      });

      if (newUser.role === 'professional') {
        router.push('/professional/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="bg-white border border-[#dce8df] rounded-3xl p-7 sm:p-9 shadow-md">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#137b65] text-white flex items-center justify-center mx-auto mb-3 shadow-xs">
            <HeartPulse size={24} />
          </div>
          <h1 className="text-2xl font-bold text-[#172b28]">Create Your Account</h1>
          <p className="text-xs text-[#627670] mt-1">Join SehatSetu to connect your healthcare journey</p>
        </div>

        {error && (
          <div className="p-3 mb-5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Role Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#f4f8f5] border border-[#e2ede6] rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => setRole('patient')}
            className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition ${
              role === 'patient'
                ? 'bg-white text-[#137b65] shadow-xs'
                : 'text-[#586c65] hover:text-[#172b28]'
            }`}
          >
            <User size={15} /> Patient Account
          </button>
          <button
            type="button"
            onClick={() => setRole('professional')}
            className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition ${
              role === 'professional'
                ? 'bg-white text-[#137b65] shadow-xs'
                : 'text-[#586c65] hover:text-[#172b28]'
            }`}
          >
            <Stethoscope size={15} /> Doctor / Clinic
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#172b28] mb-1">Full Legal Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={role === 'professional' ? 'Dr. First Last' : 'Asha Patel'}
              className="w-full text-xs p-3 rounded-xl border border-[#d8e3dc] bg-[#fbfcfa] focus:bg-white focus:border-[#137b65] outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172b28] mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full text-xs p-3 rounded-xl border border-[#d8e3dc] bg-[#fbfcfa] focus:bg-white focus:border-[#137b65] outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172b28] mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs p-3 rounded-xl border border-[#d8e3dc] bg-[#fbfcfa] focus:bg-white focus:border-[#137b65] outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172b28] mb-1">Phone Number (Optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full text-xs p-3 rounded-xl border border-[#d8e3dc] bg-[#fbfcfa] focus:bg-white focus:border-[#137b65] outline-none transition"
            />
          </div>

          {/* Professional Credentials Section */}
          {role === 'professional' && (
            <div className="p-4 bg-[#f8faf8] border border-[#e1eae3] rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-[#137b65] uppercase tracking-wider">
                Practitioner Credentials
              </h4>

              <div>
                <label className="block text-xs font-bold text-[#172b28] mb-1">
                  Medical Council / Dental Council Reg No.
                </label>
                <input
                  type="text"
                  required
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  placeholder="e.g. HN-MCI-2015-8841"
                  className="w-full text-xs p-2.5 rounded-xl border border-[#d8e3dc] bg-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#172b28] mb-1">Qualification</label>
                  <input
                    type="text"
                    required
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    placeholder="e.g. MBBS, MD"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#d8e3dc] bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#172b28] mb-1">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#d8e3dc] bg-white outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#137b65] text-white font-bold text-xs shadow-md hover:bg-[#0e6351] transition inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Registering...' : `Create ${role === 'professional' ? 'Doctor' : 'Patient'} Account`}{' '}
            <ArrowRight size={14} />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#edf2ee] flex items-center justify-between text-xs text-[#6e827b]">
          <Link href="/onboarding" className="text-[#137b65] font-semibold hover:underline">
            ← Back to Onboarding
          </Link>
          <Link href="/login" className="font-bold text-[#137b65] hover:underline">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center text-xs text-gray-500">Loading registration...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
