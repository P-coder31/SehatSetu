'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function AdminLandingPage() {
  const router = useRouter();
  const { quickDemoLogin } = useAuth();

  const handleAdminSignIn = async () => {
    await quickDemoLogin('admin');
    router.push('/admin/dashboard');
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 rounded-3xl bg-[#172b28] text-white flex items-center justify-center mx-auto mb-4">
        <ShieldCheck size={32} />
      </div>
      <h1 className="text-2xl font-bold text-[#172b28]">SehatSetu State Health Administration</h1>
      <p className="text-xs text-[#5e726b] mt-1.5 max-w-md mx-auto leading-relaxed mb-6">
        Protected administrative portal for credential verification, healthcare facility oversight, and audit monitoring.
      </p>

      <button
        onClick={handleAdminSignIn}
        className="px-6 py-3 rounded-xl bg-[#137b65] text-white text-xs font-bold hover:bg-[#0e6351] transition shadow-sm inline-flex items-center gap-2 cursor-pointer"
      >
        Sign In as Administrator (Demo CMO) <ArrowRight size={14} />
      </button>
    </div>
  );
}
