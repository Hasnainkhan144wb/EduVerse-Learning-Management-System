import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BrowseCourses from './pages/BrowseCourses';
import CourseDetails from './pages/CourseDetails';

import ProtectedRoute from './routes/ProtectedRoute';
import RoleBaseRoute from './routes/RoleBaseRoute';

import StudentLayout from './layouts/StudentLayout';
import InstructorLayout from './layouts/InstructorLayout';
import AdminLayout from './layouts/AdminLayout';

import StudentDashboard from './student/StudentDashboard';
import MyCourses from './student/MyCourses';
import CoursePlayer from './student/CoursePlayer';
import TakeQuiz from './student/TakeQuiz';
import Checkout from './student/Checkout';
import StudentCertificates from './student/StudentCertificates';

import InstructorDashboard from './instructor/InstructorDashboard';
import CourseBuilder from './instructor/CourseBuilder';
import CreateCourse from './instructor/CreateCourse';
import ManageLessons from './instructor/ManageLessons';
import CreateQuiz from './instructor/CreateQuiz';
import ManageAssignments from './instructor/ManageAssignments';
import EnrolledStudents from './instructor/EnrolledStudents';
import StudentQuestions from './instructor/StudentQuestions';
import InstructorAnalytics from './instructor/InstructorAnalytics';

import AdminDashboard from './admin/AdminDashboard';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Initializing EduVerse LMS...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/courses" element={<BrowseCourses />} />
      <Route path="/courses/:id" element={<CourseDetails />} />

      {/* Standalone Protected Checkout & Course Player & Take Quiz */}
      <Route
        path="/checkout/:courseId"
        element={
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        }
      />

      <Route
        path="/course-player/:courseId"
        element={
          <ProtectedRoute>
            <CoursePlayer />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/quiz/:quizId"
        element={
          <ProtectedRoute>
            <TakeQuiz />
          </ProtectedRoute>
        }
      />

      {/* Protected Student Layout & Dashboard */}
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
        <Route path="courses" element={<MyCourses />} />
        <Route path="my-courses" element={<MyCourses />} />
        <Route path="wishlist" element={<StudentDashboard />} />
        <Route path="certificates" element={<StudentCertificates />} />
      </Route>

      {/* Protected Instructor Layout & Studio */}
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
        <Route path="courses/create" element={<CreateCourse />} />
        <Route path="courses/:courseId/lessons" element={<ManageLessons />} />
        <Route path="quizzes/create" element={<CreateQuiz />} />
        <Route path="quizzes/create/:lessonId" element={<CreateQuiz />} />
        <Route path="assignments/manage" element={<ManageAssignments />} />
        <Route path="assignments/manage/:lessonId" element={<ManageAssignments />} />
        <Route path="students" element={<EnrolledStudents />} />
        <Route path="questions" element={<StudentQuestions />} />
        <Route path="courses/builder" element={<CourseBuilder />} />
        <Route path="courses/edit/:courseId" element={<CourseBuilder />} />
        <Route path="analytics" element={<InstructorAnalytics />} />
      </Route>

      {/* Protected Admin Layout & Command Center */}
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

      {/* Fallback & Unauthorized Routes */}
      <Route
        path="/unauthorized"
        element={
          <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-4 text-center">
            <h1 className="text-3xl font-bold text-red-500 mb-2">403 - Access Denied</h1>
            <p className="text-slate-400 mb-6">You do not have permission to access this page.</p>
            <a href="/" className="px-6 py-2.5 bg-indigo-600 rounded-xl text-sm font-semibold">
              Return to Homepage
            </a>
          </div>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
