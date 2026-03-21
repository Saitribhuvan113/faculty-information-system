import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserProfile } from '../../types';
import { User, Mail, Camera, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Profile({ profile }: { profile: UserProfile }) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(profile.profilePhotoUrl || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        displayName,
        profilePhotoUrl
      });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">My Profile</h2>
        <p className="text-slate-500">Manage your personal information and account settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center">
            <div className="relative inline-block mb-6">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-50 shadow-inner bg-slate-100 flex items-center justify-center">
                {profilePhotoUrl ? (
                  <img 
                    src={profilePhotoUrl} 
                    alt={displayName} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User size={48} className="text-slate-300" />
                )}
              </div>
              <div className="absolute bottom-0 right-0 p-2 bg-indigo-600 rounded-full text-white shadow-lg border-2 border-white">
                <Camera size={16} />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900">{displayName}</h3>
            <p className="text-sm text-indigo-600 font-semibold capitalize mt-1">{profile.role}</p>
            <div className="mt-6 pt-6 border-t border-slate-50 flex flex-col gap-3">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail size={16} className="text-slate-400" />
                <span className="truncate">{profile.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <User size={16} className="text-slate-400" />
                <span>{profile.departmentId || 'Computer Engineering'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Edit Information</h3>
            
            {message.text && (
              <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 text-sm ${
                message.type === 'success' ? 'bg-emerald-50 border border-emerald-100 text-emerald-600' : 'bg-red-50 border border-red-100 text-red-600'
              }`}>
                {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <p>{message.text}</p>
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={profile.email}
                    className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-slate-500 cursor-not-allowed outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 ml-1">Email cannot be changed</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Profile Photo URL</label>
                <div className="relative">
                  <input
                    type="url"
                    value={profilePhotoUrl}
                    onChange={(e) => setProfilePhotoUrl(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 ml-1">Paste a direct link to an image</p>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Save size={20} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
