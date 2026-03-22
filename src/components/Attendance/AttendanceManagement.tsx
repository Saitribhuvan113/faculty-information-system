import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserProfile, Attendance } from '../../types';
import { ClipboardList, Check, X, Search, Calendar, UserCheck, UserX } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';

export default function AttendanceManagement({ profile }: { profile: UserProfile }) {
  const [facultyList, setFacultyList] = useState<UserProfile[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedYear, setSelectedYear] = useState<'1st' | '2nd' | '3rd'>('1st');
  const [activeView, setActiveView] = useState<'marking' | 'records'>('marking');
  const [activeTab, setActiveTab] = useState<'all' | 'present' | 'absent'>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch all faculty members
    const fetchFaculty = async () => {
      const q = query(collection(db, 'users'), where('role', '==', 'faculty'));
      const snap = await getDocs(q);
      setFacultyList(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
    };

    fetchFaculty();

    // Listen for attendance records for the selected date and year
    const attendanceQuery = query(
      collection(db, 'attendance'), 
      where('date', '==', selectedDate),
      where('year', '==', selectedYear)
    );
    const unsubscribe = onSnapshot(attendanceQuery, (snapshot) => {
      setAttendanceRecords(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Attendance)));
    });

    return () => unsubscribe();
  }, [selectedDate, selectedYear]);

  const handleMarkAttendance = async (facultyUid: string, status: 'present' | 'absent') => {
    if (profile.role !== 'admin' && profile.role !== 'hod') return;

    const existingRecord = attendanceRecords.find(r => r.facultyUid === facultyUid);

    try {
      if (existingRecord) {
        await updateDoc(doc(db, 'attendance', existingRecord.id), {
          status,
          markedBy: profile.uid
        });
      } else {
        await addDoc(collection(db, 'attendance'), {
          facultyUid,
          date: selectedDate,
          year: selectedYear,
          status,
          markedBy: profile.uid
        });
      }
    } catch (err) {
      console.error('Error marking attendance:', err);
    }
  };

  const getStatus = (facultyUid: string) => {
    return attendanceRecords.find(r => r.facultyUid === facultyUid)?.status;
  };

  const presentFaculty = facultyList.filter(f => getStatus(f.uid) === 'present');
  const absentFaculty = facultyList.filter(f => getStatus(f.uid) === 'absent');
  const pendingFaculty = facultyList.filter(f => !getStatus(f.uid));

  const recordsList = activeTab === 'all' ? facultyList.filter(f => getStatus(f.uid)) :
                      activeTab === 'present' ? presentFaculty : absentFaculty;

  const canMark = profile.role === 'admin' || profile.role === 'hod';

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Attendance Tracking</h2>
          <p className="text-slate-500">Monitor and mark faculty attendance</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
            {(['1st', '2nd', '3rd'] as const).map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${
                  selectedYear === year 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {year} Year
              </button>
            ))}
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-semibold text-slate-700"
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Faculty</p>
          <p className="text-2xl font-black text-slate-900">{facultyList.length}</p>
        </div>
        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 shadow-sm">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Present</p>
          <p className="text-2xl font-black text-emerald-700">{presentFaculty.length}</p>
        </div>
        <div className="bg-red-50 p-6 rounded-3xl border border-red-100 shadow-sm">
          <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">Absent</p>
          <p className="text-2xl font-black text-red-700">{absentFaculty.length}</p>
        </div>
        <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 shadow-sm">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Pending</p>
          <p className="text-2xl font-black text-amber-700">{pendingFaculty.length}</p>
        </div>
      </div>

      {/* Main View Switcher */}
      <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
        <button
          onClick={() => setActiveView('marking')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
            activeView === 'marking'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Mark Attendance
        </button>
        <button
          onClick={() => setActiveView('records')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
            activeView === 'records'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Attendance Records
        </button>
      </div>

      {activeView === 'marking' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">Pending Attendance</h3>
            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
              {pendingFaculty.length} Remaining
            </span>
          </div>
          
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="px-8 py-5">Faculty Member</th>
                    <th className="px-8 py-5">Department</th>
                    {canMark && <th className="px-8 py-5 text-right">Mark Status</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pendingFaculty.map((faculty) => (
                    <tr key={faculty.uid} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                            {faculty.displayName?.[0] || faculty.email?.[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{faculty.displayName}</p>
                            <p className="text-xs text-slate-400">{faculty.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-sm font-medium text-slate-600">{faculty.departmentId || 'General'}</span>
                      </td>
                      {canMark && (
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleMarkAttendance(faculty.uid, 'present')}
                              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all font-bold text-sm"
                            >
                              <UserCheck size={18} />
                              Present
                            </button>
                            <button
                              onClick={() => handleMarkAttendance(faculty.uid, 'absent')}
                              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all font-bold text-sm"
                            >
                              <UserX size={18} />
                              Absent
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {pendingFaculty.length === 0 && (
                    <tr>
                      <td colSpan={canMark ? 3 : 2} className="px-8 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                            <Check size={24} />
                          </div>
                          <p className="text-slate-500 font-bold">All attendance marked for today!</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tabs for Records */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-px">
            {[
              { id: 'all', label: 'All Marked', count: attendanceRecords.length },
              { id: 'present', label: 'Present', count: presentFaculty.length },
              { id: 'absent', label: 'Absent', count: absentFaculty.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 text-sm font-bold transition-all relative ${
                  activeTab === tab.id 
                    ? 'text-indigo-600' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
                <span className="ml-2 px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px]">
                  {tab.count}
                </span>
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTabRecords"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="px-8 py-5">Faculty Member</th>
                    <th className="px-8 py-5">Department</th>
                    <th className="px-8 py-5">Status</th>
                    {canMark && <th className="px-8 py-5 text-right">Change Status</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recordsList.map((faculty) => (
                    <tr key={faculty.uid} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                            {faculty.displayName?.[0] || faculty.email?.[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{faculty.displayName}</p>
                            <p className="text-xs text-slate-400">{faculty.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-sm font-medium text-slate-600">{faculty.departmentId || 'General'}</span>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          getStatus(faculty.uid) === 'present' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {getStatus(faculty.uid)}
                        </span>
                      </td>
                      {canMark && (
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleMarkAttendance(faculty.uid, getStatus(faculty.uid) === 'present' ? 'absent' : 'present')}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
                            >
                              Mark as {getStatus(faculty.uid) === 'present' ? 'Absent' : 'Present'}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {recordsList.length === 0 && (
                    <tr>
                      <td colSpan={canMark ? 4 : 3} className="px-8 py-12 text-center">
                        <p className="text-slate-500 font-medium">No records found for this category.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
