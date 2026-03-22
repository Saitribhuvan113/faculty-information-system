import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { CollegeEvent, UserProfile } from '../../types';
import { Calendar, Plus, Trash2, MapPin, Clock, AlertCircle, Loader2, Edit2, Undo2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EventsManagementProps {
  profile: UserProfile;
}

export default function EventsManagement({ profile }: EventsManagementProps) {
  const [events, setEvents] = useState<CollegeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CollegeEvent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const [lastDeleted, setLastDeleted] = useState<CollegeEvent | null>(null);

  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: ''
  });

  const canManage = profile.role === 'admin' || profile.role === 'hod';

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CollegeEvent[];
      setEvents(eventsData);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please check your permissions.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title || !eventForm.date) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingEvent) {
        await updateDoc(doc(db, 'events', editingEvent.id), {
          ...eventForm,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'events'), {
          ...eventForm,
          authorUid: profile.uid,
          createdAt: new Date().toISOString()
        });
      }
      setEventForm({ title: '', description: '', date: '', time: '', location: '' });
      setShowAddModal(false);
      setEditingEvent(null);
    } catch (err) {
      console.error('Error saving event:', err);
      setError('Failed to save event. Make sure you have sufficient privileges.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (event: CollegeEvent) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description || '',
      date: event.date,
      time: event.time || '',
      location: event.location || ''
    });
    setShowAddModal(true);
  };

  const handleDeleteEvent = async (event: CollegeEvent) => {
    try {
      setLastDeleted(event);
      await deleteDoc(doc(db, 'events', event.id));
      setShowUndo(true);
      setTimeout(() => setShowUndo(false), 5000);
    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Failed to delete event.');
    }
  };

  const handleUndo = async () => {
    if (!lastDeleted) return;
    try {
      const { id, ...data } = lastDeleted;
      await setDoc(doc(db, 'events', id), data);
      setShowUndo(false);
      setLastDeleted(null);
    } catch (err) {
      console.error('Error undoing delete:', err);
      setError('Failed to undo deletion.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Upcoming Events</h2>
          <p className="text-slate-500">Stay updated with college activities</p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              setEditingEvent(null);
              setEventForm({ title: '', description: '', date: '', time: '', location: '' });
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            <Plus size={20} />
            <span>Add Event</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.length > 0 ? (
          events.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative"
            >
              {canManage && (
                <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => handleEdit(event)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    title="Edit event"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(event)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Delete event"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-4">
                <Calendar size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{event.title}</h3>
              <p className="text-slate-600 text-sm mb-4 line-clamp-2">{event.description || 'No description provided.'}</p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar size={16} className="text-indigo-500" />
                  <span>{new Date(event.date).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                </div>
                {event.time && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Clock size={16} className="text-indigo-500" />
                    <span>{event.time}</span>
                  </div>
                )}
                {event.location && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <MapPin size={16} className="text-indigo-500" />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No upcoming events found</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">
                  {editingEvent ? 'Edit Event' : 'Add New Event'}
                </h3>
                <button 
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingEvent(null);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <Plus className="rotate-45" size={24} />
                </button>
              </div>

              <form onSubmit={handleAddEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Event Title *</label>
                  <input
                    required
                    type="text"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g., Annual Sports Meet"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    rows={3}
                    placeholder="Brief details about the event..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Date *</label>
                    <input
                      required
                      type="date"
                      value={eventForm.date}
                      onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Time</label>
                    <input
                      type="time"
                      value={eventForm.time}
                      onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g., College Auditorium"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingEvent(null);
                    }}
                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-semibold shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      editingEvent ? 'Update Event' : 'Create Event'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showUndo && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl"
          >
            <span className="text-sm font-medium">Event deleted</span>
            <div className="w-px h-4 bg-slate-700" />
            <button
              onClick={handleUndo}
              className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors text-sm font-bold"
            >
              <Undo2 size={16} />
              Undo
            </button>
            <button
              onClick={() => setShowUndo(false)}
              className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
