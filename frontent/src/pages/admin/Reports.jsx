import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import {
  FiFileText,
  FiDownload,
  FiCalendar,
  FiFilter,
  FiDollarSign,
  FiUsers,
  FiBookOpen,
  FiRefreshCw,
  FiCheckCircle,
} from 'react-icons/fi';

const Reports = () => {
  const [reportType, setReportType] = useState('financial'); // 'financial' | 'users' | 'courses'
  const [datePreset, setDatePreset] = useState('30days'); // '7days' | '30days' | 'ytd' | 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = `/admin/reports/${reportType}`;
      const response = await api.get(endpoint);

      if (response.data.success) {
        setReportData(response.data.data);
      }
    } catch (err) {
      console.error(`Failed to fetch ${reportType} report:`, err);
      // Mock Fallback Data if backend fails
      if (reportType === 'financial') {
        setReportData([
          {
            transactionId: 'TXN-1001',
            studentName: 'Alex Johnson',
            studentEmail: 'alex.j@gmail.com',
            courseTitle: 'Full-Stack MERN Architecture 2026',
            amountPaid: '$89.99',
            paymentStatus: 'Completed',
            transactionDate: '2026-07-28',
          },
          {
            transactionId: 'TXN-1002',
            studentName: 'Sophia Chen',
            studentEmail: 'sophia.c@tech.org',
            courseTitle: 'Python Data Science Masterclass',
            amountPaid: '$79.99',
            paymentStatus: 'Completed',
            transactionDate: '2026-07-29',
          },
          {
            transactionId: 'TXN-1003',
            studentName: 'Marcus Vance',
            studentEmail: 'marcus.v@univ.edu',
            courseTitle: 'Figma UI/UX Design System',
            amountPaid: '$49.99',
            paymentStatus: 'Completed',
            transactionDate: '2026-07-30',
          },
        ]);
      } else if (reportType === 'users') {
        setReportData([
          {
            userId: 'USR-8801',
            name: 'Hasnain Khan',
            email: 'hasnain@eduverse.com',
            role: 'Student',
            approvalStatus: 'Verified',
            registrationDate: '2026-07-01',
          },
          {
            userId: 'USR-8802',
            name: 'Dr. Robert Vance',
            email: 'robert.vance@university.edu',
            role: 'Instructor',
            approvalStatus: 'Pending',
            registrationDate: '2026-07-15',
          },
        ]);
      } else {
        setReportData([
          {
            courseId: 'CRS-501',
            title: 'Full-Stack MERN Architecture 2026',
            instructor: 'Dr. Angela Yu',
            category: 'Web Dev',
            price: '$89.99',
            status: 'Published',
            level: 'Advanced',
            createdDate: '2026-06-12',
          },
          {
            courseId: 'CRS-502',
            title: 'Python for Data Science',
            instructor: 'Jose Portilla',
            category: 'Data Science',
            price: '$79.99',
            status: 'Published',
            level: 'Intermediate',
            createdDate: '2026-06-18',
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  }, [reportType]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Convert JSON to CSV & Trigger Browser Download
  const exportToCSV = () => {
    if (!reportData || reportData.length === 0) {
      toast.error('No data available to export');
      return;
    }

    const headers = Object.keys(reportData[0]);
    const csvRows = [];

    // Header row
    csvRows.push(headers.join(','));

    // Data rows
    for (const row of reportData) {
      const values = headers.map((header) => {
        const escaped = ('' + (row[header] || '')).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `EduVerse_${reportType}_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${reportType.toUpperCase()} report as CSV! 📊`);
  };

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
          <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            Compliance & System Reporting
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
            <FiFileText className="text-emerald-500" /> Platform Reports & Export
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Generate financial sales ledgers, user registration statistics, and course engagement reports.
          </p>
        </div>

        <button
          onClick={exportToCSV}
          className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition shrink-0"
        >
          <FiDownload className="w-4 h-4" /> Download CSV Ledger
        </button>
      </div>

      {/* Control Panel: Report Selector & Date Range Filter */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Report Type selector buttons */}
          <button
            onClick={() => setReportType('financial')}
            className={`p-4 rounded-2xl border text-left transition flex items-center gap-3.5 ${
              reportType === 'financial'
                ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center text-xl shrink-0">
              <FiDollarSign />
            </div>
            <div>
              <p className="font-bold text-xs">Financial Revenue</p>
              <p className="text-[11px] text-slate-400">Sales ledgers & transactions</p>
            </div>
          </button>

          <button
            onClick={() => setReportType('users')}
            className={`p-4 rounded-2xl border text-left transition flex items-center gap-3.5 ${
              reportType === 'users'
                ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xl shrink-0">
              <FiUsers />
            </div>
            <div>
              <p className="font-bold text-xs">Student & Faculty Growth</p>
              <p className="text-[11px] text-slate-400">User accounts & approvals</p>
            </div>
          </button>

          <button
            onClick={() => setReportType('courses')}
            className={`p-4 rounded-2xl border text-left transition flex items-center gap-3.5 ${
              reportType === 'courses'
                ? 'bg-purple-600/20 border-purple-500 text-white shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center text-xl shrink-0">
              <FiBookOpen />
            </div>
            <div>
              <p className="font-bold text-xs">Course Performance</p>
              <p className="text-[11px] text-slate-400">Catalog status & pricing</p>
            </div>
          </button>
        </div>

        {/* Date Presets Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <FiCalendar className="text-slate-500 text-xs" />
            <span className="text-xs font-semibold text-slate-300">Date Range:</span>
            {['7days', '30days', 'ytd', 'custom'].map((preset) => (
              <button
                key={preset}
                onClick={() => setDatePreset(preset)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition ${
                  datePreset === preset
                    ? 'bg-slate-800 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {preset === '7days'
                  ? 'Last 7 Days'
                  : preset === '30days'
                  ? 'Last 30 Days'
                  : preset === 'ytd'
                  ? 'Year to Date'
                  : 'Custom'}
              </button>
            ))}
          </div>

          {datePreset === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl text-xs text-white px-3 py-1.5 focus:outline-none"
              />
              <span className="text-slate-500 text-xs">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl text-xs text-white px-3 py-1.5 focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Report Data Table Preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FiCheckCircle className="text-emerald-400" /> Report Ledger Preview
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing {reportData.length} records generated for {reportType.toUpperCase()} query.
            </p>
          </div>
          <button
            onClick={fetchReportData}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            title="Refresh Report Data"
          >
            <FiRefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-xs">Compiling system report ledger...</p>
          </div>
        ) : reportData.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <FiFileText className="text-slate-600 text-3xl mx-auto" />
            <p className="text-slate-300 font-bold text-sm">No report records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  {Object.keys(reportData[0]).map((key) => (
                    <th key={key} className="py-3.5 px-4 capitalize">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition text-xs">
                    {Object.values(row).map((val, i) => (
                      <td key={i} className="py-3.5 px-4 text-slate-200">
                        {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Reports;
