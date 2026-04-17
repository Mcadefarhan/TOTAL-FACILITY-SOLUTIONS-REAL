import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import VerifyOTPPage from './pages/auth/VerifyOTPPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Seeker Pages
import SeekerLayout from './pages/seeker/SeekerLayout';
import SeekerDashboard from './pages/seeker/Dashboard';
import SeekerProfile from './pages/seeker/Profile';
import SeekerApplication from './pages/seeker/Application';
import SeekerNotifications from './pages/seeker/Notifications';

// Employer Pages
import EmployerLayout from './pages/employer/EmployerLayout';
import EmployerDashboard from './pages/employer/Dashboard';
import EmployerProfile from './pages/employer/Profile';
import StaffRequest from './pages/employer/StaffRequest';
import EmployerRequests from './pages/employer/Requests';
import EmployerNotifications from './pages/employer/Notifications';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminSeekers from './pages/admin/Seekers';
import AdminEmployers from './pages/admin/Employers';
import AdminRequests from './pages/admin/Requests';
import AdminSettings from './pages/admin/Settings';

// Spinner
import { Loader2 } from 'lucide-react';

// ─── Route Guards ─────────────────────────────────────────────────
const PrivateRoute = ({ children, roles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <FullPageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <FullPageLoader />;
  if (isAuthenticated) {
    const redirect = user?.role === 'admin' ? '/admin' : user?.role === 'employer' ? '/employer' : '/seeker';
    return <Navigate to={redirect} replace />;
  }
  return children;
};

const FullPageLoader = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F4EF]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 text-gold-500 animate-spin" />
        <p className="text-sm text-gray-500 font-body">{t('common.loading')}</p>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/verify-email" element={<VerifyOTPPage />} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

      {/* Seeker */}
      <Route path="/seeker" element={<PrivateRoute roles={['seeker']}><SeekerLayout /></PrivateRoute>}>
        <Route index element={<SeekerDashboard />} />
        <Route path="profile" element={<SeekerProfile />} />
        <Route path="application" element={<SeekerApplication />} />
        <Route path="notifications" element={<SeekerNotifications />} />
      </Route>

      {/* Employer */}
      <Route path="/employer" element={<PrivateRoute roles={['employer']}><EmployerLayout /></PrivateRoute>}>
        <Route index element={<EmployerDashboard />} />
        <Route path="profile" element={<EmployerProfile />} />
        <Route path="new-request" element={<StaffRequest />} />
        <Route path="requests" element={<EmployerRequests />} />
        <Route path="notifications" element={<EmployerNotifications />} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={<PrivateRoute roles={['admin']}><AdminLayout /></PrivateRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="seekers" element={<AdminSeekers />} />
        <Route path="employers" element={<AdminEmployers />} />
        <Route path="requests" element={<AdminRequests />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
