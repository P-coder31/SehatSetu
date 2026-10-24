import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { LanguageProvider } from "@/lib/language-context";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LanguageSelectorModal from "@/components/LanguageSelectorModal";
import SehatSaathiChatbot from "@/components/SehatSaathiChatbot";

export const metadata: Metadata = {
  title: "SehatSetu — Care, connected.",
  description: "Simplifying healthcare discovery, appointment booking, live delay management, and follow-through care continuity.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#137b65",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-white text-[#172b28] antialiased selection:bg-[#d6ede0] selection:text-[#0b5548]">
        <LanguageProvider>
          <AuthProvider>
            <Navbar />
            <div className="flex-1 pb-16 md:pb-0">{children}</div>
            <Footer />
            <LanguageSelectorModal />
            <SehatSaathiChatbot />
            
            {/* Hidden Translation Element & Bridge */}
            <div id="google_translate_element" aria-hidden="true" />
            <Script
              id="google-translate-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.googleTranslateElementInit = function() {
                    try {
                      new google.translate.TranslateElement({
                        pageLanguage: 'en',
                        autoDisplay: false
                      }, 'google_translate_element');
                    } catch (e) {
                      console.warn('Google Translate initialization:', e);
                    }
                  };
                `,
              }}
            />
            <Script
              src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
              strategy="afterInteractive"
            />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
