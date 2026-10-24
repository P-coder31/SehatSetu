'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';

export default function ReportsAdminPage() {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<any[]>('/admin/audit')
      .then(setAuditLogs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172b28]">Administrative Audit Trail &amp; Reports</h1>
          <p className="text-xs text-[#5e726b] mt-0.5">
            Cryptographically logged records of registrations, status transitions, verifications, and security events.
          </p>
        </div>
        <Link
          href="/admin/dashboard"
          className="px-4 py-2 rounded-xl border border-[#cadbd1] text-[#2c413b] text-xs font-semibold hover:bg-[#f2f7f4] transition"
        >
          Admin Overview
        </Link>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-[#71847e]">Loading audit records...</div>
      ) : auditLogs.length === 0 ? (
        <div className="p-12 text-center text-xs text-[#71847e] bg-white border border-[#e2ece5] rounded-3xl">
          No audit events recorded yet.
        </div>
      ) : (
        <div className="bg-white border border-[#e2ece5] rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8faf8] border-b border-[#e5ebe6] text-[#6d8079]">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Target Entity</th>
                <th className="p-3.5">Actor / User</th>
                <th className="p-3.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf2ee]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#fbfdfc] transition">
                  <td className="p-3.5 whitespace-nowrap text-[#647770]">
                    {new Date(log.created_at).toLocaleString([], {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="p-3.5">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#f0f6f2] text-[#137b65]">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3.5 text-[#2c403a] font-semibold">
                    {log.target_entity} {log.target_id ? `(#${log.target_id})` : ''}
                  </td>
                  <td className="p-3.5 text-[#50635c]">{log.user_email || 'System'}</td>
                  <td className="p-3.5 text-[#556962] max-w-xs truncate">{log.details || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
