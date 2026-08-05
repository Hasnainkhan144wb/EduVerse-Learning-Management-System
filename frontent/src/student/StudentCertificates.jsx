import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import { getFileUrl } from '../utils/getFileUrl';
import { formatLearningTime } from '../utils/formatLearningTime';
import {
  FiAward,
  FiDownload,
  FiEye,
  FiShare2,
  FiSearch,
  FiFilter,
  FiCheckCircle,
  FiBookOpen,
  FiUser,
  FiCalendar,
  FiClock,
  FiPrinter,
  FiX,
  FiArrowRight,
} from 'react-icons/fi';

const StudentCertificates = () => {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search, Filter & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  // Preview Modal state
  const [activeCert, setActiveCert] = useState(null);

  // Fetch certificates on mount
  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setLoading(true);
        const res = await api.get('/certificates');
        if (res.data && res.data.success) {
          setCertificates(res.data.data || res.data.certificates || []);
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

  // Filter & Sort Certificates
  const filteredCertificates = useMemo(() => {
    return certificates
      .filter((cert) => {
        const titleMatch = cert.course?.title?.toLowerCase().includes(searchQuery.toLowerCase());
        const instructorMatch = cert.course?.instructorName?.toLowerCase().includes(searchQuery.toLowerCase());
        const certIdMatch = cert.certificateId?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSearch = !searchQuery || titleMatch || instructorMatch || certIdMatch;

        const certYear = new Date(cert.issueDate || cert.createdAt).getFullYear().toString();
        const matchesYear = selectedYear === 'All' || certYear === selectedYear;

        return matchesSearch && matchesYear;
      })
      .sort((a, b) => {
        const dateA = new Date(a.issueDate || a.createdAt);
        const dateB = new Date(b.issueDate || b.createdAt);
        return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
      });
  }, [certificates, searchQuery, selectedYear, sortBy]);

  // Extract unique issue years for filter dropdown
  const availableYears = useMemo(() => {
    const years = new Set(
      certificates.map((c) => new Date(c.issueDate || c.createdAt).getFullYear().toString())
    );
    return ['All', ...Array.from(years).sort().reverse()];
  }, [certificates]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Download PDF asset handler
  const handleDownloadPDF = async (cert) => {
    try {
      toast.loading('Preparing PDF download...', { id: 'download-pdf' });
      const backendBase = import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace('/api', '')
        : 'http://localhost:5000';
      const pdfUrl = `${backendBase}${cert.certificateUrl}`;

      // Open PDF asset in new window or trigger download link
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.target = '_blank';
      link.download = `EduVerse-Certificate-${cert.certificateId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Certificate PDF ready for download!', { id: 'download-pdf' });
    } catch (err) {
      toast.error('Failed to download PDF certificate', { id: 'download-pdf' });
    }
  };

  // Share Verification URL handler
  const handleShareCertificate = (certId) => {
    const verifyUrl = `${window.location.origin}/verify-certificate/${certId}`;
    navigator.clipboard.writeText(verifyUrl);
    toast.success('Verification URL copied to clipboard! 📋');
  };

  // Print Certificate Modal
  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 font-sans"
    >
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            Student Portal • Verified Credentials
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
            <FiAward className="text-amber-400" /> My Learning Certificates ({certificates.length})
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Official accredited certificates earned upon 100% course completion. Download, view, and share credentials.
          </p>
        </div>

        <Link
          to="/courses"
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 shrink-0"
        >
          <FiBookOpen /> Browse Catalog
        </Link>
      </div>

      {/* Filter & Search Bar */}
      {certificates.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full md:max-w-md">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by course name, instructor, or certificate ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Year Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <FiFilter className="text-indigo-400" />
              <span>Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Certificates List Grid */}
      {loading ? (
        <div className="p-16 text-center bg-slate-900 border border-slate-800 rounded-3xl">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-xs font-semibold">Loading your verified certificates...</p>
        </div>
      ) : certificates.length === 0 ? (
        /* EMPTY STATE */
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-3xl mx-auto border border-amber-500/20">
            <FiAward />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">No Certificates Available Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
              Complete your enrolled courses to earn professional certificates that you can download and share with employers.
            </p>
          </div>
          <Link
            to="/courses"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-lg inline-flex items-center gap-2"
          >
            Browse Courses <FiArrowRight />
          </Link>
        </div>
      ) : filteredCertificates.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-400 text-xs">
          No certificates matched your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCertificates.map((cert) => {
            const course = cert.course || {};
            return (
              <div
                key={cert._id}
                className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl hover:border-amber-500/40 transition flex flex-col justify-between group"
              >
                {/* Thumbnail Header */}
                <div className="h-44 bg-slate-950 relative overflow-hidden">
                  <img
                    src={getFileUrl(course.thumbnail)}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop';
                    }}
                  />
                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 bg-amber-500 text-slate-950 font-extrabold text-[10px] uppercase rounded-full shadow-lg flex items-center gap-1">
                      <FiCheckCircle className="w-3 h-3" /> VERIFIED
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-3 text-[10px] font-mono font-bold text-slate-300 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded border border-slate-700">
                    ID: {cert.certificateId}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                      {course.categoryName || 'Accredited Course'}
                    </span>
                    <h3 className="text-base font-bold text-white line-clamp-2 leading-snug">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                      <FiUser className="text-slate-500" /> Instructor: <strong className="text-slate-200">{course.instructorName}</strong>
                    </p>
                  </div>

                  {/* Metadata Row */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-800">
                    <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                        <FiCalendar className="text-emerald-400" /> Issued Date
                      </span>
                      <p className="font-bold text-slate-200">{formatDate(cert.issueDate)}</p>
                    </div>

                    <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                        <FiClock className="text-indigo-400" /> Learning Time
                      </span>
                      <p className="font-bold text-slate-200">{formatLearningTime(cert.totalSecondsSpent)}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-1">
                    <button
                      onClick={() => setActiveCert(cert)}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                    >
                      <FiEye className="w-4 h-4" /> View Certificate
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadPDF(cert)}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1 border border-slate-700"
                      >
                        <FiDownload className="w-3.5 h-3.5" /> PDF
                      </button>

                      <button
                        onClick={() => handleShareCertificate(cert.certificateId)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl transition border border-slate-700"
                        title="Share Verification Link"
                      >
                        <FiShare2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Coursera / Udemy Style Premium Certificate Modal */}
      <AnimatePresence>
        {activeCert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-4xl w-full shadow-2xl space-y-6 relative my-8 print:border-none print:shadow-none print:p-0 print:my-0 print:bg-white"
            >
              {/* Modal Actions Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 print:hidden">
                <div className="flex items-center gap-2 text-white font-extrabold text-sm md:text-base">
                  <FiAward className="text-amber-400 w-5 h-5" />
                  <span>Official EduVerse Certificate</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePrintCertificate}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-1 border border-slate-700"
                  >
                    <FiPrinter /> Print
                  </button>

                  <button
                    onClick={() => handleDownloadPDF(activeCert)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-indigo-500 text-white text-xs font-extrabold rounded-xl shadow-md transition flex items-center gap-1"
                  >
                    <FiDownload /> Download PDF
                  </button>

                  <button
                    onClick={() => setActiveCert(null)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* HIGH RESOLUTION CERTIFICATE GRAPHIC BOX */}
              <div
                id="certificate-print-area"
                className="bg-white text-slate-900 p-8 md:p-12 rounded-2xl border-8 border-double border-amber-500 shadow-2xl relative overflow-hidden font-serif select-none print:border-8 print:border-amber-600 print:rounded-none"
              >
                {/* Watermark Logo Background */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                  <FiAward className="w-96 h-96 text-indigo-900" />
                </div>

                {/* Top Branding Header */}
                <div className="text-center space-y-2 border-b-2 border-amber-500/40 pb-6 relative z-10">
                  <div className="flex items-center justify-center gap-2 text-2xl font-black font-sans tracking-tight text-slate-900">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow">
                      EV
                    </div>
                    <span>EduVerse LMS</span>
                  </div>
                  <p className="text-xs font-sans uppercase font-bold tracking-widest text-indigo-900">
                    Professional Learning Management System
                  </p>
                </div>

                {/* Main Certificate Title */}
                <div className="text-center my-8 space-y-3 relative z-10">
                  <h2 className="text-2xl md:text-4xl font-extrabold tracking-widest text-slate-900 uppercase font-sans">
                    Certificate of Completion
                  </h2>
                  <p className="text-xs md:text-sm text-slate-600 italic">
                    This official certificate is proudly presented to
                  </p>

                  {/* Student Full Name */}
                  <h3 className="text-2xl md:text-4xl font-bold text-indigo-900 underline decoration-amber-500 decoration-2 underline-offset-8 py-2 font-sans">
                    {activeCert.studentName}
                  </h3>

                  <p className="text-xs md:text-sm text-slate-600 italic pt-2">
                    for successfully completing the accredited course
                  </p>

                  {/* Course Title */}
                  <h4 className="text-xl md:text-2xl font-black text-slate-900 font-sans max-w-2xl mx-auto leading-tight">
                    "{activeCert.course?.title}"
                  </h4>
                </div>

                {/* Course Metadata Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center my-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-sans relative z-10">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Instructor</span>
                    <strong className="text-slate-800 text-xs">{activeCert.course?.instructorName}</strong>
                  </div>

                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Learning Time</span>
                    <strong className="text-slate-800 text-xs">{formatLearningTime(activeCert.totalSecondsSpent)}</strong>
                  </div>

                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Quiz Avg. Score</span>
                    <strong className="text-slate-800 text-xs">{activeCert.quizAvgScore || 100}%</strong>
                  </div>

                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Overall Progress</span>
                    <strong className="text-emerald-700 text-xs">100% Complete ✓</strong>
                  </div>
                </div>

                {/* Footer Section: QR Code, Certificate Info & Signatures */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t-2 border-amber-500/40 relative z-10 font-sans">
                  {/* QR Code & Verification ID */}
                  <div className="flex items-center gap-3 text-left">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                        `${window.location.origin}/verify-certificate/${activeCert.certificateId}`
                      )}`}
                      alt="Certificate Verification QR Code"
                      className="w-16 h-16 border rounded p-0.5 bg-white"
                    />
                    <div className="text-[10px] text-slate-500 space-y-0.5">
                      <p className="font-mono font-bold text-slate-800">ID: {activeCert.certificateId}</p>
                      <p>Issued: {formatDate(activeCert.issueDate)}</p>
                      <p className="text-emerald-700 font-bold">Status: VERIFIED & AUTHENTIC ✓</p>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="flex items-center gap-8 text-center text-xs">
                    <div className="space-y-1">
                      <div className="w-28 border-b border-slate-400 font-serif italic text-slate-700 pb-0.5">
                        {activeCert.course?.instructorName}
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase">Lead Instructor</p>
                    </div>

                    <div className="space-y-1">
                      <div className="w-28 border-b border-slate-400 font-serif italic text-indigo-900 font-bold pb-0.5">
                        EduVerse LMS
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase">Academy Director</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StudentCertificates;
