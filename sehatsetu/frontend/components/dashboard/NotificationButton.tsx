'use client';

import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import NotificationModal from '@/components/NotificationModal';

export default function NotificationButton() {
  const { unreadNotifsCount } = useAuth();
  const [showDrawer, setShowDrawer] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowDrawer(true)}
        className="relative p-2 rounded-xl text-[#52665f] hover:bg-[#edf5f0] hover:text-[#137b65] transition"
        aria-label="View notifications"
        title="Notifications"
      >
        <Bell size={18} />
        {unreadNotifsCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-white font-bold text-[9px] flex items-center justify-center animate-pulse">
            {unreadNotifsCount > 9 ? '9+' : unreadNotifsCount}
          </span>
        )}
      </button>

      {showDrawer && <NotificationModal onClose={() => setShowDrawer(false)} />}
    </>
  );
}
