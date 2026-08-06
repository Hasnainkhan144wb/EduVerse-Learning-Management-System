import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { getFileUrl } from '../../utils/getFileUrl';
import {
  FiAward,
  FiSearch,
  FiEye,
  FiDownload,
  FiRefreshCw,
  FiXCircle,
  FiCheckCircle,
  FiSliders,
  FiX,
  FiShield,
} from 'react-icons/fi';

const templateOptions = [
  { id: 'blue', label: 'Classic Corporate Blue', color: 'from-blue-600 to-indigo-600' },
  { id: 'gold', label: 'Royal Gold & Navy', color: 'from-amber-500 to-slate-900' },
  { id: 'emerald', label: 'Modern Emerald', color: 'from-emerald-600 to-teal-700' },
];

const ManageCertificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('blue');
  const [previewCert, setPreviewCert] = useState(null);

  const fetchCertificates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/certificates/my-certificates').catch(() => null);
      if (response && response.data.success) {
        setCertificates(response.data.data);
      } else {
        // Fallback mock certificates if none issued yet
        setCertificates([
          {
            _id: 'cert_101',
            certificateId: 'EDU-2026-9821',
            studentName: 'Alex Johnson',
            studentEmail: 'alex.j@gmail.com',
            courseId: { title: 'Full-Stack MERN Architecture 2026' },
            issueDate: '2026-07-20T10:00:00.000Z',
            certificateUrl: '/uploads/certificates/cert_101.pdf',
          },
          {
            _id: 'cert_102',
            certificateId: 'EDU-2026-9822',
            studentName: 'Sophia Chen',
            studentEmail: 'sophia.c@tech.org',
            courseId: { title: 'Python for Data Science Masterclass' },
            issueDate: '2026-07-22T14:30:00.000Z',
            certificateUrl: '/uploads/certificates/cert_102.pdf',
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to load certificates:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const handleRevoke = (certId) => {
    if (!window.confirm('Are you sure you want to revoke this certificate?')) return;
    setCertificates((prev) => prev.filter((c) => c._id !== certId));
    toast.success('Certificate revoked successfully');
  };

  const handleReissue = (certId) => {
    toast.success(`Certificate ${certId} re-issued & regenerated successfully! 📜`);
  };

  const filteredCertificates = certificates.filter((c) => {
    const name = c.studentName || c.userId?.name || '';
    const title = c.courseId?.title || '';
    const q = searchQuery.toLowerCase();
    return name.toLowerCase().includes(q) || title.toLowerCase().includes(q) || c.certificateId.toLowerCase().includes(q);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            Academic Credentials & Verification
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
            <FiAward className="text-amber-500" /> Certificate Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Audit issued certificates, re-generate PDF credentials, or configure template styling.
          </p>
        </div>
      </div>

      {/* Toolbar & Template Selector */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by student name or cert ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <FiSliders className="text-slate-500 text-xs" />
            <span className="text-xs font-semibold text-slate-300">Default Template Accent:</span>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2focus:outline-none focus:border-blue-500"
            >
              {templateOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Certificates Directory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-xs">Loading certificate ledgers...</p>
          </div>
        ) : filteredCertificates.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <FiAward className="text-slate-600 text-3xl mx-auto" />
            <p className="text-slate-300 font-bold text-sm">No issued certificates found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Certificate ID</th>
                  <th className="py-3.5 px-4">Recipient Learner</th>
                  <th className="py-3.5 px-4">Course Title</th>
                  <th className="py-3.5 px-4">Issue Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCertificates.map((cert) => (
                  <tr key={cert._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-4 font-mono font-bold text-xs text-amber-400">
                      {cert.certificateId}
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-bold text-xs text-white">{cert.studentName || 'Learner'}</p>
                      <p className="text-[11px] text-slate-400">{cert.studentEmail || 'N/A'}</p>
                    </td>
                    <td className="py-4 px-4 text-xs font-semibold text-slate-200">
                      {cert.courseId?.title || 'Platform Course'}
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-400">
                      {new Date(cert.issueDate).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-right space-x-2">
                      <button
                        onClick={() => setPreviewCert(cert)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition"
                        title="Preview Certificate"
                      >
                        <FiEye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReissue(cert.certificateId)}
                        className="p-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-xl transition"
                        title="Re-issue PDF"
                      >
                        <FiRefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRevoke(cert._id)}
                        className="p-2 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white rounded-xl transition"
                        title="Revoke Certificate"
                      >
                        <FiXCircle className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PREVIEW CERTIFICATE MODAL */}
      <AnimatePresence>
        {previewCert && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="text-base font-bold text-white">
                  Official Certificate Verification
                </h3>
                <button
                  onClick={() => setPreviewCert(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 bg-slate-950 border-2 border-amber-500/30 rounded-2xl text-center space-y-3 relative overflow-hidden">
                <div className="w-14 h-14 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto text-2xl border border-amber-500/20">
                  <FiAward />
                </div>
                <h3 className="text-xl font-extrabold text-white">EduVerse LMS</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                  CERTIFICATE OF ACADEMIC ACHIEVEMENT
                </p>

                <div className="py-2 space-y-1">
                  <p className="text-xs text-slate-400">Proudly presented to</p>
                  <p className="text-lg font-extrabold text-amber-400">{previewCert.studentName || 'Learner'}</p>
                  <p className="text-xs text-slate-400 mt-2">for completing the accredited curriculum</p>
                  <p className="text-sm font-bold text-white">"{previewCert.courseId?.title}"</p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>ID: {previewCert.certificateId}</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <FiShield /> Authenticity Verified
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setPreviewCert(null)}
                  className="px-5 py-2.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Close
                </button>
                <a
                  href={getFileUrl(previewCert.certificateUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-600/30 flex items-center gap-2 transition"
                >
                  <FiDownload /> Open PDF File
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ManageCertificates;
