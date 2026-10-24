'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search, CalendarCheck, Clock, CheckCircle2,
  ArrowRight, Sparkles, RefreshCw, ClipboardList
} from 'lucide-react';

export default function CareContinuityWalkthrough() {
  const [activeStep, setActiveStep] = useState(0);
  const [simState, setSimState] = useState<'idle' | 'delay_reported' | 'clinic_approved' | 'passport_logged'>('idle');

  const steps = [
    {
      title: "01 · Find care",
      desc: "Search verified local clinics and doctors by specialty, distance, and known fee.",
      icon: Search,
      tag: "Verified listings"
    },
    {
      title: "02 · Book a slot",
      desc: "Instant slot locking backed by PostgreSQL constraints. FairSlot prevents hoarding.",
      icon: CalendarCheck,
      tag: "Atomic slot lock"
    },
    {
      title: "03 · Life changes",
      desc: "Running late or stuck in transit? Report a 15-minute delay without losing your spot.",
      icon: Clock,
      tag: "Delay reporting"
    },
    {
      title: "04 · Adjust together",
      desc: "Clinic confirms late arrival or proposes an open alternative slot. Patient accepts or reschedules.",
      icon: RefreshCw,
      tag: "No silent moves"
    },
    {
      title: "05 · Follow through",
      desc: "Care Passport logs every visit, delay, and reminder together in a unified patient timeline.",
      icon: ClipboardList,
      tag: "My Care Passport"
    }
  ];

  const handleSimulate = () => {
    setActiveStep(2);
    setSimState('delay_reported');
    setTimeout(() => {
      setActiveStep(3);
      setSimState('clinic_approved');
      setTimeout(() => {
        setActiveStep(4);
        setSimState('passport_logged');
      }, 1500);
    }, 1500);
  };

  const handleReset = () => {
    setActiveStep(0);
    setSimState('idle');
  };

  return (
    <div className="bg-[#fbfcfa] border border-[#e4ebe6] rounded-3xl p-6 md:p-9 shadow-sm">
      <div className="max-w-2xl mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eaf4ee] text-[#137b65] text-xs font-bold tracking-wide uppercase mb-3">
          <Sparkles size={13} /> The Care Continuity Difference
        </div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#172b28]">
          From “I need care” to “I know what comes next.”
        </h2>
        <p className="text-sm text-[#5f736c] mt-2 leading-relaxed">
          Plans break, appointments run behind, and follow-ups get lost. SehatSetu keeps patient and clinic synchronized before, during, and after the visit.
        </p>
      </div>

      {/* 5-Step Process Bar */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-8">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          const isCurrent = activeStep === idx;
          const isPassed = activeStep > idx;

          return (
            <div
              key={s.title}
              onClick={() => setActiveStep(idx)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                isCurrent
                  ? 'bg-white border-[#137b65] shadow-md ring-2 ring-[#137b65]/10'
                  : isPassed
                  ? 'bg-[#f4f9f6] border-[#d2e4d9]'
                  : 'bg-white border-[#e9eee9] hover:border-[#ccd9d1]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isCurrent
                        ? 'bg-[#137b65] text-white'
                        : isPassed
                        ? 'bg-[#e0f1e6] text-[#137b65]'
                        : 'bg-[#f2f6f4] text-[#71857e]'
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  {isPassed ? (
                    <CheckCircle2 size={16} className="text-[#137b65]" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-[#137b65] animate-ping" />
                  ) : null}
                </div>
                <h4 className="text-xs font-bold text-[#172b28]">{s.title}</h4>
                <p className="text-[11px] text-[#6b7e77] mt-1 line-clamp-3 leading-relaxed">
                  {s.desc}
                </p>
              </div>
              <span className="inline-block mt-3 text-[10px] font-semibold text-[#137b65] bg-[#edf6f1] px-2 py-0.5 rounded w-fit">
                {s.tag}
              </span>
            </div>
          );
        })}
      </div>

      {/* Interactive Interactive Sandbox Card */}
      <div className="bg-white border border-[#e2ece5] rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#edf3ee]">
          <div>
            <h3 className="text-sm font-bold text-[#172b28] flex items-center gap-2">
              <span>Interactive Care Loop Simulation</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#f2f7f4] text-[#556963] border border-[#e1ece4]">
                Step {activeStep + 1} of 5
              </span>
            </h3>
            <p className="text-xs text-[#677b74] mt-0.5">
              Experience how SehatSetu handles unexpected transit delays without cancelling your care.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {simState === 'idle' ? (
              <button
                onClick={handleSimulate}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#137b65] text-white text-xs font-bold shadow-xs hover:bg-[#0e6351] transition"
              >
                Simulate: &quot;I will be 15 min late&quot; <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#cadbd1] text-[#42554f] text-xs font-medium hover:bg-[#f2f6f3] transition"
              >
                <RefreshCw size={12} /> Reset Simulation
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Simulation Output */}
        <div className="pt-4">
          {simState === 'idle' && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#f9fbf9] border border-[#edf3ee]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#eaf4ee] text-[#137b65] flex items-center justify-center font-bold text-sm">
                  SC
                </div>
                <div>
                  <div className="text-xs font-bold text-[#172b28]">Sonipat Civil Hospital OPD · 10:30 AM</div>
                  <div className="text-[11px] text-[#5f746d]">Patient: Asha Patel · Dr. Rajesh Kumar</div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#e8f5ec] text-[#137b65]">
                Confirmed
              </span>
            </div>
          )}

          {simState === 'delay_reported' && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 animate-in fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Clock size={14} className="text-amber-700" />
                    Delay Reported: Arriving 15 min late
                  </div>
                  <p className="text-xs text-amber-800 mt-1">
                    Patient Asha notified clinic: &ldquo;Bus running behind schedule.&rdquo; Slot held pending clinic review.
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                  Waiting for clinic
                </span>
              </div>
            </div>
          )}

          {simState === 'clinic_approved' && (
            <div className="p-4 rounded-xl bg-[#edf7f1] border border-[#b8dfc7] animate-in fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-bold text-[#0f614f] flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-[#137b65]" />
                    Clinic Confirmed: Late Arrival OK
                  </div>
                  <p className="text-xs text-[#33594e] mt-1">
                    Dr. Rajesh Kumar acknowledged delay. Slot held until 10:45 AM. No penalty, no cancellation.
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-[#137b65] text-white">
                  Late Arrival Confirmed
                </span>
              </div>
            </div>
          )}

          {simState === 'passport_logged' && (
            <div className="p-4 rounded-xl bg-[#f7faf8] border border-[#d6e5dc] animate-in fade-in">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#172b28] flex items-center gap-1.5">
                  <ClipboardList size={14} className="text-[#137b65]" />
                  Care Passport Timeline Updated
                </span>
                <Link
                  href="/dashboard/care-passport"
                  className="text-xs font-bold text-[#137b65] hover:underline flex items-center gap-1"
                >
                  View My Care Passport <ArrowRight size={12} />
                </Link>
              </div>
              <div className="text-xs text-[#526660] space-y-1.5 border-l-2 border-[#137b65] pl-3 py-1">
                <div><strong>10:15 AM:</strong> Patient reported 15 min arrival delay.</div>
                <div><strong>10:16 AM:</strong> Clinic approved late arrival. Appointment rescheduled to 10:45 AM.</div>
                <div><strong>Follow-up:</strong> Care continuity preserved without slot loss.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
