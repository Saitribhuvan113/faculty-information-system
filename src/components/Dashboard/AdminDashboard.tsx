import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { collection, query, getDocs, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserProfile, Attendance, LeaveRequest, ResearchPublication } from '../../types';
import { Users, ClipboardList, FileText, GraduationCap, TrendingUp, UserCheck, Clock } from 'lucide-react';
import { motion } from 'motion/react';

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${color}`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  </div>
);

export default function AdminDashboard({ profile }: { profile: UserProfile }) {
  const [stats, setStats] = useState({
    totalFaculty: 0,
    presentToday: 0,
    pendingLeaves: 0,
    totalResearch: 0,
    totalTeachers: 0,
    attendanceByYear: { '1st': 0, '2nd': 0, '3rd': 0 }
  });

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
      const teacherSnap = await getDocs(collection(db, 'teachers'));

      setStats({
        totalFaculty: facultySnap.size,
        presentToday: attendanceSnap.size,
        pendingLeaves: leaveSnap.size,
        totalResearch: researchSnap.size,
        totalTeachers: teacherSnap.size,
        attendanceByYear: yearStats
      });
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Admin Overview</h2>
          <p className="text-slate-500">Welcome back, {profile.displayName}</p>
        </div>
        <Link to="/teachers" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2">
          <Users size={20} />
          Manage Teachers
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Faculty" value={stats.totalFaculty} icon={Users} color="bg-blue-600 shadow-blue-200" />
        <StatCard title="Present Today" value={stats.presentToday} icon={UserCheck} color="bg-emerald-600 shadow-emerald-200" />
        <StatCard title="Pending Leaves" value={stats.pendingLeaves} icon={Clock} color="bg-amber-600 shadow-amber-200" />
        <StatCard title="Teachers List" value={stats.totalTeachers} icon={Users} color="bg-indigo-600 shadow-indigo-200" />
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Attendance by Year (Today)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {(['1st', '2nd', '3rd'] as const).map((year) => (
            <div key={year} className="p-6 bg-slate-50 rounded-3xl text-center border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">{year} Year</p>
              <p className="text-4xl font-black text-indigo-600 mb-1">{stats.attendanceByYear[year]}</p>
              <p className="text-xs font-medium text-slate-500">Faculty Present</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
