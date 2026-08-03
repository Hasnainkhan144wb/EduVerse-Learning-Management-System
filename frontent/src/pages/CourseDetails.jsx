import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  FiBookOpen,
  FiVideo,
  FiFileText,
  FiCheckCircle,
  FiStar,
  FiUser,
  FiArrowLeft,
  FiArrowRight,
  FiLock,
  FiAward,
  FiGlobe,
  FiDollarSign,
  FiChevronDown,
  FiChevronUp,
} from 'react-icons/fi';

const CourseDetails = () => {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/courses/${courseId}`);
        if (response.data.success) {
          const courseData = response.data.data;
          setCourse(courseData);

          // Check if current student is enrolled
          if (user && user.enrolledCourses) {
            const enrolled = user.enrolledCourses.some(
              (c) => (c._id || c) === courseId
            );
            setIsEnrolled(enrolled);
          }

          // Expand all sections by default
          const initExp = {};
          (courseData.sections || []).forEach((sec) => {
            initExp[sec._id] = true;
          });
          setExpandedSections(initExp);
        }
      } catch (err) {
        console.error('Error fetching course details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId, user]);

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Loading Course Details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-4 text-center">
        <h2 className="text-2xl font-bold text-red-400 mb-2">Course Not Found</h2>
        <p className="text-slate-400 mb-6 text-sm">The course you requested does not exist or has been removed.</p>
        <Link to="/courses" className="px-6 py-2.5 bg-indigo-600 rounded-xl text-xs font-bold">
          Back to Catalog
        </Link>
      </div>
    );
  }

  const totalLessonsCount = (course.sections || []).reduce(
    (acc, sec) => acc + (sec.lessons ? sec.lessons.length : 0),
    0
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3.5 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 text-xl font-bold text-white tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <FiBookOpen className="w-6 h-6" />
            </div>
            <span>EduVerse</span>
          </Link>

          <Link to="/courses" className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1">
            <FiArrowLeft /> Back to Catalog
          </Link>
        </div>
      </nav>

      {/* HERO HEADER */}
      <div className="bg-slate-900/80 border-b border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3 text-xs">
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full font-bold uppercase tracking-wider">
                {course.categoryRef?.name || 'General Category'}
              </span>
              <span className="text-slate-400 flex items-center gap-1">
                <FiGlobe /> {course.language || 'English'}
              </span>
              <span className="text-slate-400 flex items-center gap-1">
                <FiAward /> {course.level || 'Beginner'}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
              {course.title}
            </h1>

            <p className="text-slate-300 text-base leading-relaxed">
              {course.description}
            </p>

            <div className="flex items-center gap-6 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-1 text-amber-400 font-bold">
                <FiStar className="fill-amber-400" />
                <span>4.9 (128 reviews)</span>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <FiUser className="text-indigo-400" />
                <span>Instructor: {course.instructorRef?.name || 'EduVerse Instructor'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT BODY & STICKY CHECKOUT CARD */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column Details */}
        <div className="lg:col-span-2 space-y-10">
          {/* Learning Objectives */}
          {course.objectives && course.objectives.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FiCheckCircle className="text-emerald-400" /> What You Will Learn
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                {course.objectives.map((obj, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <FiCheckCircle className="text-indigo-400 mt-0.5 shrink-0" />
                    <span>{obj}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Curriculum Breakdown */}
          <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white">Course Curriculum</h2>
                <p className="text-slate-400 text-xs mt-1">
                  {(course.sections || []).length} Sections • {totalLessonsCount} Lessons
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {(course.sections || []).map((section, sIdx) => (
                <div
                  key={section._id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden"
                >
                  <button
                    onClick={() => toggleSection(section._id)}
                    className="w-full p-4 bg-slate-900/60 flex items-center justify-between text-left text-xs font-bold text-white hover:bg-slate-800 transition"
                  >
                    <span>
                      Section {sIdx + 1}: {section.title}
                    </span>
                    <div className="flex items-center gap-2 text-slate-400">
                      <span>{(section.lessons || []).length} Lessons</span>
                      {expandedSections[section._id] ? <FiChevronUp /> : <FiChevronDown />}
                    </div>
                  </button>

                  {expandedSections[section._id] && (
                    <div className="divide-y divide-slate-800/60 p-2">
                      {(section.lessons || []).map((lesson) => (
                        <div
                          key={lesson._id}
                          className="p-3.5 flex items-center justify-between text-xs text-slate-300"
                        >
                          <div className="flex items-center gap-3">
                            {lesson.type === 'pdf' ? (
                              <FiFileText className="text-indigo-400" />
                            ) : (
                              <FiVideo className="text-indigo-400" />
                            )}
                            <span>{lesson.title}</span>
                          </div>
                          <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-900 px-2 py-0.5 rounded">
                            {lesson.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Instructor Bio */}
          <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl space-y-4">
            <h2 className="text-lg font-bold text-white">About the Instructor</h2>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xl border border-indigo-500/30">
                {course.instructorRef?.name?.charAt(0) || 'I'}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {course.instructorRef?.name || 'Senior Instructor'}
                </h3>
                <p className="text-xs text-slate-400">EduVerse Certified Author & Subject Specialist</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column Sticky CTA Card */}
        <div>
          <div className="sticky top-24 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-6">
            <div className="relative h-48 rounded-2xl overflow-hidden bg-slate-800">
              <img
                src={
                  course.thumbnail ||
                  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80'
                }
                alt={course.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold text-slate-400">Total Course Fee</span>
                <span className="text-3xl font-extrabold text-white">
                  {course.price > 0 ? `$${course.price}` : 'Free'}
                </span>
              </div>
              <p className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                <FiCheckCircle /> Includes Lifetime Access & Verified PDF Certificate
              </p>
            </div>

            {user?.role === 'Instructor' || user?.role === 'Admin' ? (
              <button
                onClick={() => navigate(user?.role === 'Instructor' ? '/instructor/courses' : '/admin-dashboard')}
                className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
              >
                Instructor Studio • Manage Courses <FiArrowRight />
              </button>
            ) : isEnrolled ? (
              <Link
                to={`/course-player/${course._id}`}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
              >
                Go to Course Player <FiArrowRight />
              </Link>
            ) : (
              <Link
                to={isAuthenticated ? `/checkout/${course._id}` : '/login'}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition"
              >
                Enrol Now <FiArrowRight />
              </Link>
            )}

            <div className="space-y-2.5 pt-2 border-t border-slate-800 text-xs text-slate-400">
              <div className="flex items-center justify-between">
                <span>Access</span>
                <span className="font-semibold text-slate-200">Full Lifetime Access</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Certificate</span>
                <span className="font-semibold text-slate-200">Yes (PDF Download)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total Modules</span>
                <span className="font-semibold text-slate-200">{totalLessonsCount} Lessons</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
