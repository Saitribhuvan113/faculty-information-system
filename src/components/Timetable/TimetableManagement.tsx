import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, onSnapshot, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserProfile, TimetableEntry, Subject, Course } from '../../types';
import { Calendar, Plus, Clock, MapPin, Trash2, Edit2, XCircle, AlertCircle, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function TimetableManagement({ profile }: { profile: UserProfile }) {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [facultyList, setFacultyList] = useState<UserProfile[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filter state
  const [filterDay, setFilterDay] = useState<string>('All');
  const [filterFaculty, setFilterFaculty] = useState<string>('All');
  const [filterCourse, setFilterCourse] = useState<string>('All');

  // Form state
  const [facultyUid, setFacultyUid] = useState('');
  const [facultyName, setFacultyName] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [courseId, setCourseId] = useState('Computer Engineering');
  const [day, setDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'>('Monday');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      // Filter for Computer Engineering faculty only
      const facultySnap = await getDocs(query(
        collection(db, 'users'), 
        where('role', '==', 'faculty'),
        where('departmentId', '==', 'Computer Engineering')
      ));
      setFacultyList(facultySnap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));

      const subjectsSnap = await getDocs(collection(db, 'subjects'));
      setSubjects(subjectsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Subject)));

      const coursesSnap = await getDocs(collection(db, 'courses'));
      setCourses(coursesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Course)));
    };

    fetchInitialData();

    let timetableQuery;
    if (profile.role === 'admin') {
      timetableQuery = query(collection(db, 'timetable'));
    } else {
      timetableQuery = query(collection(db, 'timetable'), where('facultyUid', '==', profile.uid));
    }

    const unsubscribe = onSnapshot(timetableQuery, (snapshot) => {
      setTimetable(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TimetableEntry)));
    });

    return () => unsubscribe();
  }, [profile.uid, profile.role]);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await addDoc(collection(db, 'timetable'), {
        facultyUid: facultyUid || 'manual',
        facultyName,
        subjectId: subjectName,
        courseId,
        day,
        startTime,
        endTime
      });
      setShowAddModal(false);
      // Reset form
      setFacultyUid('');
      setFacultyName('');
      setSubjectName('');
      setCourseId('Computer Engineering');
      setStartTime('');
      setEndTime('');
    } catch (err: any) {
      setError(err.message || 'Failed to add timetable entry');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    try {
      await deleteDoc(doc(db, 'timetable', id));
    } catch (err) {
      console.error('Error deleting entry:', err);
    }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const filteredTimetable = timetable.filter(entry => {
    const matchesFaculty = filterFaculty === 'All' || entry.facultyUid === filterFaculty;
    const matchesCourse = filterCourse === 'All' || entry.courseId === filterCourse;
    const matchesDay = filterDay === 'All' || entry.day === filterDay;
    return matchesFaculty && matchesCourse && matchesDay;
  });

  const displayedDays = filterDay === 'All' ? days : [filterDay];

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Timetable Management</h2>
          <p className="text-slate-500">Schedule and view class timings</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
            <select
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <option value="All">All Days</option>
              {days.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select
              value={filterFaculty}
              onChange={(e) => setFilterFaculty(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <option value="All">All Faculty</option>
              {facultyList.map(f => <option key={f.uid} value={f.uid}>{f.displayName}</option>)}
            </select>
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <option value="All">All Courses</option>
              {courses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          {profile.role === 'admin' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 text-sm"
            >
              <Plus size={18} />
              Add Schedule
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {displayedDays.map((dayName) => {
          const dayEntries = filteredTimetable.filter(e => e.day === dayName).sort((a, b) => a.startTime.localeCompare(b.startTime));
          if (dayEntries.length === 0 && (filterDay !== 'All' || profile.role !== 'admin')) {
            if (filterDay !== 'All' && dayName === filterDay) {
              return (
                <div key={dayName} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-12 text-center">
                  <Calendar className="mx-auto text-slate-200 mb-4" size={48} />
                  <h3 className="text-lg font-bold text-slate-900 mb-1">No classes scheduled</h3>
                  <p className="text-slate-500 text-sm">There are no entries for {dayName} with the current filters.</p>
                </div>
              );
            }
            return null;
          }

          return (
            <div key={dayName} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-8 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">{dayName}</h3>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{dayEntries.length} Classes</span>
              </div>
              <div className="p-4">
                {dayEntries.length === 0 ? (
                  <p className="text-center py-8 text-slate-400 italic text-sm">No classes scheduled</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dayEntries.map((entry) => (
                      <div key={entry.id} className="p-5 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group relative">
                        {profile.role === 'admin' && (
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">
                          <Clock size={14} />
                          {entry.startTime} - {entry.endTime}
                        </div>
                        <h4 className="font-bold text-slate-900 mb-1">{entry.subjectId}</h4>
                        <p className="text-sm text-slate-600 mb-3">{entry.courseId}</p>
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Users size={14} />
                            {entry.facultyName}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Schedule Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-slate-900">Add Schedule Entry</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all">
                  <XCircle size={24} />
                </button>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm">
                  <AlertCircle size={18} />
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleAddEntry} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Faculty Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter Faculty Name"
                      value={facultyName}
                      onChange={(e) => setFacultyName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Day</label>
                    <select
                      value={day}
                      onChange={(e) => setDay(e.target.value as any)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    >
                      {days.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Subject</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter Subject Name"
                      value={subjectName}
                      onChange={(e) => setSubjectName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Course</label>
                    <input
                      type="text"
                      readOnly
                      value={courseId}
                      className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-slate-500 cursor-not-allowed outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Start Time</label>
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">End Time</label>
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Save Entry'
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
