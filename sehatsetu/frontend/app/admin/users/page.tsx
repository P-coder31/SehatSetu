'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function UsersAdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.set('role', roleFilter);
      if (searchTerm) params.set('q', searchTerm);
      const data = await apiRequest<any[]>(`/admin/users?${params.toString()}`);
      setUsers(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [roleFilter, searchTerm]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    try {
      await apiRequest(`/admin/users/${id}/status?is_active=${!currentActive}`, {
        method: 'PATCH',
      });
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Error updating user status.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172b28]">User &amp; Practitioner Directory</h1>
          <p className="text-xs text-[#5e726b] mt-0.5">
            Audit user accounts, assign roles, or manage active access state.
          </p>
        </div>
        <Link
          href="/admin/dashboard"
          className="px-4 py-2 rounded-xl border border-[#cadbd1] text-[#2c413b] text-xs font-semibold hover:bg-[#f2f7f4] transition"
        >
          Admin Overview
        </Link>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#dce8df]">
        <div className="w-full sm:w-80 flex items-center gap-2 px-3 py-2 rounded-xl border border-[#dce6df] bg-[#fbfcfa]">
          <Search size={16} className="text-[#647c73]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            placeholder="Search by name or email..."
            className="w-full text-xs bg-transparent outline-none"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {['', 'patient', 'professional', 'admin'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                roleFilter === r
                  ? 'bg-[#137b65] text-white'
                  : 'bg-[#f4f7f5] text-[#556962] hover:bg-[#e4ece7]'
              }`}
            >
              {r ? r : 'All Users'}
            </button>
          ))}
        </div>
      </div>

      {/* User Table */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[#71847e]">Loading users...</div>
      ) : (
        <div className="bg-white border border-[#e2ece5] rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8faf8] border-b border-[#e5ebe6] text-[#6d8079]">
              <tr>
                <th className="p-3.5">User</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Phone</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Joined</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf2ee]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#fbfdfc] transition">
                  <td className="p-3.5">
                    <div className="font-bold text-[#172b28]">{u.full_name}</div>
                    <div className="text-[11px] text-[#6b7f78]">{u.email}</div>
                  </td>
                  <td className="p-3.5">
                    <span className="font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-[#f0f6f2] text-[#137b65]">
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3.5 text-[#556962]">{u.phone || '—'}</td>
                  <td className="p-3.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      u.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {u.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="p-3.5 text-[#6b7f78]">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleToggleActive(u.id, u.is_active)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                        u.is_active
                          ? 'bg-red-50 text-red-700 hover:bg-red-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {u.is_active ? 'Suspend' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
