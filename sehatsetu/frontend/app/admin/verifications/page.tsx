'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function VerificationsPage() {
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Review modal
  const [activeProf, setActiveProf] = useState<any | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'verified' | 'rejected'>('verified');
  const [reviewNotes, setReviewNotes] = useState('');

  const fetchVerifications = useCallback(async () => {
    try {
      const data = await apiRequest<any[]>(`/admin/verifications${filter ? `?status_filter=${filter}` : ''}`);
      setProfessionals(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProf) return;
    setActionLoading(true);
    try {
      await apiRequest(`/admin/verifications/${activeProf.id}`, {
        method: 'POST',
        body: JSON.stringify({
          status: reviewStatus,
          verification_notes: reviewNotes.trim() || undefined,
        }),
      });
      setSuccessMsg(`Professional application marked as ${reviewStatus}. Audit log recorded.`);
      setActiveProf(null);
      setReviewNotes('');
      await fetchVerifications();
    } catch (err: any) {
      alert(err.message || 'Error processing verification.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172b28]">Professional Verification Queue</h1>
          <p className="text-xs text-[#627670] mt-0.5">
            Review submitted medical council registration IDs and credentials before granting verified status.
          </p>
        </div>
        <Link
          href="/admin/dashboard"
          className="px-4 py-2 rounded-xl border border-[#cadbd1] text-[#2c413b] text-xs font-semibold hover:bg-[#f2f7f4] transition"
        >
          Admin Overview
        </Link>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-[#edf7f1] border border-[#bce2cc] text-[#137b65] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-[#137b65]">✕</button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs">
        {['pending', 'verified', 'rejected'].map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`px-3 py-1.5 rounded-xl font-bold capitalize transition ${
              filter === st
                ? 'bg-[#137b65] text-white shadow-xs'
                : 'bg-white border border-[#dce6df] text-[#4d625b] hover:bg-[#f2f7f4]'
            }`}
          >
            {st} Applications
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-[#71847e]">Loading applications...</div>
      ) : professionals.length === 0 ? (
        <div className="bg-white border border-[#e2ece5] rounded-3xl p-12 text-center max-w-md mx-auto">
          <CheckCircle2 size={36} className="text-[#137b65] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#172b28]">Queue is empty</h3>
          <p className="text-xs text-[#637770] mt-1">No applications currently in {filter} status.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {professionals.map((prof) => (
            <div
              key={prof.id}
              className="bg-white border border-[#e2ece5] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[11px] font-bold text-[#137b65] bg-[#eaf5ee] px-2 py-0.5 rounded">
                    Reg: {prof.registration_number}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                      prof.verification_status === 'verified'
                        ? 'bg-[#e8f5ec] text-[#137b65]'
                        : prof.verification_status === 'rejected'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {prof.verification_status}
                  </span>
                  <span className="text-[11px] text-[#71847e]">
                    Submitted {new Date(prof.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#172b28]">{prof.doctor_name}</h3>
                <p className="text-xs text-[#52645e]">
                  {prof.qualification} · Experience: {prof.experience_years} Years · Fee: ₹{prof.consultation_fee}
                </p>
                {prof.bio && (
                  <p className="text-[11px] text-[#6d8079] italic line-clamp-2 max-w-xl">
                    &ldquo;{prof.bio}&rdquo;
                  </p>
                )}
                {prof.verification_notes && (
                  <p className="text-[11px] text-[#334641] bg-[#f8faf8] p-2 rounded-lg border border-[#e8eee9] mt-2">
                    Review Notes: {prof.verification_notes}
                  </p>
                )}
              </div>

              <div>
                <button
                  onClick={() => {
                    setActiveProf(prof);
                    setReviewStatus('verified');
                    setReviewNotes(prof.verification_notes || '');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#137b65] text-white text-xs font-bold hover:bg-[#0e6351] transition"
                >
                  Process Decision
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Decision Modal */}
      {activeProf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-[#dce7e0]">
            <div className="flex items-center justify-between pb-3 border-b border-[#eef2ef] mb-4">
              <h3 className="text-sm font-bold text-[#172b28]">
                Review Credentials: {activeProf.doctor_name}
              </h3>
              <button onClick={() => setActiveProf(null)} className="p-1 text-[#73857f] hover:bg-[#edf2ee] rounded-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
              <div className="bg-[#f9fbf9] p-3 rounded-xl border border-[#e5ebe6] space-y-1">
                <div><strong>Reg Number:</strong> {activeProf.registration_number}</div>
                <div><strong>Qualification:</strong> {activeProf.qualification}</div>
              </div>

              <div>
                <label className="block font-bold text-[#172b28] mb-1.5">Decision</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewStatus('verified')}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      reviewStatus === 'verified'
                        ? 'bg-[#137b65] text-white border-[#137b65]'
                        : 'bg-white text-[#455852] border-[#d8e4dc]'
                    }`}
                  >
                    Approve / Verify
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewStatus('rejected')}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      reviewStatus === 'rejected'
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white text-[#455852] border-[#d8e4dc]'
                    }`}
                  >
                    Reject Application
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#172b28] mb-1">
                  Reason / Administrative Notes
                </label>
                <textarea
                  rows={3}
                  required
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Record verification verification checks or rejection rationale..."
                  className="w-full p-2.5 rounded-xl border border-[#d8e3dc] outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveProf(null)}
                  className="px-4 py-2 rounded-xl border border-[#d0ded5] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-[#172b28] text-white text-xs font-bold hover:bg-[#0b5548] transition"
                >
                  {actionLoading ? 'Recording...' : 'Submit Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
