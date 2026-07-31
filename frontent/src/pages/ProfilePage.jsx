import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  FiUser,
  FiMail,
  FiShield,
  FiCheckCircle,
  FiCamera,
  FiSave,
  FiClock,
  FiImage,
} from 'react-icons/fi';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
];

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result);
      toast.success('Avatar image uploaded!');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Full Name cannot be empty.');
      return;
    }

    setSaving(true);
    const result = await updateProfile({ name: name.trim(), avatar });
    setSaving(false);

    if (result.success) {
      toast.success('Profile updated successfully! 🎉');
    } else {
      toast.error(result.message || 'Failed to update profile.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto space-y-8 font-sans"
    >
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            Account Management
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
            <FiUser className="text-blue-500" /> My Account Profile
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Update your personal details, profile display photo, and account preferences.
          </p>
        </div>
      </div>

      {/* Main Profile Form Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-8">
        {/* Profile Avatar Showcase & Upload */}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-slate-950 border border-slate-800 rounded-2xl">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 p-1 shadow-xl">
              <div className="w-full h-full rounded-full bg-slate-900 overflow-hidden flex items-center justify-center text-white font-extrabold text-2xl">
                {avatar ? (
                  <img src={avatar} alt={name} className="w-full h-full object-cover" />
                ) : (
                  name?.charAt(0) || 'U'
                )}
              </div>
            </div>
            <label
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg cursor-pointer transition border-2 border-slate-900"
              title="Upload Photo"
            >
              <FiCamera className="w-4 h-4" />
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="space-y-1 text-center sm:text-left flex-1">
            <h3 className="text-lg font-bold text-white">{name || 'User Profile'}</h3>
            <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
              <FiMail className="text-slate-500" /> {user?.email}
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
              <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
                {user?.role || 'Member'}
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <FiCheckCircle className="w-3 h-3" /> Verified Account
              </span>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Email Field (Readonly) */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">
                Email Address (Registered)
              </label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-sm text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Avatar URL or Preset Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              Avatar Image URL or Presets
            </label>
            <div className="relative">
              <FiImage className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Preset Avatar Gallery */}
            <div className="pt-2">
              <p className="text-[11px] font-semibold text-slate-400 mb-2">
                Or select a curated profile photo preset:
              </p>
              <div className="flex flex-wrap gap-3">
                {AVATAR_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatar(preset)}
                    className={`w-11 h-11 rounded-full overflow-hidden border-2 transition ${
                      avatar === preset
                        ? 'border-blue-500 scale-110 shadow-lg shadow-blue-500/30'
                        : 'border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <img src={preset} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Account Readonly Info Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs">
            <div>
              <span className="text-slate-500 block">Account Role</span>
              <span className="font-bold text-white mt-0.5 block">{user?.role}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Approval Status</span>
              <span className="font-bold text-emerald-400 mt-0.5 block">Active / Verified</span>
            </div>
            <div>
              <span className="text-slate-500 block">User Account ID</span>
              <span className="font-mono text-blue-400 text-[11px] mt-0.5 block truncate">
                {user?._id}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="py-3 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2"
            >
              <FiSave className="w-4 h-4" />
              {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default ProfilePage;
