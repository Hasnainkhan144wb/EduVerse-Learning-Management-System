import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BrowseCourses from './pages/BrowseCourses';
import CourseDetails from './pages/CourseDetails';
import ProfilePage from './pages/ProfilePage';
import AdminLogin from './pages/admin/AdminLogin';

import ProtectedRoute from './routes/ProtectedRoute';
import RoleBaseRoute from './routes/RoleBaseRoute';
import AdminProtectedRoute from './routes/AdminProtectedRoute';

import StudentLayout from './layouts/StudentLayout';
import InstructorLayout from './layouts/InstructorLayout';
import AdminLayout from './layouts/AdminLayout';

import StudentDashboard from './student/StudentDashboard';
import MyCourses from './student/MyCourses';
import CoursePlayer from './student/CoursePlayer';
import TakeQuiz from './student/TakeQuiz';
import StudentAssignments from './student/StudentAssignments';
import Wishlist from './student/Wishlist';
import Checkout from './student/Checkout';
import StudentCertificates from './student/StudentCertificates';
import StudentQnADiscussions from './pages/student/StudentQuestions';

import InstructorDashboard from './instructor/InstructorDashboard';
import InstructorCourses from './instructor/InstructorCourses';
import CourseBuilder from './instructor/CourseBuilder';
import CreateCourse from './instructor/CreateCourse';
import ManageLessons from './instructor/ManageLessons';
import CreateQuiz from './instructor/CreateQuiz';
import ManageAssignments from './instructor/ManageAssignments';
import EnrolledStudents from './instructor/EnrolledStudents';
import StudentQuestions from './instructor/StudentQuestions';
import InstructorAnalytics from './instructor/InstructorAnalytics';

import AdminDashboard from './admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageCourses from './pages/admin/ManageCourses';
import ManageCategories from './pages/admin/ManageCategories';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import Reports from './pages/admin/Reports';
import ManageCertificates from './pages/admin/ManageCertificates';
import PlatformSettings from './pages/admin/PlatformSettings';

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

      {/* Standalone Protected Profile */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Dedicated Isolated Admin Login Portal */}
      <Route path="/admin" element={<AdminLogin />} />

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
        <Route path="assignments" element={<StudentAssignments />} />
        <Route path="questions" element={<StudentQnADiscussions />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="certificates" element={<StudentCertificates />} />
        <Route path="profile" element={<ProfilePage />} />
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
        <Route path="courses" element={<InstructorCourses />} />
        <Route path="courses/create" element={<CreateCourse />} />
        <Route path="create-course" element={<CreateCourse />} />
        <Route path="builder" element={<CourseBuilder />} />
        <Route path="courses/edit/:courseId" element={<CreateCourse />} />
        <Route path="courses/:courseId/lessons" element={<ManageLessons />} />
        <Route path="quiz/create" element={<CreateQuiz />} />
        <Route path="assignments/manage" element={<ManageAssignments />} />
        <Route path="students" element={<EnrolledStudents />} />
        <Route path="questions" element={<StudentQuestions />} />
        <Route path="analytics" element={<InstructorAnalytics />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Protected Admin Portal Layout */}
      <Route
        path="/admin-dashboard"
        element={
          <AdminProtectedRoute>
            <AdminLayout />
          </AdminProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="approvals" element={<AdminDashboard />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="courses" element={<ManageCourses />} />
        <Route path="categories" element={<ManageCategories />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="reports" element={<Reports />} />
        <Route path="certificates" element={<ManageCertificates />} />
        <Route path="settings" element={<PlatformSettings />} />
      </Route>

      {/* Admin Route Aliases (/admin/users, /admin/dashboard, /admin/courses) */}
      <Route
        path="/admin/*"
        element={
          <AdminProtectedRoute>
            <AdminLayout />
          </AdminProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="approvals" element={<AdminDashboard />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="courses" element={<ManageCourses />} />
        <Route path="categories" element={<ManageCategories />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="reports" element={<Reports />} />
        <Route path="certificates" element={<ManageCertificates />} />
        <Route path="settings" element={<PlatformSettings />} />
      </Route>

      {/* Fallback Catch-all Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
