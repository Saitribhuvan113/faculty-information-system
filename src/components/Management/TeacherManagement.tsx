import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Teacher, UserProfile } from '../../types';
import { UserPlus, Trash2, Info, BookOpen, User } from 'lucide-react';
import { motion } from 'motion/react';

export default function TeacherManagement({ profile }: { profile: UserProfile }) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [newName, setNewName] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newInformation, setNewInformation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'teachers'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teacherData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Teacher));
      setTeachers(teacherData);
    });

    return () => unsubscribe();
  }, []);

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newSubject || !newInformation) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'teachers'), {
        name: newName,
        subject: newSubject,
        information: newInformation,
        createdAt: new Date().toISOString()
      });
      setNewName('');
      setNewSubject('');
      setNewInformation('');
    } catch (error) {
      console.error('Error adding teacher:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this teacher?')) return;
    try {
      await deleteDoc(doc(db, 'teachers', id));
    } catch (error) {
      console.error('Error deleting teacher:', error);
    }
  };

  const canManage = profile.role === 'admin' || profile.role === 'hod';

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Teacher Management</h2>
          <p className="text-slate-500">View and manage teacher information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Teacher Form */}
        {canManage && (
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm sticky top-24">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <UserPlus size={20} className="text-indigo-600" />
                Add New Teacher
              </h3>
              <form onSubmit={handleAddTeacher} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Teacher Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder="Enter name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder="Enter subject"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Information</label>
                  <div className="relative">
                    <Info className="absolute left-3 top-3 text-slate-400" size={18} />
                    <textarea
                      placeholder="Enter additional information"
                      value={newInformation}
                      onChange={(e) => setNewInformation(e.target.value)}
                      rows={4}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 text-white font-bold py-3 rounded-2xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus size={20} />
                      Add Teacher
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Teacher List */}
        <div className={canManage ? "lg:col-span-2" : "lg:col-span-3"}>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Teacher List</h3>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full">
                {teachers.length} Total
              </span>
            </div>
            <div className="divide-y divide-slate-50">
              {teachers.length > 0 ? (
                teachers.map((teacher) => (
                  <motion.div
                    key={teacher.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-6 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                          <User size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-lg">{teacher.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase rounded-md">
                              {teacher.subject}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              Added on {new Date(teacher.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="mt-3 text-slate-600 text-sm leading-relaxed">
                            {teacher.information}
                          </p>
                        </div>
                      </div>
                      {canManage && (
                        <button
                          onClick={() => handleDeleteTeacher(teacher.id)}
                          className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          title="Delete Teacher"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <User size={32} />
                  </div>
                  <p className="text-slate-500 font-medium">No teachers added yet</p>
                  {canManage && <p className="text-slate-400 text-sm">Use the form to add your first teacher</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const Plus = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);
