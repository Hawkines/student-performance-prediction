import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// ─── Lazy Pages ────────────────────────────────────────────────────────────────
const LoginPage            = lazy(() => import('./pages/LoginPage'));
const RegisterFacultyPage  = lazy(() => import('./pages/RegisterFacultyPage'));
const NotFoundPage         = lazy(() => import('./pages/NotFoundPage'));

// Student pages
const StudentLayout    = lazy(() => import('./components/layouts/StudentLayout'));
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const WhatIfPredict    = lazy(() => import('./pages/student/WhatIfPredict'));

// Faculty pages
const FacultyLayout    = lazy(() => import('./components/layouts/FacultyLayout'));
const FacultyDashboard = lazy(() => import('./pages/faculty/FacultyDashboard'));
const StudentsList     = lazy(() => import('./pages/faculty/StudentsList'));
const AddStudent       = lazy(() => import('./pages/faculty/AddStudent'));
const StudentDetail    = lazy(() => import('./pages/faculty/StudentDetail'));

// ─── Loading Spinner ───────────────────────────────────────────────────────────
export function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-white/10" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 border-r-purple-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-indigo-400 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// ─── Protected Route ───────────────────────────────────────────────────────────
function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  if (!user) return <Navigate to="/login" replace />;

  if (user.role !== role) return <Navigate to={`/${user.role}/dashboard`} replace />;

  return children;
}

// ─── App Routes ────────────────────────────────────────────────────────────────
// IMPORTANT: Do NOT wrap <Routes> in AnimatePresence with key={location.pathname}.
// It remounts the entire layout tree (including <Outlet>) on every navigation,
// causing blank pages. Animations are handled inside each Layout component.
function AppRoutes() {
  return (
    <Routes>
      {/* ── Public ── */}
      <Route path="/"                 element={<Navigate to="/login" replace />} />
      <Route path="/login"            element={<LoginPage />} />
      <Route path="/register-faculty" element={<RegisterFacultyPage />} />

      {/* ── Student ── */}
      <Route
        path="/student/*"
        element={
          <ProtectedRoute role="student">
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index            element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="predict"   element={<WhatIfPredict />} />
      </Route>

      {/* ── Faculty ── */}
      <Route
        path="/faculty/*"
        element={
          <ProtectedRoute role="faculty">
            <FacultyLayout />
          </ProtectedRoute>
        }
      >
        <Route index               element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"    element={<FacultyDashboard />} />
        <Route path="students"     element={<StudentsList />} />
        <Route path="students/new" element={<AddStudent />} />
        <Route path="students/:id" element={<StudentDetail />} />
      </Route>

      {/* ── 404 ── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<LoadingSpinner />}>
        <AppRoutes />
      </Suspense>
    </AuthProvider>
  );
}
