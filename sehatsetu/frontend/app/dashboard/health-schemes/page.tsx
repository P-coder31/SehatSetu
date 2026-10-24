'use client';

import React, { useEffect, useState } from 'react';
import { Languages, ShieldCheck } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import SchemeCard, { SchemeProps } from '@/components/SchemeCard';

export default function HealthSchemesPage() {
  const [schemes, setSchemes] = useState<SchemeProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<SchemeProps[]>('/schemes')
      .then(setSchemes)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#172b28] to-[#124237] text-white rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#82c8b7] text-xs font-bold uppercase tracking-wider mb-2">
          <Languages size={14} /> Plain Language Health Navigation
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mt-1">
          Government Health Schemes
        </h1>
        <p className="text-xs sm:text-sm text-[#b8d6cb] mt-1 max-w-2xl leading-relaxed">
          Clear, source-backed information on major Indian public health programs. Click &ldquo;Explain in English&rdquo; or &ldquo;सरल हिन्दी&rdquo; to read simplified guides with official application links.
        </p>
      </div>

      {/* Safety Notice */}
      <div className="p-4 bg-[#f8faf8] border border-[#dce8df] rounded-2xl text-xs text-[#52665f] flex items-start gap-3">
        <ShieldCheck size={18} className="text-[#137b65] shrink-0 mt-0.5" />
        <div>
          <strong className="text-[#172b28]">Verified Public Guidance Notice:</strong>
          <p className="mt-0.5 leading-relaxed">
            SehatSetu summarizes officially published scheme guidelines for public accessibility. We do not make final eligibility decisions or determine medical treatment. Always consult the linked official government portal or local Ayushman Mitra desk for application procedures.
          </p>
        </div>
      </div>

      {/* Schemes Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[#71847e]">Loading health schemes...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {schemes.map((scheme) => (
            <SchemeCard key={scheme.id} scheme={scheme} />
          ))}
        </div>
      )}
    </div>
  );
}
