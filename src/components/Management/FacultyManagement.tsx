import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, doc, deleteDoc, onSnapshot, where, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserProfile, Department } from '../../types';
import { Users, Plus, Trash2, Mail, Phone, Info, Search, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function FacultyManagement() {
  const [faculty, setFaculty] = useState<UserProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
    const unsubFaculty = onSnapshot(
      query(collection(db, 'users'), where('role', '==', 'faculty')),
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

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Since we don't have the UID yet (user hasn't signed up), 
      // we'll use the email as a temporary ID or just a random ID.
      // Better to use a random ID if we want to allow multiple profiles with same email (though that's unlikely).
      // Actually, if we use setDoc with a specific ID, we can pre-provision.
      // But for now, let's just add to 'users' collection.
      await addDoc(collection(db, 'users'), {
        ...newFaculty,
        uid: '', // Will be updated when user logs in
      });
      setShowAddModal(false);
      setNewFaculty({
        email: '',
        displayName: '',
        phoneNumber: '',
        bio: '',
        departmentId: '',
        role: 'faculty'
      });
    } catch (err) {
      console.error('Error adding faculty:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (uid: string) => {
    if (!window.confirm('Are you sure you want to remove this faculty member?')) return;
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (err) {
      console.error('Error deleting faculty:', err);
    }
  };

  const filteredFaculty = faculty.filter(f => 
    f.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Faculty Management</h2>
          <p className="text-slate-500">Add and manage faculty teachers</p>
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
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
          >
            <UserPlus size={18} />
            Add Faculty
          </button>
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
            <button
              onClick={() => handleDelete(f.uid)}
              className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={18} />
            </button>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 text-2xl font-bold">
                {f.displayName?.[0] || f.email?.[0].toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{f.displayName}</h3>
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

      {/* Add Faculty Modal */}
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
              <h3 className="text-xl font-bold text-slate-900 mb-6">Add New Faculty</h3>
              <form onSubmit={handleAddFaculty} className="space-y-4">
                <div className="space-y-4">
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
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-2xl hover:bg-indigo-700 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add Faculty'}
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
