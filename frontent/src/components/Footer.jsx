import React from 'react';
import { Link } from 'react-router-dom';
import {
  FiBookOpen,
  FiGithub,
  FiLinkedin,
  FiGlobe,
} from 'react-icons/fi';

const Footer = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 pt-12 pb-8 text-slate-400 text-xs font-sans">
      {/* Main Footer Links / Grid Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-base font-bold text-white">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <FiBookOpen />
            </div>
            EduVerse LMS
          </div>
          <p className="text-slate-400 leading-relaxed">
            Empowering learners worldwide with cutting-edge course curriculum and accredited PDF certificates.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-bold text-white mb-3">Quick Links</h4>
          <ul className="space-y-2">
            <li>
              <Link to="/courses" className="hover:text-white transition">
                Browse Courses
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-white transition">
                Sign In
              </Link>
            </li>
            <li>
              <Link to="/register" className="hover:text-white transition">
                Register Account
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold text-white mb-3">Top Categories</h4>
          <ul className="space-y-2">
            <li>
              <Link to="/courses" className="hover:text-white transition">
                Web Development
              </Link>
            </li>
            <li>
              <Link to="/courses" className="hover:text-white transition">
                Data Science & AI
              </Link>
            </li>
            <li>
              <Link to="/courses" className="hover:text-white transition">
                UI/UX Design
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold text-white mb-3">Platform Info</h4>
          <p className="text-slate-400 leading-relaxed">
            Comprehensive Learning Management System powered by React, Node.js & MongoDB.
          </p>
        </div>
      </div>

      {/* 🛠️ LAST DIV - BOTTOM BAR */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        {/* LEFT SIDE: Social Links & Icons */}
        <div className="flex items-center gap-4">
          <span className="font-semibold text-slate-300">Connect With Us:</span>
          <div className="flex items-center gap-3 text-slate-400">
            {/* GitHub */}
            <a
              href="https://github.com/Hasnainkhan144wb"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors"
              title="GitHub Profile"
            >
              <FiGithub className="w-4 h-4" />
            </a>

            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/in/muhammad-hasnain-khan-60aa11420/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors"
              title="LinkedIn Profile"
            >
              <FiLinkedin className="w-4 h-4" />
            </a>

            {/* Personal Portfolio */}
            <a
              href="https://muhammadhasnain.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors"
              title="Personal Portfolio"
            >
              <FiGlobe className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* RIGHT SIDE: Copyright Text */}
        <div className="text-slate-500 text-xs md:text-sm text-center md:text-right">
          © {new Date().getFullYear()} EduVerse LMS Platform. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
