import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiBookOpen, FiUser, FiCalendar, FiAward, FiAlertCircle, FiArrowLeft } from 'react-icons/fi';
import api from '../services/api';

const VerifyCertificate = () => {
  const { certificateId } = useParams();
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const performVerification = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get(`/certificates/verify/${certificateId}`);
        if (res.data && res.data.valid) {
          setVerificationData(res.data.data);
        } else {
          setError(res.data?.message || 'Certificate verification failed');
        }
      } catch (err) {
        console.error('Verification error:', err);
        setError(err.response?.data?.message || 'Invalid certificate code or certificate not found');
      } finally {
        setLoading(false);
      }
    };

    if (certificateId) {
      performVerification();
    }
  }, [certificateId]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header Bar */}
      <header className="bg-slate-900 border-b border-slate-800 py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 text-2xl font-extrabold tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/40 border border-indigo-400/30">
              <FiBookOpen className="w-6 h-6" />
            </div>
            <span className="text-2xl font-extrabold text-white">
              Edu<span className="text-blue-400">Verse</span>
            </span>
          </Link>

          <Link
            to="/"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-2"
          >
            <FiArrowLeft /> Back to Home
          </Link>
        </div>
      </header>

      {/* Main Body Content */}
      <main className="max-w-3xl w-full mx-auto px-4 py-12 flex-1 flex items-center justify-center">
        {loading ? (
          <div className="p-16 text-center bg-slate-900 border border-slate-800 rounded-3xl w-full">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-300 font-semibold text-sm">Verifying certificate credentials...</p>
            <p className="text-slate-500 text-xs mt-1">Checking EduVerse global registry</p>
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 md:p-12 text-center bg-slate-900 border border-rose-500/30 rounded-3xl w-full space-y-4 shadow-2xl"
          >
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center text-3xl mx-auto">
              <FiAlertCircle />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Certificate Verification Failed</h2>
              <p className="text-slate-400 text-xs max-w-md mx-auto mt-2 leading-relaxed">
                {error}
              </p>
            </div>
            <p className="text-xs text-slate-500 font-mono">CODE: {certificateId}</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl"
          >
            {/* Status Header Banner */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 p-6 md:p-8 text-white text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl mx-auto shadow-md">
                <FiCheckCircle />
              </div>
              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-wider">
                Official EduVerse Verification
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Authentic & Verified Certificate ✓
              </h1>
              <p className="text-xs text-emerald-100 font-medium">
                This credential is confirmed to be genuine and issued by EduVerse LMS.
              </p>
            </div>

            {/* Verification Details */}
            <div className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <FiUser className="text-indigo-400" /> Student / Recipient
                  </span>
                  <p className="text-base font-extrabold text-white">{verificationData?.studentName}</p>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <FiAward className="text-amber-400" /> Certificate ID
                  </span>
                  <p className="text-base font-extrabold text-amber-400 font-mono">{verificationData?.certificateId}</p>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 md:col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <FiBookOpen className="text-blue-400" /> Accredited Course Title
                  </span>
                  <p className="text-base md:text-lg font-extrabold text-indigo-400">{verificationData?.courseTitle}</p>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <FiUser className="text-purple-400" /> Lead Instructor
                  </span>
                  <p className="text-sm font-extrabold text-slate-200">{verificationData?.instructorName}</p>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <FiCalendar className="text-emerald-400" /> Date of Issuance
                  </span>
                  <p className="text-sm font-extrabold text-slate-200">{formatDate(verificationData?.issueDate)}</p>
                </div>
              </div>

              {/* Security Footer Notice */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-[11px] text-slate-400 text-center leading-relaxed">
                🛡️ Verified via EduVerse cryptographic certificate registry. All learning metrics, progress percentage (100%), and assessment scores were authenticated upon issuance.
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        Copyright © 2026 EduVerse LMS. All Rights Reserved.
      </footer>
    </div>
  );
};

export default VerifyCertificate;
