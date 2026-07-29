import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import ProtectedRoute from './routes/ProtectedRoute';
import RoleBaseRoute from './routes/RoleBaseRoute';

import StudentLayout from './layouts/StudentLayout';
import InstructorLayout from './layouts/InstructorLayout';
import AdminLayout from './layouts/AdminLayout';

import StudentDashboard from './student/StudentDashboard';
import CoursePlayer from './student/CoursePlayer';
import StudentCertificates from './student/StudentCertificates';

import InstructorDashboard from './instructor/InstructorDashboard';
import CourseBuilder from './instructor/CourseBuilder';
import InstructorAnalytics from './instructor/InstructorAnalytics';

import AdminDashboard from './admin/AdminDashboard';

function App() {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">Initializing EduVerse LMS...</p>
        </div>
      </div>
    );
  }

  const getDefaultRedirect = () => {
    if (!isAuthenticated) return '/login';
    if (role === 'Instructor') return '/instructor';
    if (role === 'Admin') return '/admin';
    return '/student';
  };

  return (
    <Routes>
      {/* Root redirect based on role */}
      <Route path="/" element={<Navigate to={getDefaultRedirect()} replace />} />

      {/* Student Course Player (Standalone View) */}
      <Route
        path="/course-player/:courseId"
        element={
          <ProtectedRoute>
            <CoursePlayer />
          </ProtectedRoute>
        }
      />

      {/* Student Dashboard Routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute>
            <RoleBaseRoute allowedRoles={['Student', 'Instructor', 'Admin']}>
              <StudentLayout />
            </RoleBaseRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="courses" element={<StudentDashboard />} />
        <Route path="wishlist" element={<StudentDashboard />} />
        <Route path="certificates" element={<StudentCertificates />} />
      </Route>

      {/* Instructor Dashboard & Analytics Routes */}
      <Route
        path="/instructor"
        element={
          <ProtectedRoute>
            <RoleBaseRoute allowedRoles={['Instructor', 'Admin']}>
              <InstructorLayout />
            </RoleBaseRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<InstructorDashboard />} />
        <Route path="courses" element={<InstructorDashboard />} />
        <Route path="courses/create" element={<CourseBuilder />} />
        <Route path="courses/edit/:courseId" element={<CourseBuilder />} />
        <Route path="analytics" element={<InstructorAnalytics />} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleBaseRoute allowedRoles={['Admin']}>
              <AdminLayout />
            </RoleBaseRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="approvals" element={<AdminDashboard />} />
        <Route path="courses" element={<AdminDashboard />} />
        <Route path="categories" element={<AdminDashboard />} />
        <Route path="users" element={<AdminDashboard />} />
      </Route>

      {/* Fallback Unauthorized Route */}
      <Route
        path="/unauthorized"
        element={
          <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-4 text-center">
            <h1 className="text-3xl font-bold text-red-500 mb-2">403 - Access Denied</h1>
            <p className="text-slate-400 mb-6">You do not have permission to view this resource.</p>
            <a href="/" className="px-6 py-2.5 bg-indigo-600 rounded-xl text-sm font-semibold">
              Back to Home
            </a>
          </div>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
