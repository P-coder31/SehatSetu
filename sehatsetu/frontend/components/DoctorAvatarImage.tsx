'use client';

import React, { useState } from 'react';
import { getDoctorAvatarUrl } from '@/lib/doctor-avatar';

interface DoctorAvatarImageProps {
  name: string;
  specialty?: string;
  size?: number;
  className?: string;
  showBadge?: boolean;
}

export default function DoctorAvatarImage({
  name,
  specialty,
  size = 64,
  className = '',
  showBadge = false,
}: DoctorAvatarImageProps) {
  const [imgError, setImgError] = useState(false);
  const avatarUrl = getDoctorAvatarUrl(name, specialty);

  // Compute initials fallback
  const initials = (name || 'Doctor')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-2xl overflow-hidden shrink-0 border-2 border-white shadow-sm bg-gradient-to-br from-[#ebf5ef] to-[#fcf7ee] ${className}`}
    >
      {!imgError ? (
        <img
          src={avatarUrl}
          alt={`Portrait of ${name}`}
          className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-300"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center font-bold text-emerald-800 bg-[#eaf6ee]">
          {initials}
        </div>
      )}

      {showBadge && (
        <span
          title="Verified Doctor Profile"
          className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white"
        />
      )}
    </div>
  );
}
