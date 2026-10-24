'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, X, ArrowRight, CheckCircle2, AlertCircle,
  Lock, RefreshCw, KeyRound, Sparkles, Building2, QrCode
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface AadhaarVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (cardData: any) => void;
  patientName?: string;
}

export default function AadhaarVerificationModal({
  isOpen,
  onClose,
  onSuccess,
  patientName = 'Patient'
}: AadhaarVerificationModalProps) {
  const [step, setStep] = useState<'input' | 'otp' | 'success'>('input');
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [consentChecked, setConsentChecked] = useState(true);
  const [txnId, setTxnId] = useState('');
  const [maskedAadhaar, setMaskedAadhaar] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState('123456');
  const [otpInput, setOtpInput] = useState('');
  const [countdown, setCountdown] = useState(45);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifiedCard, setVerifiedCard] = useState<any>(null);

  // Format Aadhaar with spaces: "9999 8888 7777"
  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setAadhaarInput(formatted);
    if (error) setError(null);
  };

  // Timer countdown for OTP resend
  useEffect(() => {
    if (step === 'otp' && countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, countdown]);

  const handleGenerateOtp = async (overrideNumber?: string) => {
    const targetNum = (overrideNumber || aadhaarInput).replace(/\s/g, '');
    if (targetNum.length !== 12) {
      setError('Please enter a valid 12-digit Aadhaar number.');
      return;
    }
    if (!consentChecked) {
      setError('Please accept the UIDAI / ABDM authentication consent to proceed.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await apiRequest<{
        txn_id: string;
        masked_aadhaar: string;
        simulated_otp?: string;
        message: string;
      }>('/care-continuity/aadhaar/generate-otp', {
        method: 'POST',
        body: JSON.stringify({ aadhaar_number: targetNum })
      });

      setTxnId(res.txn_id);
      setMaskedAadhaar(res.masked_aadhaar);
      if (res.simulated_otp) {
        setSimulatedOtp(res.simulated_otp);
      }
      setCountdown(45);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to generate Aadhaar OTP. Please check number.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const cleanOtp = otpInput.trim();
    if (cleanOtp.length !== 6) {
      setError('Please enter the 6-digit OTP received on your mobile.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await apiRequest<{
        success: boolean;
        message: string;
        card: any;
      }>('/care-continuity/aadhaar/verify-and-link', {
        method: 'POST',
        body: JSON.stringify({
          txn_id: txnId,
          otp: cleanOtp
        })
      });

      setVerifiedCard(res.card);
      setStep('success');
      onSuccess(res.card);
    } catch (err: any) {
      setError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseSampleAadhaar = () => {
    const sample = '9999 8888 7777';
    setAadhaarInput(sample);
    handleGenerateOtp(sample);
  };

  const resetModal = () => {
    setStep('input');
    setAadhaarInput('');
    setOtpInput('');
    setError(null);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-[#cbe1d3] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Tricolor Header Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-b from-[#f3f9f5] to-white border-b border-[#e1ede5] flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#e6f4ec] text-[#137b65] flex items-center justify-center border border-[#bfe2ce] shrink-0">
              <ShieldCheck size={22} className="text-[#137b65]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-[#172b28] text-base">
                  {step === 'success' ? 'Identity Verified' : 'Aadhaar / ABHA Authentication'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  ABDM eKYC
                </span>
              </div>
              <p className="text-[11px] text-[#556c63] mt-0.5">
                Ayushman Bharat Digital Mission (UIDAI Sandbox)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={resetModal}
            className="p-1 rounded-xl text-[#82998f] hover:text-[#172b28] hover:bg-black/5 transition"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-2.5">
              <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ── STEP 1: AADHAAR NUMBER INPUT ── */}
          {step === 'input' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#172b28] mb-1.5">
                  12-Digit Aadhaar Number (आधार संख्या)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={aadhaarInput}
                    onChange={handleAadhaarChange}
                    placeholder="e.g. 9999 8888 7777"
                    maxLength={14}
                    className="w-full text-base tracking-widest font-mono font-bold px-4 py-3 rounded-2xl border border-[#cbe1d3] bg-[#f9fcfa] focus:bg-white focus:border-[#137b65] focus:ring-3 focus:ring-[#137b65]/15 outline-none transition text-[#172b28] placeholder:text-[#a0b5ab]"
                  />
                  <div className="absolute right-3.5 top-3.5 text-xs text-[#82998f] font-medium font-sans">
                    {aadhaarInput.replace(/\s/g, '').length}/12
                  </div>
                </div>
              </div>

              {/* Sample Test Pill */}
              <div className="flex items-center justify-between text-xs bg-[#f4f8f5] p-2.5 rounded-xl border border-[#dbece1]">
                <div className="flex items-center gap-1.5 text-[11px] text-[#486358]">
                  <Sparkles size={13} className="text-[#137b65]" />
                  <span>Sandbox Testing:</span>
                </div>
                <button
                  type="button"
                  onClick={handleUseSampleAadhaar}
                  className="px-2.5 py-1 rounded-lg bg-white border border-[#cbe0d3] text-[#137b65] text-[11px] font-bold hover:bg-[#137b65] hover:text-white transition shadow-2xs cursor-pointer"
                >
                  ⚡ Auto-fill Sample Aadhaar
                </button>
              </div>

              {/* Statutory UIDAI & ABDM Consent */}
              <div className="p-3.5 rounded-2xl bg-[#f8faf8] border border-[#e1ece4] space-y-2 text-[11px] text-[#556961]">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-0.5 rounded text-[#137b65] focus:ring-[#137b65]"
                  />
                  <span className="leading-relaxed">
                    I voluntarily provide my Aadhaar number to <strong>SehatSetu</strong> to authenticate with UIDAI/ABDM for generating my 14-digit <strong>ABHA Digital Health ID</strong> and accessing seamless cashless care under Ayushman Bharat.
                  </span>
                </label>
              </div>

              <button
                type="button"
                onClick={() => handleGenerateOtp()}
                disabled={loading || aadhaarInput.replace(/\s/g, '').length !== 12 || !consentChecked}
                className="w-full py-3.5 rounded-2xl bg-[#137b65] hover:bg-[#0c5949] text-white font-extrabold text-xs shadow-md transition disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Connecting UIDAI Gateway...</span>
                  </>
                ) : (
                  <>
                    <span>Get Aadhaar OTP</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          )}

          {/* ── STEP 2: 6-DIGIT OTP VERIFICATION ── */}
          {step === 'otp' && (
            <div className="space-y-4">
              <div className="text-center p-3 rounded-2xl bg-[#eef7f2] border border-[#cbe5d5] space-y-1">
                <span className="text-[11px] text-[#4f675d] block">
                  Aadhaar OTP sent to mobile registered with:
                </span>
                <span className="font-mono font-bold text-sm text-[#137b65]">
                  {maskedAadhaar || 'XXXX XXXX 7777'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172b28] mb-1.5 text-center">
                  Enter 6-Digit OTP (ओटीपी दर्ज करें)
                </label>
                <input
                  type="text"
                  value={otpInput}
                  onChange={(e) => {
                    setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6));
                    if (error) setError(null);
                  }}
                  placeholder="• • • • • •"
                  maxLength={6}
                  autoFocus
                  className="w-full text-center text-xl tracking-[0.4em] font-mono font-extrabold px-4 py-3 rounded-2xl border border-[#cbe1d3] bg-[#f9fcfa] focus:bg-white focus:border-[#137b65] focus:ring-3 focus:ring-[#137b65]/15 outline-none transition text-[#172b28]"
                />
              </div>

              {/* Sandbox Quick-Paste Hint */}
              <div className="flex items-center justify-between text-xs bg-[#f4f8f5] p-2.5 rounded-xl border border-[#dbece1]">
                <div className="flex items-center gap-1.5 text-[11px] text-[#486358]">
                  <KeyRound size={13} className="text-[#137b65]" />
                  <span>Sandbox Test OTP: <strong>{simulatedOtp}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => setOtpInput(simulatedOtp)}
                  className="px-2.5 py-0.8 rounded-lg bg-white border border-[#cbe0d3] text-[#137b65] text-[11px] font-bold hover:bg-[#137b65] hover:text-white transition cursor-pointer"
                >
                  Auto-fill {simulatedOtp}
                </button>
              </div>

              {/* Resend Timer */}
              <div className="flex items-center justify-between text-xs text-[#6e857c] px-1">
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="hover:text-[#137b65] hover:underline"
                >
                  Change Aadhaar
                </button>
                <div>
                  {countdown > 0 ? (
                    <span>Resend OTP in <strong>{countdown}s</strong></span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleGenerateOtp()}
                      className="text-[#137b65] font-bold hover:underline"
                    >
                      Resend OTP Now
                    </button>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={loading || otpInput.trim().length !== 6}
                className="w-full py-3.5 rounded-2xl bg-[#137b65] hover:bg-[#0c5949] text-white font-extrabold text-xs shadow-md transition disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Verifying with ABDM...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Verify & Link ABHA Card</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* ── STEP 3: SUCCESS CONFIRMATION ── */}
          {step === 'success' && verifiedCard && (
            <div className="text-center space-y-4 py-2 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border-2 border-emerald-300 shadow-md">
                <CheckCircle2 size={36} className="text-[#137b65]" />
              </div>

              <div>
                <h4 className="text-lg font-extrabold text-[#172b28]">
                  Aadhaar & ABHA Verified!
                </h4>
                <p className="text-xs text-[#556960] mt-1 max-w-xs mx-auto">
                  Your identity has been authenticated. Your digital health card is now linked to SehatSetu.
                </p>
              </div>

              {/* Mini Card Preview */}
              <div className="p-4 rounded-2xl bg-[#f4f9f6] border border-[#cbe4d4] text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#137b65] uppercase tracking-wider">
                    ABHA Digital ID
                  </span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                    Active & Verified
                  </span>
                </div>
                <div className="font-mono font-extrabold text-base text-[#172b28] tracking-wider">
                  {verifiedCard.abha_number}
                </div>
                <div className="flex items-center justify-between text-xs text-[#4f675d] pt-1 border-t border-[#dceee2]">
                  <span>Address: <strong>{verifiedCard.abha_address}</strong></span>
                  <span>Aadhaar: <strong>{verifiedCard.masked_aadhaar}</strong></span>
                </div>
              </div>

              <button
                type="button"
                onClick={resetModal}
                className="w-full py-3.5 rounded-2xl bg-[#137b65] hover:bg-[#0c5949] text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                View My Verified Health Card
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer Note */}
        <div className="bg-[#fbfcfa] border-t border-[#edf3ee] px-6 py-3 flex items-center justify-between text-[10px] text-[#788f85]">
          <span className="flex items-center gap-1">
            <Lock size={11} className="text-[#137b65]" /> 256-bit UIDAI Vault Encryption
          </span>
          <span>NHA · ABDM M1/M2/M3 Sandbox</span>
        </div>

      </div>
    </div>
  );
}
