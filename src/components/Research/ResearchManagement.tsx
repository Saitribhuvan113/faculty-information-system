import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, onSnapshot, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserProfile, ResearchPublication } from '../../types';
import { GraduationCap, Plus, FileText, ExternalLink, Trash2, AlertCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ResearchManagement({ profile }: { profile: UserProfile }) {
  const [publications, setPublications] = useState<ResearchPublication[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pubDate, setPubDate] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  useEffect(() => {
    let researchQuery;
    if (profile.role === 'admin') {
      researchQuery = query(collection(db, 'research'));
    } else {
      researchQuery = query(collection(db, 'research'), where('facultyUid', '==', profile.uid));
    }

    const unsubscribe = onSnapshot(researchQuery, (snapshot) => {
      setPublications(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ResearchPublication)));
    });

    return () => unsubscribe();
  }, [profile.uid, profile.role]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await addDoc(collection(db, 'research'), {
        facultyUid: profile.uid,
        title,
        description,
        publicationDate: pubDate,
        fileUrl,
        citations: 0
      });
      setShowAddModal(false);
      // Reset form
      setTitle('');
      setDescription('');
      setPubDate('');
      setFileUrl('');
    } catch (err: any) {
      setError(err.message || 'Failed to add publication');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this publication?')) return;
    try {
      await deleteDoc(doc(db, 'research', id));
    } catch (err) {
      console.error('Error deleting research:', err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Research & Publications</h2>
          <p className="text-slate-500">Track academic research and papers</p>
        </div>
        {profile.role === 'faculty' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
          >
            <Plus size={20} />
            Add Publication
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {publications.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-3xl border border-dashed border-slate-200 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
              <GraduationCap size={32} />
            </div>
            <p className="text-slate-500">No research publications found</p>
          </div>
        ) : (
          publications.map((pub) => (
            <motion.div
              layout
              key={pub.id}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <FileText size={24} />
                </div>
                {(profile.role === 'admin' || profile.uid === pub.facultyUid) && (
                  <button
                    onClick={() => handleDelete(pub.id)}
                    className="p-2 text-slate-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
              <h3 className="font-bold text-slate-900 mb-2 line-clamp-2">{pub.title}</h3>
              <p className="text-sm text-slate-500 mb-4 line-clamp-3">{pub.description || 'No description provided.'}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                <div className="text-xs font-semibold text-slate-400">
                  {pub.publicationDate}
                </div>
                {pub.fileUrl && (
                  <a
                    href={pub.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                  >
                    View Paper
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add Publication Modal */}
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
                <h3 className="text-xl font-bold text-slate-900">Add Publication</h3>
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

              <form onSubmit={handleAdd} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Paper Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="Enter the title of your research paper"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Publication Date</label>
                  <input
                    type="date"
                    required
                    value={pubDate}
                    onChange={(e) => setPubDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                    placeholder="Brief abstract or description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Paper URL (Google Drive/Dropbox link)</label>
                  <input
                    type="url"
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="https://..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Add Publication'
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
