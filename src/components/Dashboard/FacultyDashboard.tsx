import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, getDocs, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserProfile, TimetableEntry, LeaveRequest, ResearchPublication, CollegeEvent } from '../../types';
import { Calendar, FileText, GraduationCap, Clock, BookOpen, ChevronRight, Users, ClipboardList, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

export default function FacultyDashboard({ profile }: { profile: UserProfile }) {
  const navigate = useNavigate();
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [recentLeaves, setRecentLeaves] = useState<LeaveRequest[]>([]);
  const [publications, setPublications] = useState<ResearchPublication[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CollegeEvent[]>([]);

  useEffect(() => {
    const timetableQuery = query(collection(db, 'timetable'), where('facultyUid', '==', profile.uid));
    const leaveQuery = query(collection(db, 'leaves'), where('facultyUid', '==', profile.uid), orderBy('appliedAt', 'desc'), limit(3));
    const researchQuery = query(collection(db, 'research'), where('facultyUid', '==', profile.uid), limit(3));

    const unsubTimetable = onSnapshot(timetableQuery, (snap) => {
      setTimetable(snap.docs.map(d => ({ id: d.id, ...d.data() } as TimetableEntry)));
    });

    const unsubLeaves = onSnapshot(leaveQuery, (snap) => {
      setRecentLeaves(snap.docs.map(d => ({ id: d.id, ...d.data() } as LeaveRequest)));
    });

    const unsubResearch = onSnapshot(researchQuery, (snap) => {
      setPublications(snap.docs.map(d => ({ id: d.id, ...d.data() } as ResearchPublication)));
    });

    // Fetch upcoming events
    const today = new Date().toISOString().split('T')[0];
    const eventsQuery = query(
      collection(db, 'events'), 
      where('date', '>=', today),
      orderBy('date', 'asc'),
      limit(3)
    );

    const unsubEvents = onSnapshot(eventsQuery, (snapshot) => {
      const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CollegeEvent[];
      setUpcomingEvents(events);
    });

    return () => {
      unsubTimetable();
      unsubLeaves();
      unsubResearch();
      unsubEvents();
    };
  }, [profile.uid]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Faculty Dashboard</h2>
          <p className="text-slate-500">Welcome back, {profile.displayName}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-2xl shadow-sm text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Clock size={16} className="text-indigo-600" />
            Next Class: 10:30 AM
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar size={20} className="text-indigo-600" />
                Today's Schedule
              </h3>
              <button title="View full timetable" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Full Timetable</button>
            </div>
            
            {timetable.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-500">No classes scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-4">
                {timetable.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group">
                    <div className="w-16 text-center">
                      <p className="text-sm font-bold text-slate-900">{entry.startTime}</p>
                      <p className="text-xs text-slate-400">{entry.endTime}</p>
                    </div>
                    <div className="w-px h-10 bg-slate-100 group-hover:bg-indigo-100"></div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{entry.subjectId}</p>
                      <p className="text-xs text-slate-500">{entry.courseId}</p>
                    </div>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-400" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Research */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <GraduationCap size={20} className="text-indigo-600" />
                Research
              </h3>
              <div className="space-y-4">
                {publications.map(pub => (
                  <div key={pub.id} className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-sm font-bold text-slate-900 truncate">{pub.title}</p>
                    <p className="text-xs text-slate-500">{pub.publicationDate}</p>
                  </div>
                ))}
                {publications.length === 0 && <p className="text-sm text-slate-500">No publications yet</p>}
              </div>
            </div>

            {/* Leave Status */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-indigo-600" />
                Recent Leaves
              </h3>
              <div className="space-y-4">
                {recentLeaves.map(leave => (
                  <div key={leave.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{leave.type}</p>
                      <p className="text-xs text-slate-500">{leave.startDate}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                      leave.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      leave.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {leave.status}
                    </span>
                  </div>
                ))}
                {recentLeaves.length === 0 && <p className="text-sm text-slate-500">No leave history</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Announcements & Quick Actions */}
        <div className="space-y-6">
          <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-200">
            <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button title="Apply for leave" className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all flex flex-col items-center gap-2 text-center">
                <FileText size={24} />
                <span className="text-xs font-semibold">Apply Leave</span>
              </button>
              <button title="Mark attendance" className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all flex flex-col items-center gap-2 text-center">
                <ClipboardList size={24} />
                <span className="text-xs font-semibold">Attendance</span>
              </button>
              <button title="Upload research" className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all flex flex-col items-center gap-2 text-center">
                <GraduationCap size={24} />
                <span className="text-xs font-semibold">Research</span>
              </button>
              <button title="View profile" className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all flex flex-col items-center gap-2 text-center">
                <Users size={24} />
                <span className="text-xs font-semibold">Profile</span>
              </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar size={20} className="text-indigo-600" />
                Upcoming Events
              </h3>
              <Link to="/events" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View All</Link>
            </div>
            <div className="space-y-4">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-12 h-12 bg-white rounded-xl flex flex-col items-center justify-center shadow-sm border border-slate-100">
                      <span className="text-[10px] font-bold text-indigo-600 uppercase">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                      <span className="text-lg font-black text-slate-900 leading-none">{new Date(event.date).getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 truncate">{event.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                          <Clock size={12} className="text-indigo-500" />
                          {event.time || 'All Day'}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                            <MapPin size={12} className="text-indigo-500" />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-sm text-slate-500">No upcoming events</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <BookOpen size={20} className="text-indigo-600" />
              Announcements
            </h3>
            <div className="space-y-6">
              {[1, 2].map(i => (
                <div key={i} className="relative pl-4 border-l-2 border-indigo-100">
                  <p className="text-sm font-bold text-slate-900">Mid-term Exam Schedule</p>
                  <p className="text-xs text-slate-500 mt-1">The mid-term exams will start from April 15th...</p>
                  <p className="text-[10px] text-slate-400 mt-2">Yesterday</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
