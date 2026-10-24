'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, Bell, Check, ExternalLink } from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function NotificationModal({ onClose }: { onClose: () => void }) {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      const data = await apiRequest<any[]>('/care-continuity/notifications');
      setNotifs(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const markAllRead = async () => {
    try {
      await apiRequest('/care-continuity/notifications/read-all', { method: 'POST' });
      setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {
      // ignore
    }
  };

  const markOneRead = async (id: number) => {
    try {
      await apiRequest(`/care-continuity/notifications/${id}/read`, { method: 'PATCH' });
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-black/20 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-[#e4ebe6] overflow-hidden mt-14 sm:mt-12">
        <div className="p-4 bg-[#f8faf8] border-b border-[#e9eee9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-[#137b65]" />
            <h3 className="text-sm font-bold text-[#172b28]">In-App Notifications</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllRead}
              className="text-[11px] font-semibold text-[#137b65] hover:underline"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-[#788a83] hover:bg-[#edf2ee] transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="max-h-[380px] overflow-y-auto divide-y divide-[#f0f3f0]">
          {loading ? (
            <div className="p-6 text-center text-xs text-[#788a83]">Loading updates...</div>
          ) : notifs.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-10 h-10 rounded-full bg-[#f0f6f2] text-[#52776a] flex items-center justify-center mx-auto mb-2">
                <Check size={18} />
              </div>
              <p className="text-xs font-medium text-[#50645e]">All caught up!</p>
              <p className="text-[11px] text-[#7d9089] mt-0.5">No new care alerts or reminders.</p>
            </div>
          ) : (
            notifs.map(n => (
              <div
                key={n.id}
                onClick={() => markOneRead(n.id)}
                className={`p-3.5 transition hover:bg-[#f9fbf9] cursor-pointer ${
                  !n.is_read ? 'bg-[#f4f9f5]/70 border-l-3 border-[#137b65]' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-semibold text-[#1a2d29]">{n.title}</h4>
                  <span className="text-[10px] text-[#84958f] whitespace-nowrap">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] text-[#556963] mt-1 leading-relaxed">{n.message}</p>
                {n.link && (
                  <Link
                    href={n.link}
                    onClick={onClose}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#137b65] mt-1.5 hover:underline"
                  >
                    View details <ExternalLink size={10} />
                  </Link>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
