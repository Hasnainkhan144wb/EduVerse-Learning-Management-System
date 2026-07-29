import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import {
  FiAward,
  FiDownload,
  FiEye,
  FiCheckCircle,
  FiX,
  FiExternalLink,
  FiCalendar,
  FiShield,
} from 'react-icons/fi';

const StudentCertificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewCert, setPreviewCert] = useState(null);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const response = await api.get('/certificates/my-certificates');
        if (response.data.success) {
          setCertificates(response.data.data);
        }
      } catch (err) {
        console.error('Failed to load certificates:', err);
        toast.error('Failed to load certificates');
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-6 md:p-8 rounded-3xl text-white shadow-2xl shadow-purple-600/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            Verified Achievements
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold">My Learning Certificates 🏆</h1>
          <p className="text-purple-100 text-sm mt-1">
            Official accredited certificates earned upon 100% course completion.
          </p>
        </div>
      </div>

      {/* Certificates List */}
      {loading ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading your verified certificates...</p>
        </div>
      ) : certificates.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <div className="w-16 h-16 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center mx-auto text-3xl">
            <FiAward />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No Certificates Earned Yet</h3>
            <p className="text-slate-400 text-sm mt-1">
              Complete 100% of a course curriculum and pass all quizzes to unlock your certificate.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert) => {
            const course = cert.courseId || {};
            const pdfFullUrl = `http://localhost:5000${cert.certificateUrl}`;

            return (
              <motion.div
                key={cert._id}
                whileHover={{ y: -4 }}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Top Bar: Icon & ID */}
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-2xl border border-purple-500/20">
                      <FiAward />
                    </div>
                    <span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-full text-xs font-mono font-semibold text-purple-400">
                      ID: {cert.certificateId}
                    </span>
                  </div>

                  {/* Course Title & Date */}
                  <div>
                    <h3 className="text-lg font-bold text-white line-clamp-1">
                      {course.title || 'Course Certificate'}
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                      <span className="flex items-center gap-1.5">
                        <FiCalendar className="text-slate-500" />
                        Issued: {new Date(cert.issueDate).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <FiShield /> Verified
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => setPreviewCert(cert)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition"
                  >
                    <FiEye /> Preview
                  </button>
                  <a
                    href={pdfFullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition"
                  >
                    <FiDownload /> Download PDF
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* PREVIEW MODAL */}
      <AnimatePresence>
        {previewCert && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-semibold text-purple-400 uppercase">
                    Certificate Verification Preview
                  </span>
                  <h2 className="text-xl font-bold text-white">
                    {previewCert.courseId?.title || 'Course Certificate'}
                  </h2>
                </div>
                <button
                  onClick={() => setPreviewCert(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Styled Certificate Graphic Preview */}
              <div className="p-8 bg-slate-950 border-2 border-indigo-500/40 rounded-2xl text-center space-y-4 relative overflow-hidden">
                <div className="w-16 h-16 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center mx-auto text-3xl border border-purple-500/30">
                  <FiAward />
                </div>
                <h3 className="text-2xl font-extrabold text-white">EduVerse LMS</h3>
                <p className="text-xs text-slate-400 uppercase tracking-widest">
                  CERTIFICATE OF COMPLETION
                </p>

                <div className="py-2">
                  <p className="text-sm text-slate-400">This certifies that</p>
                  <p className="text-xl font-extrabold text-white mt-1">Learner</p>
                  <p className="text-sm text-slate-400 mt-2">has successfully completed</p>
                  <p className="text-lg font-bold text-indigo-400 mt-1">
                    "{previewCert.courseId?.title}"
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Certificate ID: {previewCert.certificateId}</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <FiCheckCircle /> Authenticity Verified
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setPreviewCert(null)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
                >
                  Close
                </button>
                <a
                  href={`http://localhost:5000${previewCert.certificateUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2 transition"
                >
                  <FiExternalLink /> Open Official PDF
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StudentCertificates;
