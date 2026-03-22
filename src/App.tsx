import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc, onSnapshot, collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, UserRole } from './types';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  BookOpen, 
  FileText, 
  LogOut, 
  Bell, 
  Menu, 
  X,
  ClipboardList,
  GraduationCap,
  Search,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Auth Components
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import ForgotPassword from './components/Auth/ForgotPassword';

// Dashboard Components
import AdminDashboard from './components/Dashboard/AdminDashboard';
import HODDashboard from './components/Dashboard/HODDashboard';
import FacultyDashboard from './components/Dashboard/FacultyDashboard';

// Feature Components
import AttendanceManagement from './components/Attendance/AttendanceManagement';
import TimetableManagement from './components/Timetable/TimetableManagement';
import LeaveManagement from './components/Leave/LeaveManagement';
import ResearchManagement from './components/Research/ResearchManagement';
import SubjectCourseManagement from './components/Management/SubjectCourseManagement';
import FacultyManagement from './components/Management/FacultyManagement';
import Profile from './components/Profile/Profile';
import EventsManagement from './components/Events/EventsManagement';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SidebarItem = ({ to, icon: Icon, label, active, onClick }: { to: string, icon: any, label: string, active: boolean, onClick?: () => void }) => (
  <Link
    to={to}
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
      active 
        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
        : "text-slate-600 hover:bg-slate-100"
    )}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

const Layout = ({ user, profile, children }: { user: User, profile: UserProfile, children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const menuItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
    { to: '/timetable', icon: Calendar, label: 'Timetable' },
    { to: '/leaves', icon: FileText, label: 'Leaves' },
    { to: '/research', icon: GraduationCap, label: 'Research' },
    { to: '/events', icon: Calendar, label: 'Events' },
    { to: '/faculty', icon: Users, label: 'Faculty' },
    { to: '/profile', icon: UserIcon, label: 'Profile' },
  ];

  if (profile.role === 'admin') {
    menuItems.push({ to: '/management', icon: BookOpen, label: 'Management' });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-50 transition-transform duration-300 lg:translate-x-0 lg:static",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col p-4">
          <div className="flex items-center gap-3 px-2 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              F
            </div>
            <h1 className="text-xl font-bold text-slate-900">FIS Portal</h1>
          </div>

          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => (
              <div key={item.to}>
                <SidebarItem 
                  to={item.to}
                  icon={item.icon}
                  label={item.label}
                  active={window.location.pathname === item.to}
                  onClick={() => setIsSidebarOpen(false)}
                />
              </div>
            ))}
          </nav>

          <div className="pt-4 border-t border-slate-100">
            <Link to="/profile" className="flex items-center gap-3 px-4 py-3 mb-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-indigo-100 flex-shrink-0 border-2 border-white shadow-sm">
                {profile.profilePhotoUrl ? (
                  <img src={profile.profilePhotoUrl} alt={profile.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-indigo-700 font-bold">
                    {profile.displayName?.[0] || user.email?.[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{profile.displayName || user.email}</p>
                <p className="text-[10px] text-indigo-600 font-medium capitalize">{profile.role}</p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-slate-600 lg:hidden"
          >
            <Menu size={24} />
          </button>

          <div className="flex-1 max-w-xl mx-4 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-full relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <Link to="/profile" className="w-10 h-10 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-sm hover:ring-2 hover:ring-indigo-500 transition-all">
              {profile.profilePhotoUrl ? (
                <img src={profile.profilePhotoUrl} alt={profile.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                profile.displayName?.[0] || user.email?.[0].toUpperCase()
              )}
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize required data
    const initData = async () => {
      try {
        // Check for Computer Engineering department
        const deptQuery = query(collection(db, 'departments'), where('name', '==', 'Computer Engineering'));
        const deptSnap = await getDocs(deptQuery);
        if (deptSnap.empty) {
          await addDoc(collection(db, 'departments'), { name: 'Computer Engineering' });
        }

        // Check for Computer Engineering course
        const courseQuery = query(collection(db, 'courses'), where('name', '==', 'Computer Engineering'));
        const courseSnap = await getDocs(courseQuery);
        if (courseSnap.empty) {
          await addDoc(collection(db, 'courses'), { 
            name: 'Computer Engineering', 
            code: 'CE-01', 
            departmentId: 'Computer Engineering' 
          });
        }
      } catch (err) {
        console.error('Error initializing data:', err);
      }
    };

    initData();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fetch profile from Firestore
        const profileDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (profileDoc.exists()) {
          setProfile(profileDoc.data() as UserProfile);
        } else {
          // Assign roles based on provided emails
          let role: UserRole = 'faculty';
          let displayName = 'Faculty Member';

          if (firebaseUser.email === 'maaribhai876748@gmail.com' || firebaseUser.email === 'ganeshatole137@gmail.com') {
            role = 'admin';
            displayName = 'System Admin';
          } else if (firebaseUser.email === 'Shreeyashcollege@gmai.com') {
            role = 'faculty';
            displayName = 'Shreeyash College';
          } else if (firebaseUser.email === 'anilnaik@gmail.com') {
            role = 'faculty';
            displayName = 'Anil Naik';
          }

          const defaultProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || displayName,
            role: role,
            departmentId: 'Computer Engineering',
          };
          setProfile(defaultProfile);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium">Loading FIS Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        <Route path="/" element={
          user && profile ? (
            <Layout user={user} profile={profile}>
              {profile.role === 'admin' && <AdminDashboard profile={profile} />}
              {profile.role === 'hod' && <HODDashboard profile={profile} />}
              {profile.role === 'faculty' && <FacultyDashboard profile={profile} />}
            </Layout>
          ) : <Navigate to="/login" />
        } />

        <Route path="/attendance" element={
          user && profile ? (
            <Layout user={user} profile={profile}>
              <AttendanceManagement profile={profile} />
            </Layout>
          ) : <Navigate to="/login" />
        } />

        <Route path="/timetable" element={
          user && profile ? (
            <Layout user={user} profile={profile}>
              <TimetableManagement profile={profile} />
            </Layout>
          ) : <Navigate to="/login" />
        } />

        <Route path="/leaves" element={
          user && profile ? (
            <Layout user={user} profile={profile}>
              <LeaveManagement profile={profile} />
            </Layout>
          ) : <Navigate to="/login" />
        } />

        <Route path="/research" element={
          user && profile ? (
            <Layout user={user} profile={profile}>
              <ResearchManagement profile={profile} />
            </Layout>
          ) : <Navigate to="/login" />
        } />

        <Route path="/faculty" element={
          user && profile && (profile.role === 'admin' || profile.role === 'hod') ? (
            <Layout user={user} profile={profile}>
              <FacultyManagement profile={profile} />
            </Layout>
          ) : <Navigate to="/" />
        } />

        <Route path="/management" element={
          user && profile && profile.role === 'admin' ? (
            <Layout user={user} profile={profile}>
              <SubjectCourseManagement profile={profile} />
            </Layout>
          ) : <Navigate to="/" />
        } />

        <Route path="/profile" element={
          user && profile ? (
            <Layout user={user} profile={profile}>
              <Profile profile={profile} />
            </Layout>
          ) : <Navigate to="/login" />
        } />

        <Route path="/events" element={
          user && profile ? (
            <Layout user={user} profile={profile}>
              <EventsManagement profile={profile} />
            </Layout>
          ) : <Navigate to="/login" />
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
