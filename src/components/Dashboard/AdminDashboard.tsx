import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { collection, query, getDocs, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserProfile, Attendance, LeaveRequest, ResearchPublication, CollegeEvent } from '../../types';
import { Users, ClipboardList, FileText, GraduationCap, TrendingUp, UserCheck, Clock, PlusCircle, Calendar, BookOpen, MapPin, CalendarDays } from 'lucide-react';
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

const StatCard = ({ title, value, icon: Icon, color, to }: { title: string, value: string | number, icon: any, color: string, to?: string }) => {
  const content = (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 h-full">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );

  if (to) {
    return <Link to={to} className="block hover:scale-[1.02] transition-transform">{content}</Link>;
  }

  return content;
};

export default function AdminDashboard({ profile }: { profile: UserProfile }) {
  const [stats, setStats] = useState({
    totalFaculty: 0,
    presentToday: 0,
    pendingLeaves: 0,
    totalResearch: 0,
    attendanceByYear: { '1st': 0, '2nd': 0, '3rd': 0 }
  });
  const [upcomingEvents, setUpcomingEvents] = useState<CollegeEvent[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const facultyQuery = query(collection(db, 'users'), where('role', '==', 'faculty'));
      const facultySnap = await getDocs(facultyQuery);
      
      const today = new Date().toISOString().split('T')[0];
      const attendanceQuery = query(collection(db, 'attendance'), where('date', '==', today), where('status', '==', 'present'));
      const attendanceSnap = await getDocs(attendanceQuery);

      const yearStats = { '1st': 0, '2nd': 0, '3rd': 0 };
      attendanceSnap.docs.forEach(doc => {
        const data = doc.data() as Attendance;
        if (data.year && yearStats[data.year] !== undefined) {
          yearStats[data.year]++;
        }
      });

      const leaveQuery = query(collection(db, 'leaves'), where('status', '==', 'pending'));
      const leaveSnap = await getDocs(leaveQuery);

      const researchSnap = await getDocs(collection(db, 'research'));

      setStats({
        totalFaculty: facultySnap.size,
        presentToday: attendanceSnap.size,
        pendingLeaves: leaveSnap.size,
        totalResearch: researchSnap.size,
        attendanceByYear: yearStats
      });
    };

    fetchStats();

    // Fetch upcoming events
    const today = new Date().toISOString().split('T')[0];
    const eventsQuery = query(
      collection(db, 'events'), 
      where('date', '>=', today),
      orderBy('date', 'asc'),
      limit(3)
    );

    const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
      const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CollegeEvent[];
      setUpcomingEvents(events);
    });

    return () => {
      unsubscribeEvents();
    };
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Admin Overview</h2>
          <p className="text-slate-500">Welcome back, {profile.displayName}</p>
        </div>
        <div className="flex gap-3">
          <Link to="/faculty" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2">
            <Users size={20} />
            Manage Faculty
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Faculty" value={stats.totalFaculty} icon={Users} color="bg-blue-600 shadow-blue-200" to="/faculty" />
        <StatCard title="Present Today" value={stats.presentToday} icon={UserCheck} color="bg-emerald-600 shadow-emerald-200" to="/attendance" />
        <StatCard title="Pending Leaves" value={stats.pendingLeaves} icon={Clock} color="bg-amber-600 shadow-amber-200" to="/leaves" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Upcoming Events</h3>
            <Link to="/events" className="text-sm font-bold text-indigo-600 hover:text-indigo-700">View All</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="col-span-full text-center py-8">
                <CalendarDays className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No upcoming events</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6 font-mono uppercase tracking-wider text-xs text-slate-400">Attendance by Year</h3>
          <div className="space-y-4">
            {(['1st', '2nd', '3rd'] as const).map((year) => (
              <div key={year} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-sm font-bold text-slate-600">{year} Year</span>
                <span className="text-xl font-black text-indigo-600">{stats.attendanceByYear[year]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <QuickActionCard 
            to="/faculty" 
            icon={PlusCircle} 
            label="Add Faculty" 
            description="Register a new faculty member" 
            color="bg-blue-600 shadow-blue-200"
          />
          <QuickActionCard 
            to="/events" 
            icon={CalendarDays} 
            label="Manage Events" 
            description="Add or remove college events" 
            color="bg-purple-600 shadow-purple-200"
          />
          <QuickActionCard 
            to="/management" 
            icon={BookOpen} 
            label="Academic Data" 
            description="Manage subjects and courses" 
            color="bg-indigo-600 shadow-indigo-200"
          />
          <QuickActionCard 
            to="/attendance" 
            icon={ClipboardList} 
            label="Attendance" 
            description="View faculty attendance" 
            color="bg-emerald-600 shadow-emerald-200"
          />
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Activity</h3>
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="w-2 h-2 mt-2 rounded-full bg-indigo-600 shadow-lg shadow-indigo-200 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-slate-900">New faculty registration</p>
              <p className="text-xs text-slate-500 mt-1">System processed a new faculty application for Computer Engineering.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-2 h-2 mt-2 rounded-full bg-emerald-600 shadow-lg shadow-emerald-200 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-slate-900">Attendance report generated</p>
              <p className="text-xs text-slate-500 mt-1">Weekly attendance summary is now available for review.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
