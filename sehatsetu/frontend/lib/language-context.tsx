'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { INDIAN_LANGUAGES, LanguageOption, UI_TRANSLATIONS } from './languages';

interface LanguageContextType {
  currentLanguage: string;
  languageOption: LanguageOption;
  setLanguage: (code: string) => void;
  t: (key: string, fallback?: string) => string;
  languages: LanguageOption[];
  isLanguageModalOpen: boolean;
  openLanguageModal: () => void;
  closeLanguageModal: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguageState] = useState<string>('en');
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

  // Helper to thoroughly remove all Google Translate cookies across all host variations
  const clearGoogleTranslateCookies = () => {
    if (typeof document === 'undefined') return;
    const host = window.location.hostname;
    const domainParts = host ? host.split('.') : [];
    const domains = ['', host, `.${host}`];
    if (domainParts.length >= 2) {
      const rootDomain = domainParts.slice(-2).join('.');
      domains.push(rootDomain, `.${rootDomain}`);
    }

    const cookieNames = ['googtrans', 'googtrans_0', 'googtrans_1'];
    const paths = ['/', '', '/en'];

    cookieNames.forEach((name) => {
      domains.forEach((d) => {
        paths.forEach((p) => {
          const domainStr = d ? `; domain=${d}` : '';
          const pathStr = p ? `; path=${p}` : '';
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC${pathStr}${domainStr}`;
          document.cookie = `${name}=; Max-Age=0${pathStr}${domainStr}`;
        });
      });
    });

    try {
      sessionStorage.removeItem('googtrans');
      localStorage.removeItem('googtrans');
    } catch {}
  };

  // Initialize from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sehatsetu_language');
      if (saved && saved !== 'en' && INDIAN_LANGUAGES.some((l) => l.code === saved)) {
        setCurrentLanguageState(saved);
        applyLanguageToDocument(saved, false);
      } else {
        // If english or unset, ensure clean state
        clearGoogleTranslateCookies();
      }
    } catch {
      // ignore in SSR / storage restrictions
    }
  }, []);

  // Map internal language codes to Google Translate codes
  const getGoogleLanguageCode = (code: string) => {
    const map: Record<string, string> = {
      mni: 'mni-Mtei',
    };
    return map[code] || code;
  };

  const applyLanguageToDocument = (code: string, isUserAction: boolean = false) => {
    const selected = INDIAN_LANGUAGES.find((l) => l.code === code);
    if (!selected) return;

    if (typeof document !== 'undefined') {
      document.documentElement.lang = code;
      document.documentElement.dir = selected.dir || 'ltr';

      if (code === 'en') {
        clearGoogleTranslateCookies();
        if (isUserAction) {
          window.location.reload();
        }
        return;
      }

      const googleCode = getGoogleLanguageCode(code);
      const host = window.location.hostname;

      try {
        // Set cookie without domain restriction first (vital for localhost)
        document.cookie = `googtrans=/en/${googleCode}; path=/;`;
        if (host && host !== 'localhost' && host !== '127.0.0.1') {
          document.cookie = `googtrans=/en/${googleCode}; path=/; domain=${host};`;
          document.cookie = `googtrans=/en/${googleCode}; path=/; domain=.${host};`;
        }
      } catch {
        // ignore cookie write errors
      }

      // Trigger the Google Translate DOM translation combo box
      const triggerCombo = () => {
        const combo = document.querySelector<HTMLSelectElement>('.goog-te-combo');
        if (combo) {
          combo.value = googleCode;
          combo.dispatchEvent(new Event('change'));
          return true;
        }
        return false;
      };

      const triggered = triggerCombo();
      if (!triggered && isUserAction) {
        setTimeout(() => {
          const retry = triggerCombo();
          if (!retry) {
            window.location.reload();
          }
        }, 300);
      }
    }
  };

  const setLanguage = (code: string) => {
    const valid = INDIAN_LANGUAGES.some((l) => l.code === code);
    const target = valid ? code : 'en';

    setCurrentLanguageState(target);
    try {
      localStorage.setItem('sehatsetu_language', target);
    } catch {
      // ignore
    }

    if (target === 'en') {
      clearGoogleTranslateCookies();
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
      return;
    }

    applyLanguageToDocument(target, true);
  };

  const t = (key: string, fallback?: string): string => {
    const translations = UI_TRANSLATIONS[key];
    if (!translations) return fallback || key;
    return translations[currentLanguage] || translations['en'] || fallback || key;
  };

  const languageOption =
    INDIAN_LANGUAGES.find((l) => l.code === currentLanguage) || INDIAN_LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        languageOption,
        setLanguage,
        t,
        languages: INDIAN_LANGUAGES,
        isLanguageModalOpen,
        openLanguageModal: () => setIsLanguageModalOpen(true),
        closeLanguageModal: () => setIsLanguageModalOpen(false),
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
