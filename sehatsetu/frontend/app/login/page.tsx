'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  HeartPulse, ArrowRight, AlertCircle, Sparkles,
  KeyRound, ShieldCheck, CheckCircle2, Lock, RefreshCw
} from 'lucide-react';
import { useAuth, DEMO_CREDENTIALS } from '@/lib/auth-context';
import { getAadhaarAuthStatus, AadhaarAuthStatus } from '@/lib/aadhaar-auth';
import { getRoleDashboardPath } from '@/lib/routes';
import { apiRequest } from '@/lib/api';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithAadhaarToken, quickDemoLogin } = useAuth();

  const redirectParam = searchParams.get('redirect');
  const roleParam = searchParams.get('role');

  const [authMethod, setAuthMethod] = useState<'password' | 'aadhaar'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Aadhaar flow state
  const [aadhaarStatus, setAadhaarStatus] = useState<AadhaarAuthStatus | null>(null);
  const [aadhaarStep, setAadhaarStep] = useState<'number' | 'otp'>('number');
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [aadhaarTxnId, setAadhaarTxnId] = useState('');
  const [maskedAadhaar, setMaskedAadhaar] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState('123456');
  const [otpInput, setOtpInput] = useState('');
  const [aadhaarLoading, setAadhaarLoading] = useState(false);

  useEffect(() => {
    getAadhaarAuthStatus().then(setAadhaarStatus);
  }, []);

  // Pre-fill email hint if role passed
  useEffect(() => {
    if (roleParam === 'admin' && !email) {
      setEmail(DEMO_CREDENTIALS.admin.email);
    } else if (roleParam === 'professional' && !email) {
      setEmail(DEMO_CREDENTIALS.professional.email);
    } else if (roleParam === 'patient' && !email) {
      setEmail(DEMO_CREDENTIALS.patient.email);
    }
  }, [roleParam, email]);

  const handlePostLoginRedirect = (userRole: string) => {
    if (redirectParam && redirectParam.startsWith('/')) {
      router.push(redirectParam);
    } else {
      router.push(getRoleDashboardPath(userRole));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const loggedUser = await login(email.trim().toLowerCase(), password);
      handlePostLoginRedirect(loggedUser.role);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (role: 'patient' | 'professional' | 'admin') => {
    setError(null);
    setLoading(true);
    try {
      const loggedUser = await quickDemoLogin(role);
      handlePostLoginRedirect(loggedUser.role);
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  // Aadhaar OTP Handlers
  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setAadhaarInput(formatted);
    if (error) setError(null);
  };

  const handleAadhaarSendOtp = async (overrideNumber?: string) => {
    const targetNum = (overrideNumber || aadhaarInput).replace(/\s/g, '');
    if (targetNum.length !== 12) {
      setError('Please enter a valid 12-digit Aadhaar number.');
      return;
    }

    setError(null);
    setAadhaarLoading(true);
    try {
      const res = await apiRequest<{
        txn_id: string;
        masked_aadhaar: string;
        simulated_otp?: string;
        message: string;
      }>('/auth/aadhaar/generate-otp', {
        method: 'POST',
        body: JSON.stringify({ aadhaar_number: targetNum })
      });

      setAadhaarTxnId(res.txn_id);
      setMaskedAadhaar(res.masked_aadhaar);
      if (res.simulated_otp) {
        setSimulatedOtp(res.simulated_otp);
      }
      setAadhaarStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch Aadhaar OTP.');
    } finally {
      setAadhaarLoading(false);
    }
  };

  const handleAadhaarVerifyLogin = async () => {
    const cleanOtp = otpInput.trim();
    if (cleanOtp.length !== 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }

    setError(null);
    setAadhaarLoading(true);
    try {
      const tokenRes = await apiRequest<any>('/auth/aadhaar-login', {
        method: 'POST',
        body: JSON.stringify({
          txn_id: aadhaarTxnId,
          otp: cleanOtp
        })
      });

      const loggedUser = loginWithAadhaarToken(tokenRes);
      handlePostLoginRedirect(loggedUser.role);
    } catch (err: any) {
      setError(err.message || 'Aadhaar OTP verification failed.');
    } finally {
      setAadhaarLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white border border-[#dce8df] rounded-3xl p-7 sm:p-9 shadow-md">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#137b65] text-white flex items-center justify-center mx-auto mb-3 shadow-xs">
            <HeartPulse size={24} />
          </div>
          <h1 className="text-2xl font-bold text-[#172b28]">Sign In to SehatSetu</h1>
          <p className="text-xs text-[#627670] mt-1">
            Access your patient portal, doctor dashboard, or administrative control center
          </p>
        </div>

        {error && (
          <div className="p-3 mb-5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Method Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#f4f8f5] border border-[#dce9e1] rounded-2xl mb-6 text-xs">
          <button
            type="button"
            onClick={() => {
              setAuthMethod('password');
              setError(null);
            }}
            className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
              authMethod === 'password'
                ? 'bg-white text-[#137b65] shadow-xs'
                : 'text-[#586c65] hover:text-[#172b28]'
            }`}
          >
            <KeyRound size={14} /> Password Login
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod('aadhaar');
              setError(null);
            }}
            className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
              authMethod === 'aadhaar'
                ? 'bg-white text-[#137b65] shadow-xs'
                : 'text-[#586c65] hover:text-[#172b28]'
            }`}
          >
            <ShieldCheck size={14} /> Aadhaar / ABHA
          </button>
        </div>

        {/* DEMO MODE Fast Evaluation Strip */}
        <div className="bg-[#f7faf8] border border-[#e1eae3] rounded-2xl p-3.5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-[#137b65] uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={11} /> DEMO MODE — Fast Evaluation
            </span>
            <span className="text-[9px] font-bold text-[#6d827a] bg-[#eaf4ee] px-1.5 py-0.5 rounded">
              Verified Local Seed
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleDemo('patient')}
              className="px-2 py-1.5 text-center text-[11px] font-semibold rounded-lg bg-white border border-[#cadbd0] text-[#1c302a] hover:bg-[#eaf4ee] hover:text-[#137b65] transition"
            >
              Patient
            </button>
            <button
              type="button"
              onClick={() => handleDemo('professional')}
              className="px-2 py-1.5 text-center text-[11px] font-semibold rounded-lg bg-white border border-[#cadbd0] text-[#1c302a] hover:bg-[#eaf4ee] hover:text-[#137b65] transition"
            >
              Doctor
            </button>
            <button
              type="button"
              onClick={() => handleDemo('admin')}
              className="px-2 py-1.5 text-center text-[11px] font-semibold rounded-lg bg-white border border-[#cadbd0] text-[#1c302a] hover:bg-[#eaf4ee] hover:text-[#137b65] transition"
            >
              Admin
            </button>
          </div>
        </div>

        {authMethod === 'password' ? (
          /* Password Authentication Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#172b28] mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. asha@example.com or dr.rajesh@sehatsetu.demo"
                className="w-full text-xs p-3 rounded-xl border border-[#d8e3dc] bg-[#fbfcfa] focus:bg-white focus:border-[#137b65] outline-none transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#172b28]">Password</label>
                <span className="text-[10px] text-[#71847e]">Default: [Role]@SehatSetu2026</span>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs p-3 rounded-xl border border-[#d8e3dc] bg-[#fbfcfa] focus:bg-white focus:border-[#137b65] outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#137b65] text-white font-bold text-xs shadow-md hover:bg-[#0e6351] transition inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={14} />
            </button>
          </form>
        ) : (
          /* Dual-Mode Interactive Aadhaar / ABHA OTP Login */
          <div className="space-y-4 py-1">
            <div className="p-3.5 rounded-2xl bg-[#eef7f2] border border-[#c6e4d2] text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#137b65]">
                <ShieldCheck size={16} />
                <span>ABDM / UIDAI Dual-Mode Sandbox</span>
              </div>
              <p className="text-[11px] text-[#4f6b5f] leading-snug">
                Enter your 12-digit Aadhaar to receive an OTP and sign in immediately as a verified patient.
              </p>
            </div>

            {aadhaarStep === 'number' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#172b28] mb-1">
                    12-Digit Aadhaar Number
                  </label>
                  <input
                    type="text"
                    value={aadhaarInput}
                    onChange={handleAadhaarChange}
                    placeholder="9999 8888 7777"
                    maxLength={14}
                    className="w-full text-sm font-mono font-bold tracking-widest p-3 rounded-xl border border-[#d8e3dc] bg-[#fbfcfa] focus:bg-white focus:border-[#137b65] outline-none transition text-[#172b28]"
                  />
                </div>

                <div className="flex items-center justify-between text-xs bg-[#f7faf8] p-2 rounded-xl border border-[#dce8e0]">
                  <span className="text-[10px] text-[#637d72]">Testing:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAadhaarInput('9999 8888 7777');
                      handleAadhaarSendOtp('999988887777');
                    }}
                    className="text-[11px] font-bold text-[#137b65] hover:underline"
                  >
                    ⚡ Auto-fill Sample Aadhaar
                  </button>
                </div>

                <button
                  type="button"
                  disabled={aadhaarLoading || aadhaarInput.replace(/\s/g, '').length !== 12}
                  onClick={() => handleAadhaarSendOtp()}
                  className="w-full py-3 rounded-xl bg-[#137b65] text-white font-bold text-xs shadow-md hover:bg-[#0e6351] transition inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  {aadhaarLoading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Requesting OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Aadhaar OTP</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-2.5 rounded-xl bg-[#f4faf6] border border-[#d0e9db] text-xs text-center">
                  <span className="text-[10px] text-[#556e62] block">OTP sent to Aadhaar linked with:</span>
                  <span className="font-mono font-bold text-[#137b65]">{maskedAadhaar}</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172b28] mb-1 text-center">
                    Enter 6-Digit OTP
                  </label>
                  <input
                    type="text"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    autoFocus
                    className="w-full text-center text-lg font-mono font-extrabold tracking-widest p-2.5 rounded-xl border border-[#d8e3dc] bg-[#fbfcfa] focus:bg-white focus:border-[#137b65] outline-none transition text-[#172b28]"
                  />
                </div>

                <div className="flex items-center justify-between text-xs bg-[#f7faf8] p-2 rounded-xl border border-[#dce8e0]">
                  <span className="text-[10px] text-[#637d72]">Sandbox Test OTP: <strong>{simulatedOtp}</strong></span>
                  <button
                    type="button"
                    onClick={() => setOtpInput(simulatedOtp)}
                    className="text-[11px] font-bold text-[#137b65] hover:underline"
                  >
                    Auto-fill {simulatedOtp}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-[#6e857c] px-1">
                  <button
                    type="button"
                    onClick={() => setAadhaarStep('number')}
                    className="hover:text-[#137b65] hover:underline"
                  >
                    Change Aadhaar
                  </button>
                </div>

                <button
                  type="button"
                  disabled={aadhaarLoading || otpInput.trim().length !== 6}
                  onClick={handleAadhaarVerifyLogin}
                  className="w-full py-3 rounded-xl bg-[#137b65] text-white font-bold text-xs shadow-md hover:bg-[#0e6351] transition inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  {aadhaarLoading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Verifying &amp; Logging In...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      <span>Verify OTP &amp; Sign In</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 pt-5 border-t border-[#edf2ee] flex items-center justify-between text-xs text-[#6e827b]">
          <Link href="/onboarding" className="text-[#137b65] font-semibold hover:underline">
            ← Back to Onboarding
          </Link>
          <Link href="/register" className="font-bold text-[#137b65] hover:underline">
            Register new account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center text-xs text-gray-500">Loading sign in...</div>}>
      <LoginContent />
    </Suspense>
  );
}
