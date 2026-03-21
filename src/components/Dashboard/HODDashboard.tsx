import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, getDocs, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserProfile, LeaveRequest } from '../../types';
import { Users, FileText, CheckCircle, XCircle, Clock, Calendar, ClipboardList, GraduationCap, PlusCircle } from 'lucide-react';
import { motion } from 'motion/react';

const QuickActionCard = ({ to, icon: Icon, label, description, color }: { to: string, icon: any, label: string, description: string, color: string }) => (
  <Link 
    to={to}
    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all group"
  >
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg mb-4 group-hover:scale-110 transition-transform ${color}`}>
      <Icon size={24} />
    </div>
    <h4 className="font-bold text-slate-900 mb-1">{label}</h4>
    <p className="text-xs text-slate-500">{description}</p>
  </Link>
);

export default function HODDashboard({ profile }: { profile: UserProfile }) {
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [deptStats, setDeptStats] = useState({
    totalFaculty: 0,
    presentToday: 0
  });

  useEffect(() => {
    if (!profile.departmentId) return;

    const leaveQuery = query(
      collection(db, 'leaves'), 
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(leaveQuery, async (snapshot) => {
      const leaves = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaveRequest));
      
      // Filter leaves by department (since Firestore doesn't support deep joins easily here)
      // In a real app, we'd store departmentId on the leave request itself
      const facultyInDept = await getDocs(query(collection(db, 'users'), where('departmentId', '==', profile.departmentId)));
      const facultyUids = facultyInDept.docs.map(d => d.id);
      
      setPendingLeaves(leaves.filter(l => facultyUids.includes(l.facultyUid)));
      setDeptStats(prev => ({ ...prev, totalFaculty: facultyInDept.size }));
    });

    return () => unsubscribe();
  }, [profile.departmentId]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Department Dashboard</h2>
          <p className="text-slate-500">Head of Department - {profile.departmentId}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/teachers" className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Faculty Members</p>
              <p className="text-2xl font-bold text-slate-900">{deptStats.totalFaculty}</p>
            </div>
          </div>
        </Link>
        <Link to="/leaves" className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-amber-100 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Pending Approvals</p>
              <p className="text-2xl font-bold text-slate-900">{pendingLeaves.length}</p>
            </div>
          </div>
        </Link>
        <Link to="/attendance" className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Dept. Attendance</p>
              <p className="text-2xl font-bold text-slate-900">92%</p>
            </div>
          </div>
        </Link>
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <QuickActionCard 
            to="/teachers" 
            icon={PlusCircle} 
            label="Add Teacher" 
            description="Register a new faculty member" 
            color="bg-indigo-600 shadow-indigo-200"
          />
          <QuickActionCard 
            to="/attendance" 
            icon={ClipboardList} 
            label="Mark Attendance" 
            description="Record daily faculty presence" 
            color="bg-emerald-600 shadow-emerald-200"
          />
          <QuickActionCard 
            to="/timetable" 
            icon={Calendar} 
            label="Set Timetable" 
            description="Manage class schedules" 
            color="bg-blue-600 shadow-blue-200"
          />
          <QuickActionCard 
            to="/research" 
            icon={GraduationCap} 
            label="Research" 
            description="View publications" 
            color="bg-purple-600 shadow-purple-200"
          />
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Pending Leave Requests</h3>
        {pendingLeaves.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
              <FileText size={32} />
            </div>
            <p className="text-slate-500">No pending leave requests</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="pb-4">Faculty</th>
                  <th className="pb-4">Type</th>
                  <th className="pb-4">Duration</th>
                  <th className="pb-4">Reason</th>
                  <th className="pb-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pendingLeaves.map((leave) => (
                  <tr key={leave.id} className="text-sm">
                    <td className="py-4 font-semibold text-slate-900">{leave.facultyUid}</td>
                    <td className="py-4 text-slate-600">{leave.type}</td>
                    <td className="py-4 text-slate-600">{leave.startDate} to {leave.endDate}</td>
                    <td className="py-4 text-slate-600 max-w-xs truncate">{leave.reason}</td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button title="Approve leave" className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors">
                          <CheckCircle size={20} />
                        </button>
                        <button title="Reject leave" className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                          <XCircle size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
