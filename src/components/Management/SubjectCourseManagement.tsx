import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserProfile, Subject, Course, Department } from '../../types';
import { BookOpen, GraduationCap, Plus, Trash2, LayoutGrid, Layers, Users } from 'lucide-react';
import { motion } from 'motion/react';
import FacultyManagement from './FacultyManagement';

export default function SubjectCourseManagement({ profile }: { profile: UserProfile }) {
  const [activeTab, setActiveTab] = useState<'academic' | 'faculty'>('academic');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  const [newSubject, setNewSubject] = useState({ name: '', code: '', departmentId: '' });
  const [newCourse, setNewCourse] = useState({ name: '', code: '', departmentId: '' });

  useEffect(() => {
    const unsubSubjects = onSnapshot(collection(db, 'subjects'), (snap) => {
      setSubjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as Subject)));
    });
    const unsubCourses = onSnapshot(collection(db, 'courses'), (snap) => {
      setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() } as Course)));
    });
    const unsubDepts = onSnapshot(collection(db, 'departments'), (snap) => {
      setDepartments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Department)));
    });

    return () => {
      unsubSubjects();
      unsubCourses();
      unsubDepts();
    };
  }, []);

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.name || !newSubject.code || !newSubject.departmentId) return;
    await addDoc(collection(db, 'subjects'), newSubject);
    setNewSubject({ name: '', code: '', departmentId: '' });
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.name || !newCourse.code || !newCourse.departmentId) return;
    await addDoc(collection(db, 'courses'), newCourse);
    setNewCourse({ name: '', code: '', departmentId: '' });
  };

  const handleDelete = async (coll: string, id: string) => {
    if (!window.confirm('Are you sure?')) return;
    await deleteDoc(doc(db, coll, id));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Management Hub</h2>
          <p className="text-slate-500">Manage academic data and faculty members</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm self-start">
          <button
            onClick={() => setActiveTab('academic')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'academic' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <BookOpen size={16} />
            Academic
          </button>
          <button
            onClick={() => setActiveTab('faculty')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'faculty' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Users size={16} />
            Faculty
          </button>
        </div>
      </div>

      {activeTab === 'academic' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Subjects Section */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <BookOpen size={20} className="text-indigo-600" />
                Add New Subject
              </h3>
              <form onSubmit={handleAddSubject} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Subject Name"
                    value={newSubject.name}
                    onChange={e => setNewSubject({...newSubject, name: e.target.value})}
                    className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                  <input
                    type="text"
                    placeholder="Subject Code"
                    value={newSubject.code}
                    onChange={e => setNewSubject({...newSubject, code: e.target.value})}
                    className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <select
                  value={newSubject.departmentId}
                  onChange={e => setNewSubject({...newSubject, departmentId: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                >
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
                <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-2xl hover:bg-indigo-700 transition-all">
                  Add Subject
                </button>
              </form>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100">
                <h3 className="font-bold text-slate-900">Subject List</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {subjects.map(s => (
                  <div key={s.id} className="px-8 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-bold text-slate-900">{s.name}</p>
                      <p className="text-xs text-slate-500">{s.code} • {s.departmentId}</p>
                    </div>
                    <button onClick={() => handleDelete('subjects', s.id)} className="p-2 text-slate-300 hover:text-red-600 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Courses Section */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <GraduationCap size={20} className="text-indigo-600" />
                Add New Course
              </h3>
              <form onSubmit={handleAddCourse} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Course Name"
                    value={newCourse.name}
                    onChange={e => setNewCourse({...newCourse, name: e.target.value})}
                    className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                  <input
                    type="text"
                    placeholder="Course Code"
                    value={newCourse.code}
                    onChange={e => setNewCourse({...newCourse, code: e.target.value})}
                    className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <select
                  value={newCourse.departmentId}
                  onChange={e => setNewCourse({...newCourse, departmentId: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                >
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
                <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-2xl hover:bg-indigo-700 transition-all">
                  Add Course
                </button>
              </form>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100">
                <h3 className="font-bold text-slate-900">Course List</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {courses.map(c => (
                  <div key={c.id} className="px-8 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-bold text-slate-900">{c.name}</p>
                      <p className="text-xs text-slate-500">{c.code} • {c.departmentId}</p>
                    </div>
                    <button onClick={() => handleDelete('courses', c.id)} className="p-2 text-slate-300 hover:text-red-600 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <FacultyManagement />
      )}
    </div>
  );
}
