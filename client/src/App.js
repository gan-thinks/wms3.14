

import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import Leaves from './pages/Leaves';
import Payroll from './pages/Payroll';
import Departments from './pages/Departments';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import Calendar from './pages/Calendar';
import CreateProject from './pages/CreateProject';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import TeamOverview from './pages/TeamOverview';
import EmployeeProfile from './pages/EmployeeProfile';
import Analytics from './pages/Analytics';
import ProjectEdit from './pages/ProjectEdit';
import NotFound from './pages/NotFound';


// Enhanced Loading Component
const LoadingSpinner = ({ message = "Loading your workspace..." }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="text-center">
      <div className="relative">
        <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-r-blue-400 animate-pulse"></div>
      </div>
      <p className="mt-6 text-gray-700 text-lg font-medium">{message}</p>
      <div className="mt-2 flex justify-center space-x-1">
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  </div>
);

// Error Boundary for Better Error Handling
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error('App Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md mx-auto text-center p-8 bg-white rounded-lg shadow-lg">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Oops! Something went wrong</h1>
            <p className="text-gray-600 mb-6">
              We encountered an unexpected error. Don't worry, your data is safe.
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                  window.location.reload();
                }}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Refresh Page
              </button>
              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error Details (Dev Mode)
                </summary>
                <pre className="mt-2 text-xs bg-red-50 p-3 rounded overflow-auto max-h-40 text-red-800">
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <LoadingSpinner message="Verifying your access..." />;
  }
  
  if (!user) {
    // Save attempted location for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
};

// Public Route Component
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <LoadingSpinner message="Loading..." />;
  }
  
  if (user) {
    // Redirect to intended page or dashboard
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }
  
  return children;
};

function App() {
  const { loading } = useAuth();

  // Show loading spinner during initial auth check
  if (loading) {
    return <LoadingSpinner message="Initializing workspace..." />;
  }

  return (
    <ErrorBoundary>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/signup" 
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            } 
          />
          <Route 
            path="/forgotpassword" 
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            } 
          />
          
          {/* Protected Routes with Layout */}
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <Layout>
                  <ErrorBoundary>
                    <Routes>
                      {/* Default redirect to dashboard */}
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      
                      {/* Core Pages */}
                      <Route path="/dashboard" element={<Dashboard />} />
                      
                      {/* Employee Management */}
                      <Route path="/employees" element={<Employees />} />
                      <Route path="/employees/:id" element={<EmployeeProfile />} />
                      <Route path="/teamoverview" element={<TeamOverview />} />
                      <Route path="/profile" element={<Profile />} />
                      
                      {/* Attendance & Leave */}
                      <Route path="/attendance" element={<Attendance />} />
                      <Route path="/leaves" element={<Leaves />} />
                      <Route path="/calendar" element={<Calendar />} />
                      
                      {/* Project Management */}
                      <Route path="/projects" element={<Projects />} />
                      <Route path="/createproject" element={<CreateProject />} />
                      <Route path="/projects/:id" element={<ProjectDetail />} />
                      <Route path="/projects/:id/edit" element={<ProjectEdit />} />
                      
                      {/* Analytics & Reports */}
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/reports" element={<Reports />} />
                      
                      {/* HR & Administration */}
                      <Route path="/payroll" element={<Payroll />} />
                      <Route path="/departments" element={<Departments />} />
                      
                      {/* 404 - Must be last */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </ErrorBoundary>
                </Layout>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </ErrorBoundary>
  );
}

export default App;
