import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserProfile, Attendance } from '../../types';
import { ClipboardList, Check, X, Search, Calendar, UserCheck, UserX } from 'lucide-react';
import { format } from 'date-fns';

export default function AttendanceManagement({ profile }: { profile: UserProfile }) {
  const [facultyList, setFacultyList] = useState<UserProfile[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedYear, setSelectedYear] = useState<'1st' | '2nd' | '3rd'>('1st');
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
    if (profile.role !== 'admin') return;

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

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="px-8 py-5">Faculty Member</th>
                <th className="px-8 py-5">Department</th>
                <th className="px-8 py-5">Status</th>
                {profile.role === 'admin' && <th className="px-8 py-5 text-right">Mark Attendance</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {facultyList.map((faculty) => (
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
                    {getStatus(faculty.uid) ? (
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        getStatus(faculty.uid) === 'present' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {getStatus(faculty.uid)}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium italic">Not marked</span>
                    )}
                  </td>
                  {profile.role === 'admin' && (
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleMarkAttendance(faculty.uid, 'present')}
                          className={`p-2 rounded-xl transition-all ${
                            getStatus(faculty.uid) === 'present' 
                              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title="Mark Present"
                        >
                          <UserCheck size={20} />
                        </button>
                        <button
                          onClick={() => handleMarkAttendance(faculty.uid, 'absent')}
                          className={`p-2 rounded-xl transition-all ${
                            getStatus(faculty.uid) === 'absent' 
                              ? 'bg-red-600 text-white shadow-lg shadow-red-200' 
                              : 'text-red-600 hover:bg-red-50'
                          }`}
                          title="Mark Absent"
                        >
                          <UserX size={20} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
