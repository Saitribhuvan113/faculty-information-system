import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, onSnapshot, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserProfile, TimetableEntry, Subject, Course } from '../../types';
import { Calendar, Plus, Clock, MapPin, Trash2, Edit2, XCircle, AlertCircle, Users, RotateCcw, X as CloseIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function TimetableManagement({ profile }: { profile: UserProfile }) {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [facultyList, setFacultyList] = useState<UserProfile[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastDeleted, setLastDeleted] = useState<TimetableEntry | null>(null);
  const [showUndo, setShowUndo] = useState(false);

  const isAdmin = profile.role === 'admin';
  const isHOD = profile.role === 'hod';
  const canManage = isAdmin || isHOD;

  // Filter state
  const [filterDay, setFilterDay] = useState<string>('All');
  const [filterFaculty, setFilterFaculty] = useState<string>('All');
  const [filterCourse, setFilterCourse] = useState<string>('All');

  // Form state
  const [facultyUid, setFacultyUid] = useState('');
  const [facultyName, setFacultyName] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [day, setDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'>('Monday');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      let facultyQuery;
      if (isAdmin) {
        facultyQuery = query(collection(db, 'users'), where('role', 'in', ['faculty', 'hod']));
      } else if (isHOD) {
        facultyQuery = query(collection(db, 'users'), where('departmentId', '==', profile.departmentId));
      } else {
        facultyQuery = query(collection(db, 'users'), where('uid', '==', profile.uid));
      }

      const facultySnap = await getDocs(facultyQuery);
      const facultyData = facultySnap.docs.map(d => ({ uid: d.id, ...(d.data() as any) } as UserProfile));
      setFacultyList(facultyData);

      const subjectsSnap = await getDocs(collection(db, 'subjects'));
      setSubjects(subjectsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Subject)));

      const coursesSnap = await getDocs(collection(db, 'courses'));
      setCourses(coursesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Course)));
    };

    fetchInitialData();

    let timetableQuery;
    if (isAdmin) {
      timetableQuery = query(collection(db, 'timetable'));
    } else if (isHOD && profile.departmentId) {
      timetableQuery = query(collection(db, 'timetable'), where('departmentId', '==', profile.departmentId));
    } else {
      timetableQuery = query(collection(db, 'timetable'), where('facultyUid', '==', profile.uid));
    }

    const unsubscribe = onSnapshot(timetableQuery, (snapshot) => {
      setTimetable(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TimetableEntry)));
    });

    return () => unsubscribe();
  }, [profile.uid, profile.role, profile.departmentId, isAdmin, isHOD]);

  const handleAddOrUpdateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const entryData = {
        facultyUid,
        facultyName,
        subjectId: subjectName,
        courseId: courseName,
        day,
        startTime,
        endTime,
        departmentId: profile.departmentId // Add department context
      };

      if (editingEntry) {
        await updateDoc(doc(db, 'timetable', editingEntry.id), entryData);
      } else {
        await addDoc(collection(db, 'timetable'), entryData);
      }
      
      setShowModal(false);
      setEditingEntry(null);
      // Reset form
      setFacultyUid('');
      setFacultyName('');
      setSubjectName('');
      setCourseName('');
      setStartTime('');
      setEndTime('');
    } catch (err: any) {
      setError(err.message || 'Failed to save timetable entry');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setFacultyUid(entry.facultyUid);
    setFacultyName(entry.facultyName);
    setSubjectName(entry.subjectId);
    setCourseName(entry.courseId);
    setDay(entry.day);
    setStartTime(entry.startTime);
    setEndTime(entry.endTime);
    setShowModal(true);
  };

  const handleDelete = async (entry: TimetableEntry) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    try {
      setLastDeleted(entry);
      setShowUndo(true);
      await deleteDoc(doc(db, 'timetable', entry.id));
      
      setTimeout(() => {
        setShowUndo(false);
      }, 5000);
    } catch (err) {
      console.error('Error deleting entry:', err);
    }
  };

  const handleUndoDelete = async () => {
    if (!lastDeleted) return;
    try {
      const { id, ...data } = lastDeleted as TimetableEntry;
      await addDoc(collection(db, 'timetable'), data);
      setLastDeleted(null);
      setShowUndo(false);
    } catch (err) {
      console.error('Error undoing delete:', err);
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

          {canManage && (
            <button
              onClick={() => {
                setEditingEntry(null);
                setFacultyUid('');
                setFacultyName('');
                setSubjectName('');
                setCourseName('');
                setStartTime('');
                setEndTime('');
                setShowModal(true);
              }}
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
                        {canManage && (
                          <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEdit(entry)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(entry)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl transition-all shadow-sm"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
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

      {/* Undo Notification */}
      <AnimatePresence>
        {showUndo && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Calendar size={20} />
              </div>
              <div>
                <p className="font-bold text-sm">Schedule entry removed</p>
                <p className="text-slate-400 text-xs">{lastDeleted?.subjectId} - {lastDeleted?.day}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 border-l border-slate-700 pl-6">
              <button
                onClick={handleUndoDelete}
                className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-bold text-sm transition-colors"
              >
                <RotateCcw size={16} />
                Undo
              </button>
              <button
                onClick={() => setShowUndo(false)}
                className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <CloseIcon size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Schedule Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowModal(false);
                setEditingEntry(null);
              }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-slate-900">
                  {editingEntry ? 'Edit Schedule Entry' : 'Add Schedule Entry'}
                </h3>
                <button 
                  onClick={() => {
                    setShowModal(false);
                    setEditingEntry(null);
                  }} 
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all"
                >
                  <XCircle size={24} />
                </button>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm">
                  <AlertCircle size={18} />
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleAddOrUpdateEntry} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Faculty</label>
                    <select
                      required
                      value={facultyUid}
                      onChange={(e) => {
                        const f = facultyList.find(fac => fac.uid === e.target.value);
                        setFacultyUid(e.target.value);
                        setFacultyName(f?.displayName || '');
                      }}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    >
                      <option value="">Select Faculty</option>
                      {facultyList.map(f => <option key={f.uid} value={f.uid}>{f.displayName}</option>)}
                    </select>
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
                    <select
                      required
                      value={subjectName}
                      onChange={(e) => setSubjectName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(s => <option key={s.id} value={s.name}>{s.name} ({s.code})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Course</label>
                    <select
                      required
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    >
                      <option value="">Select Course</option>
                      {courses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
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
                    editingEntry ? 'Update Entry' : 'Save Entry'
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
