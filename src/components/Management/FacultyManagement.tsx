import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, doc, deleteDoc, onSnapshot, where, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserProfile, Department } from '../../types';
import { Users, Plus, Trash2, Mail, Phone, Info, Search, UserPlus, Edit2, RotateCcw, X as CloseIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function FacultyManagement({ profile }: { profile?: UserProfile }) {
  const [faculty, setFaculty] = useState<UserProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<UserProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastDeleted, setLastDeleted] = useState<UserProfile | null>(null);
  const [showUndo, setShowUndo] = useState(false);

  const isAdmin = profile?.role === 'admin';
  const isHOD = profile?.role === 'hod';
  const canManage = isAdmin || isHOD;

  // Form state
  const [newFaculty, setNewFaculty] = useState({
    email: '',
    displayName: '',
    phoneNumber: '',
    bio: '',
    departmentId: '',
    role: 'faculty' as const
  });

  useEffect(() => {
    const rolesToFetch = isAdmin ? ['faculty', 'hod', 'admin'] : ['faculty'];
    const unsubFaculty = onSnapshot(
      query(collection(db, 'users'), where('role', 'in', rolesToFetch)),
      (snap) => {
        setFaculty(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
      }
    );

    const unsubDepts = onSnapshot(collection(db, 'departments'), (snap) => {
      setDepartments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Department)));
    });

    return () => {
      unsubFaculty();
      unsubDepts();
    };
  }, []);

  const handleAddOrUpdateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingFaculty) {
        const { uid, ...data } = editingFaculty;
        await setDoc(doc(db, 'users', uid), {
          ...data,
          ...newFaculty
        }, { merge: true });
      } else {
        await addDoc(collection(db, 'users'), {
          ...newFaculty,
          uid: '', // Will be updated when user logs in
        });
      }
      setShowModal(false);
      setEditingFaculty(null);
      setNewFaculty({
        email: '',
        displayName: '',
        phoneNumber: '',
        bio: '',
        departmentId: '',
        role: 'faculty'
      });
    } catch (err) {
      console.error('Error saving user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (f: UserProfile) => {
    setEditingFaculty(f);
    setNewFaculty({
      email: f.email || '',
      displayName: f.displayName || '',
      phoneNumber: (f as any).phoneNumber || '',
      bio: (f as any).bio || '',
      departmentId: f.departmentId || '',
      role: f.role || 'faculty'
    });
    setShowModal(true);
  };

  const handleDelete = async (f: UserProfile) => {
    if (!window.confirm(`Are you sure you want to remove ${f.displayName}?`)) return;
    try {
      setLastDeleted(f);
      setShowUndo(true);
      await deleteDoc(doc(db, 'users', f.uid));
      
      // Auto-hide undo after 5 seconds
      setTimeout(() => {
        setShowUndo(false);
      }, 5000);
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  const handleUndoDelete = async () => {
    if (!lastDeleted) return;
    try {
      const { uid, ...data } = lastDeleted;
      await setDoc(doc(db, 'users', uid), data);
      setLastDeleted(null);
      setShowUndo(false);
    } catch (err) {
      console.error('Error undoing delete:', err);
    }
  };

  const filteredFaculty = faculty.filter(f => {
    const matchesSearch = f.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         f.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (isHOD && profile?.departmentId) {
      return matchesSearch && f.departmentId === profile.departmentId;
    }
    
    return matchesSearch;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{isAdmin ? 'User Management' : 'Faculty List'}</h2>
          <p className="text-slate-500">{isAdmin ? 'Add and manage faculty and HODs' : 'View department faculty'}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search faculty..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all w-64"
            />
          </div>
          {canManage && (
            <button
              onClick={() => {
                setEditingFaculty(null);
                setNewFaculty({
                  email: '',
                  displayName: '',
                  phoneNumber: '',
                  bio: '',
                  departmentId: isHOD ? (profile?.departmentId || '') : '',
                  role: 'faculty'
                });
                setShowModal(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
            >
              <UserPlus size={18} />
              Add Faculty
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFaculty.map((f) => (
          <motion.div
            key={f.uid}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative"
          >
            {canManage && (
              <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(f)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(f)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
            
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 text-2xl font-bold">
                  {f.displayName?.[0] || f.email?.[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900">{f.displayName}</h3>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${f.role === 'hod' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                      {f.role}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-600 font-medium uppercase tracking-wider">{f.departmentId || 'No Department'}</p>
                </div>
              </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail size={16} className="text-slate-400" />
                <span className="truncate">{f.email}</span>
              </div>
              {f.phoneNumber && (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Phone size={16} className="text-slate-400" />
                  <span>{f.phoneNumber}</span>
                </div>
              )}
              {f.bio && (
                <div className="flex items-start gap-3 text-sm text-slate-600">
                  <Info size={16} className="text-slate-400 mt-0.5" />
                  <p className="line-clamp-2">{f.bio}</p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
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
                <Trash2 size={20} />
              </div>
              <div>
                <p className="font-bold text-sm">Faculty member removed</p>
                <p className="text-slate-400 text-xs">{lastDeleted?.displayName}</p>
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

      {/* Add/Edit Faculty Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowModal(false);
                setEditingFaculty(null);
              }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-6">
                {editingFaculty ? 'Edit User Details' : 'Add New User'}
              </h3>
              <form onSubmit={handleAddOrUpdateFaculty} className="space-y-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                      <input
                        required
                        type="text"
                        value={newFaculty.displayName}
                        onChange={e => setNewFaculty({...newFaculty, displayName: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="e.g. Dr. John Smith"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Role</label>
                      <select
                        value={newFaculty.role}
                        onChange={e => setNewFaculty({...newFaculty, role: e.target.value as any})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        disabled={!isAdmin}
                      >
                        <option value="faculty">Faculty</option>
                        <option value="hod">HOD</option>
                        {isAdmin && <option value="admin">Admin</option>}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                    <input
                      required
                      type="email"
                      value={newFaculty.email}
                      onChange={e => setNewFaculty({...newFaculty, email: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="john.smith@university.edu"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={newFaculty.phoneNumber}
                        onChange={e => setNewFaculty({...newFaculty, phoneNumber: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="+1 234 567 890"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Department</label>
                      <select
                        value={newFaculty.departmentId}
                        onChange={e => setNewFaculty({...newFaculty, departmentId: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        disabled={isHOD}
                      >
                        <option value="">Select Dept</option>
                        {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Information / Bio</label>
                    <textarea
                      rows={3}
                      value={newFaculty.bio}
                      onChange={e => setNewFaculty({...newFaculty, bio: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                      placeholder="Brief information about the faculty member..."
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingFaculty(null);
                    }}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-2xl hover:bg-indigo-700 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : (editingFaculty ? 'Update User' : 'Add User')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
