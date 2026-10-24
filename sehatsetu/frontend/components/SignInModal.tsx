'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  HeartPulse, X, ArrowRight, AlertCircle, Sparkles,
  Lock, CheckCircle2, User, Stethoscope, ShieldAlert, Loader2
} from 'lucide-react';
import { useAuth, DEMO_CREDENTIALS } from '@/lib/auth-context';
import { getRoleDashboardPath } from '@/lib/routes';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const router = useRouter();
  const { login, quickDemoLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePostLoginRedirect = (userRole: string) => {
    onClose();
    router.push(getRoleDashboardPath(userRole));
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white border border-[#dce8df] rounded-3xl p-6 sm:p-8 shadow-2xl z-10 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#71857e] hover:bg-[#f0f5f2] hover:text-[#172b28] transition"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-11 h-11 rounded-2xl bg-[#137b65] text-white flex items-center justify-center mx-auto mb-3 shadow-xs">
            <HeartPulse size={22} strokeWidth={2.4} />
          </div>
          <h2 className="text-2xl font-extrabold text-[#172b28] tracking-tight">
            Sign In to SehatSetu
          </h2>
          <p className="text-xs text-[#5d726b] mt-1">
            Access your patient dashboard, clinic portal, or admin desk
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* 1-Click Fast Test Evaluation Strip */}
        <div className="bg-[#f5faf7] border border-[#dce9e1] rounded-2xl p-3.5 mb-5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-bold text-[#137b65] uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={12} /> Instant 1-Click Demo
            </span>
            <span className="text-[9px] font-semibold text-[#6d827a] bg-white px-2 py-0.5 rounded border border-[#dae6df]">
              No Password Needed
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemo('patient')}
              className="px-2 py-2 text-center text-xs font-bold rounded-xl bg-white border border-[#cadbd0] text-[#1c302a] hover:bg-[#137b65] hover:text-white hover:border-[#137b65] transition shadow-2xs flex flex-col items-center gap-1 disabled:opacity-50"
            >
              <User size={14} />
              <span className="text-[11px]">Patient</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemo('professional')}
              className="px-2 py-2 text-center text-xs font-bold rounded-xl bg-white border border-[#cadbd0] text-[#1c302a] hover:bg-[#137b65] hover:text-white hover:border-[#137b65] transition shadow-2xs flex flex-col items-center gap-1 disabled:opacity-50"
            >
              <Stethoscope size={14} />
              <span className="text-[11px]">Doctor</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemo('admin')}
              className="px-2 py-2 text-center text-xs font-bold rounded-xl bg-white border border-[#cadbd0] text-[#1c302a] hover:bg-[#137b65] hover:text-white hover:border-[#137b65] transition shadow-2xs flex flex-col items-center gap-1 disabled:opacity-50"
            >
              <ShieldAlert size={14} />
              <span className="text-[11px]">Admin</span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="w-full border-t border-[#e5ebe7]" />
          <span className="absolute bg-white px-3 text-[10px] uppercase font-bold text-[#839790] tracking-wider">
            or sign in with email
          </span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-[#172b28] mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. asha@example.com"
              className="w-full text-xs p-2.5 rounded-xl border border-[#d8e3dc] bg-[#fbfcfa] focus:bg-white focus:border-[#137b65] outline-none transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-[#172b28]">
                Password
              </label>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs p-2.5 rounded-xl border border-[#d8e3dc] bg-[#fbfcfa] focus:bg-white focus:border-[#137b65] outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#137b65] text-white font-bold text-xs shadow-md hover:bg-[#0e6351] transition inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Signing in...
              </>
            ) : (
              <>
                Sign In <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-[#edf2ee] flex items-center justify-between text-xs text-[#6e827b]">
          <Link
            href="/login"
            onClick={onClose}
            className="text-[#137b65] font-semibold hover:underline text-[11px]"
          >
            Full login page
          </Link>
          <Link
            href="/register"
            onClick={onClose}
            className="font-bold text-[#137b65] hover:underline text-[11px]"
          >
            Create account
          </Link>
        </div>

      </div>
    </div>
  );
}
