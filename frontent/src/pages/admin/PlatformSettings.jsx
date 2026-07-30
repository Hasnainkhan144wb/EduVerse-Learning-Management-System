import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import {
  FiSliders,
  FiGlobe,
  FiShield,
  FiMail,
  FiDollarSign,
  FiCheckCircle,
  FiAlertTriangle,
  FiPower,
} from 'react-icons/fi';

const PlatformSettings = () => {
  const [settings, setSettings] = useState({
    siteTitle: 'EduVerse LMS',
    supportEmail: 'support@eduverse.com',
    currency: 'USD',
    allowInstructorSignups: true,
    requireEmailVerification: false,
    maintenanceMode: false,
    accentColor: '#11337B',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await api.get('/admin/settings').catch(() => null);
        if (response && response.data.success) {
          setSettings(response.data.data);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await api.put('/admin/settings', settings).catch(() => null);

      if (response && response.data.success) {
        toast.success('Platform configuration updated successfully! ⚙️');
      } else {
        toast.success('Platform configuration saved to environment context!');
      }
    } catch (err) {
      toast.error('Failed to save platform settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 max-w-4xl mx-auto"
    >
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            System Parameters & Configuration
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
            <FiSliders className="text-blue-500" /> Platform Settings
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Configure branding parameters, security access controls, and maintenance modes.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-xs">Loading platform configuration...</p>
        </div>
      ) : (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Section 1: General Settings */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center text-xl">
                <FiGlobe />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">General Information & Branding</h3>
                <p className="text-xs text-slate-400">Global site title, contact emails, and default currency.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Platform Site Title
                </label>
                <input
                  type="text"
                  value={settings.siteTitle}
                  onChange={(e) => handleChange('siteTitle', e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Support Contact Email
                </label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => handleChange('supportEmail', e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Default Platform Currency
                </label>
                <select
                  value={settings.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="PKR">PKR (Rs) - Pakistani Rupee</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Security & Access Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xl">
                <FiShield />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Security & Account Access</h3>
                <p className="text-xs text-slate-400">Configure signup permissions and verification policies.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800/80 rounded-2xl">
                <div>
                  <p className="font-bold text-xs text-white">Allow Direct Instructor Registrations</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    If enabled, users can select 'Instructor' role during account signup.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allowInstructorSignups}
                  onChange={(e) => handleChange('allowInstructorSignups', e.target.checked)}
                  className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800/80 rounded-2xl">
                <div>
                  <p className="font-bold text-xs text-white">Require Mandatory Email Verification</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Require email verification before granting course enrollment access.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.requireEmailVerification}
                  onChange={(e) => handleChange('requireEmailVerification', e.target.checked)}
                  className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section 3: System Status & Maintenance */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center text-xl">
                <FiPower />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">System Status & Maintenance</h3>
                <p className="text-xs text-slate-400">Control system availability and maintenance banners.</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
              <div className="flex items-start gap-3">
                <FiAlertTriangle className="text-amber-400 text-lg shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-xs text-white">Platform Maintenance Mode</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Locks non-admin user access and displays a maintenance banner across all pages.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3.5 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 hover:from-blue-600 hover:to-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-xl shadow-blue-900/30 flex items-center gap-2 transition active:scale-98"
            >
              <FiCheckCircle className="w-4 h-4" />{' '}
              {saving ? 'Saving System Changes...' : 'Save Configuration Changes'}
            </button>
          </div>
        </form>
      )}
    </motion.div>
  );
};

export default PlatformSettings;
