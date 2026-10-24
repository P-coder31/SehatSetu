'use client';

import React, { useState } from 'react';
import { ShieldCheck, ExternalLink, Sparkles, Languages, CheckCircle2, FileText, Users, X } from 'lucide-react';
import { apiRequest } from '@/lib/api';

export interface SchemeProps {
  id: number;
  name: string;
  short_description: string;
  target_audience: string;
  benefits: string;
  required_documents: string;
  official_url: string;
  last_reviewed_date: string;
  verification_status: string;
}

export default function SchemeCard({ scheme }: { scheme: SchemeProps }) {
  const [showModal, setShowModal] = useState(false);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [explanation, setExplanation] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExplain = async (lang: 'en' | 'hi') => {
    setLanguage(lang);
    setLoading(true);
    setShowModal(true);
    try {
      const data = await apiRequest('/schemes/explain', {
        method: 'POST',
        body: JSON.stringify({
          scheme_id: scheme.id,
          language: lang,
        }),
      });
      setExplanation(data);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white border border-[#e2ece5] rounded-2xl p-6 shadow-xs hover:border-[#b4d6c0] transition flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#137b65] bg-[#eaf5ee] px-2 py-0.5 rounded-full mb-1">
                <ShieldCheck size={12} /> {scheme.verification_status}
              </span>
              <h3 className="text-base font-bold text-[#172b28]">{scheme.name}</h3>
            </div>
          </div>

          <p className="text-xs text-[#526660] leading-relaxed mb-4">
            {scheme.short_description}
          </p>

          {/* Details */}
          <div className="space-y-2.5 text-xs text-[#445851] bg-[#f9fbf9] p-3.5 rounded-xl border border-[#edf3ee] mb-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#7a8c85] tracking-wider flex items-center gap-1 mb-0.5">
                <Users size={11} /> Intended For
              </span>
              <p className="text-[11px] text-[#243732]">{scheme.target_audience}</p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-[#7a8c85] tracking-wider flex items-center gap-1 mb-0.5">
                <CheckCircle2 size={11} /> Coverage &amp; Benefits
              </span>
              <p className="text-[11px] text-[#243732]">{scheme.benefits}</p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-[#7a8c85] tracking-wider flex items-center gap-1 mb-0.5">
                <FileText size={11} /> Required Documents
              </span>
              <p className="text-[11px] text-[#243732]">{scheme.required_documents}</p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-3.5 border-t border-[#edf2ee] flex flex-col gap-2.5">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleExplain('en')}
              className="inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-[#eaf4ee] text-[#137b65] text-xs font-semibold hover:bg-[#d9ece0] transition shadow-2xs text-center"
            >
              <Sparkles size={13} className="shrink-0" /> Explain in English
            </button>
            <button
              type="button"
              onClick={() => handleExplain('hi')}
              className="inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-[#eaf4ee] text-[#137b65] text-xs font-semibold hover:bg-[#d9ece0] transition shadow-2xs text-center"
            >
              <Languages size={13} className="shrink-0" /> सरल हिन्दी
            </button>
          </div>

          <div className="flex items-center justify-between text-xs pt-0.5">
            <span className="text-[11px] text-[#7a8d86]">Official Government Source</span>
            <a
              href={scheme.official_url}
              target="_blank"
              rel="noreferrer"
              className="font-bold text-[#137b65] hover:underline inline-flex items-center gap-1 shrink-0"
            >
              Official Portal <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>

      {/* Simple Language Explanation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#dce7e0] overflow-hidden max-h-[90vh] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#eef2ef] mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#eaf4ee] text-[#137b65] flex items-center justify-center">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#172b28]">
                      {language === 'hi' ? 'सरल भाषा में समझें' : 'Simple Language Guide'}
                    </h3>
                    <p className="text-[11px] text-[#71847e]">{scheme.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 text-[#73857f] hover:bg-[#edf2ee] rounded-lg transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Language Switch */}
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => handleExplain('en')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                    language === 'en'
                      ? 'bg-[#137b65] text-white'
                      : 'bg-[#f0f5f2] text-[#556962] hover:bg-[#e4ede7]'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => handleExplain('hi')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                    language === 'hi'
                      ? 'bg-[#137b65] text-white'
                      : 'bg-[#f0f5f2] text-[#556962] hover:bg-[#e4ede7]'
                  }`}
                >
                  हिन्दी (Hindi)
                </button>
              </div>

              {loading ? (
                <div className="py-12 text-center text-xs text-[#71847e]">
                  <div className="w-6 h-6 border-2 border-[#137b65] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Generating plain-language explanation...
                </div>
              ) : explanation ? (
                <div className="space-y-4 overflow-y-auto max-h-[50vh] pr-1">
                  <div className="bg-[#f6faf7] p-3.5 rounded-xl border border-[#e2ede6]">
                    <h4 className="text-xs font-bold text-[#116955] uppercase tracking-wide mb-1">
                      {language === 'hi' ? 'योजना का सार' : 'Summary in Plain Words'}
                    </h4>
                    <p className="text-xs text-[#223530] leading-relaxed">
                      {explanation.summary_simple}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-[#172b28] mb-1">
                      {language === 'hi' ? 'किसे लाभ मिलेगा?' : 'Who Qualifies?'}
                    </h4>
                    <p className="text-xs text-[#52645f] leading-relaxed whitespace-pre-line">
                      {explanation.who_can_apply}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-[#172b28] mb-1">
                      {language === 'hi' ? 'मुख्य लाभ' : 'Key Assistance Provided'}
                    </h4>
                    <p className="text-xs text-[#52645f] leading-relaxed whitespace-pre-line">
                      {explanation.key_benefits}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-[#172b28] mb-1">
                      {language === 'hi' ? 'लाभ कैसे प्राप्त करें?' : 'How to Access Benefits'}
                    </h4>
                    <p className="text-xs text-[#52645f] leading-relaxed whitespace-pre-line">
                      {explanation.how_to_access}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="pt-4 border-t border-[#edf2ee] mt-4 flex items-center justify-between text-[11px] text-[#7a8d86]">
              <span className="line-clamp-1">{explanation?.source_disclaimer || 'Official government source summary.'}</span>
              <a
                href={scheme.official_url}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-[#137b65] hover:underline shrink-0 ml-2"
              >
                Official Site
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
