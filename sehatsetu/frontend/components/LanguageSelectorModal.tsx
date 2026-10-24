'use client';

import React, { useState } from 'react';
import { Languages, Search, X, Check, Globe } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';

export default function LanguageSelectorModal() {
  const {
    currentLanguage,
    setLanguage,
    languages,
    isLanguageModalOpen,
    closeLanguageModal,
    t,
  } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');

  if (!isLanguageModalOpen) return null;

  const filteredLanguages = languages.filter((lang) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      lang.name.toLowerCase().includes(q) ||
      lang.nativeName.toLowerCase().includes(q) ||
      lang.region.toLowerCase().includes(q)
    );
  });

  const handleSelect = (code: string) => {
    setLanguage(code);
    closeLanguageModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200" translate="no">
      <div className="notranslate bg-white rounded-3xl border border-[#dce8df] max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#edf4f0]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#eaf6ee] text-[#137b65] flex items-center justify-center shrink-0">
              <Globe size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-[#172b28]">
                {t('chooseLanguage', 'Choose Language')}
              </h2>
              <p className="text-[11px] text-[#61766e]">
                All 22 officially recognized 8th Schedule Indian languages supported
              </p>
            </div>
          </div>

          <button
            onClick={closeLanguageModal}
            className="p-2 rounded-xl text-[#677c73] hover:bg-[#f2f7f4] transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Input */}
        <div className="my-4 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#137b65]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search language / भाषा खोजें / ভাষা খুঁজুন..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#d2dfd8] text-xs font-medium text-[#172b28] focus:border-[#137b65] focus:ring-2 focus:ring-[#137b65]/15 outline-none bg-[#fbfdfc]"
            autoFocus
          />
        </div>

        {/* Language Grid */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-1 max-h-[460px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-2.5">
            {filteredLanguages.map((lang) => {
              const isSelected = currentLanguage === lang.code;

              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelect(lang.code)}
                  className={`p-3 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-[#137b65] bg-[#eef7f3] ring-2 ring-[#137b65]/20 shadow-xs'
                      : 'border-[#e0ebe4] bg-white hover:border-[#137b65] hover:bg-[#fafdfb]'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-extrabold text-sm text-[#172b28] truncate">
                      {lang.nativeName}
                    </div>
                    <div className="text-[11px] font-semibold text-[#137b65]">
                      {lang.name}
                    </div>
                    <div className="text-[10px] text-[#71857e] truncate mt-0.5">
                      {lang.region}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-[#137b65] text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Check size={13} strokeWidth={2.8} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {filteredLanguages.length === 0 && (
            <div className="py-12 text-center text-xs text-[#6e827b]">
              No language found matching &ldquo;{searchQuery}&rdquo;.
            </div>
          )}
        </div>

        {/* Footer info pill */}
        <div className="pt-3.5 mt-3 border-t border-[#edf4f0] flex items-center justify-between text-[11px] text-[#556961] flex-wrap gap-2">
          <span className="flex items-center gap-1.5">
            <Languages size={14} className="text-[#137b65]" />
            Constitutional 8th Schedule Recognition
          </span>
          <button
            onClick={() => handleSelect('en')}
            className="text-[11px] font-bold text-[#137b65] hover:underline"
          >
            Reset to English
          </button>
        </div>

      </div>
    </div>
  );
}
