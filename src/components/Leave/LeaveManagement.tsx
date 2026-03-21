import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserProfile, LeaveRequest } from '../../types';
import { FileText, Plus, CheckCircle, XCircle, Clock, Calendar, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

export default function LeaveManagement({ profile }: { profile: UserProfile }) {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    let leaveQuery;
    if (profile.role === 'admin') {
      leaveQuery = query(collection(db, 'leaves'));
    } else if (profile.role === 'hod') {
      // For HOD, we'll fetch all and filter or use a more complex query
      leaveQuery = query(collection(db, 'leaves'));
    } else {
      leaveQuery = query(collection(db, 'leaves'), where('facultyUid', '==', profile.uid));
    }

    const unsubscribe = onSnapshot(leaveQuery, (snapshot) => {
      setLeaves(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LeaveRequest)));
    });

    return () => unsubscribe();
  }, [profile.uid, profile.role]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await addDoc(collection(db, 'leaves'), {
        facultyUid: profile.uid,
        type: leaveType,
        startDate,
        endDate,
        reason,
        status: 'pending',
        appliedAt: new Date().toISOString()
      });
      setShowApplyModal(false);
      // Reset form
      setStartDate('');
      setEndDate('');
      setReason('');
    } catch (err: any) {
      setError(err.message || 'Failed to apply for leave');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (leaveId: string, newStatus: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'leaves', leaveId), {
        status: newStatus,
        approvedBy: profile.uid
      });
    } catch (err) {
      console.error('Error updating leave status:', err);
    }
  };

  const handleDelete = async (leaveId: string) => {
    if (!window.confirm('Are you sure you want to cancel this leave request?')) return;
    try {
      await deleteDoc(doc(db, 'leaves', leaveId));
    } catch (err) {
      console.error('Error deleting leave:', err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Leave Management</h2>
          <p className="text-slate-500">Track and manage leave applications</p>
        </div>
        {profile.role === 'faculty' && (
          <button
            onClick={() => setShowApplyModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
          >
            <Plus size={20} />
            Apply Leave
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="px-8 py-5">Type</th>
                <th className="px-8 py-5">Duration</th>
                <th className="px-8 py-5">Reason</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-slate-500">
                    No leave applications found
                  </td>
                </tr>
              ) : (
                leaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <p className="font-bold text-slate-900">{leave.type}</p>
                      <p className="text-xs text-slate-400">Applied on {format(new Date(leave.appliedAt), 'MMM dd, yyyy')}</p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar size={14} className="text-indigo-600" />
                        {leave.startDate} to {leave.endDate}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm text-slate-600 max-w-xs truncate">{leave.reason}</p>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        leave.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        leave.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(profile.role === 'admin' || profile.role === 'hod') && leave.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(leave.id, 'approved')}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                              title="Approve"
                            >
                              <CheckCircle size={20} />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(leave.id, 'rejected')}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                              title="Reject"
                            >
                              <XCircle size={20} />
                            </button>
                          </>
                        )}
                        {profile.role === 'faculty' && leave.status === 'pending' && (
                          <button
                            onClick={() => handleDelete(leave.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            title="Cancel Request"
                          >
                            <XCircle size={20} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      <AnimatePresence>
        {showApplyModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowApplyModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-slate-900">Apply for Leave</h3>
                <button onClick={() => setShowApplyModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all">
                  <XCircle size={24} />
                </button>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm">
                  <AlertCircle size={18} />
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleApply} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Leave Type</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    <option>Casual Leave</option>
                    <option>Sick Leave</option>
                    <option>Maternity Leave</option>
                    <option>Paternity Leave</option>
                    <option>Duty Leave</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">End Date</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Reason</label>
                  <textarea
                    required
                    rows={4}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                    placeholder="Briefly explain the reason for your leave..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
