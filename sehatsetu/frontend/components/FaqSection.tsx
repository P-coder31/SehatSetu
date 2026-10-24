'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: "How does booking an appointment on SehatSetu work?",
    answer: "Search for a doctor by specialty, symptom, or clinic location. Choose an available date and time slot from the live calendar, enter your contact details, and your appointment is instantly confirmed with a verified booking token. You will receive an SMS and digital pass to show at the clinic desk."
  },
  {
    question: "Is booking an appointment on SehatSetu free?",
    answer: "Yes, searching for doctors, viewing transparent consultation fees, and booking your appointment slot through SehatSetu is 100% free for patients. You only pay the doctor's standard consultation fee directly at the clinic (or ₹0 if covered under Ayushman Bharat PM-JAY or government OPD)."
  },
  {
    question: "What happens if I'm running late? (FairSlot™ Delay Protection)",
    answer: "If you get stuck in traffic or transit delays, simply open your booking pass and tap 'Report Transit Delay'. Select your estimated delay (15, 30, or 45 mins). FairSlot™ holds your appointment slot and alerts the clinic desk so you don't lose your turn or get bumped to the end of the line."
  },
  {
    question: "Can I use my Ayushman Bharat (PM-JAY) card on SehatSetu?",
    answer: "Yes! SehatSetu highlights empaneled hospitals and public health centres that honor Ayushman Bharat (PM-JAY). You can also use our 'Plain Language Scheme Guide' to verify eligible hospitalization benefits, required documents, and nearest Ayushman Mitra help desks in 22 Indian languages."
  },
  {
    question: "Can I consult with doctors over video teleconsultation?",
    answer: "Yes. Many of our verified doctors offer both in-person visits and video consultations (including e-Sanjeevani national telemedicine integration). Look for the 'Video' badge on doctor profiles to consult from the comfort of your home."
  },
  {
    question: "How are healthcare providers verified on SehatSetu?",
    answer: "Every registered doctor is checked against State Medical Council and National Medical Commission (NMC) public registers. We verify medical degrees, clinic affiliations, and council registration numbers. Unlike other portals, we never publish fake patient reviews or fabricated 5-star ratings."
  }
];

export default function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0); // First open by default

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section className="max-w-4xl mx-auto px-4" id="faq">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eaf6ee] text-[#137b65] text-xs font-bold tracking-wide uppercase mb-2">
          <HelpCircle size={14} /> Got Questions?
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172b28] tracking-tight">
          Common questions about booking on SehatSetu
        </h2>
        <p className="text-xs sm:text-sm text-[#5a6e67] mt-1.5">
          Everything you need to know about finding doctors, booking slots, and health scheme coverage.
        </p>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOpen ? 'bg-white border-[#137b65] shadow-sm' : 'bg-white border-[#e3ebe5] hover:border-[#b8d6c3]'
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="w-full text-left p-5 flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-[#172b28] focus:outline-none"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  size={18}
                  className={`text-[#137b65] shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 pt-0 text-xs sm:text-sm text-[#50635d] leading-relaxed border-t border-[#f2f6f3] mt-1 pt-3">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
