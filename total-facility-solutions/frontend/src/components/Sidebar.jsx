import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './UI';
import { clsx } from 'clsx';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from './LanguageSelector';
import {
  LayoutDashboard, Users, Building2, FileText, Settings,
  LogOut, BriefcaseBusiness, Bell, User, FilePlus, List,
  BarChart3, Shield,
} from 'lucide-react';

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const roleLabels = {
    seeker: t('sidebar.seeker'),
    employer: t('sidebar.employer'),
    admin: t('sidebar.admin'),
  };
  const navConfigs = {
    seeker: [
      { to: '/seeker', label: t('sidebar.dashboard'), icon: LayoutDashboard, end: true },
      { to: '/seeker/application', label: t('sidebar.myApplication'), icon: FileText },
      { to: '/seeker/profile', label: t('sidebar.profile'), icon: User },
      { to: '/seeker/notifications', label: t('sidebar.notifications'), icon: Bell },
    ],
    employer: [
      { to: '/employer', label: t('sidebar.dashboard'), icon: LayoutDashboard, end: true },
      { to: '/employer/new-request', label: t('sidebar.newRequest'), icon: FilePlus },
      { to: '/employer/requests', label: t('sidebar.myRequests'), icon: List },
      { to: '/employer/profile', label: t('sidebar.profile'), icon: Building2 },
      { to: '/employer/notifications', label: t('sidebar.notifications'), icon: Bell },
    ],
    admin: [
      { to: '/admin', label: t('sidebar.overview'), icon: BarChart3, end: true },
      { to: '/admin/seekers', label: t('sidebar.jobSeekers'), icon: Users },
      { to: '/admin/employers', label: t('sidebar.employers'), icon: Building2 },
      { to: '/admin/requests', label: t('sidebar.staffRequests'), icon: BriefcaseBusiness },
      { to: '/admin/settings', label: t('sidebar.settings'), icon: Settings },
    ],
  };
  const links = navConfigs[user?.role] || [];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <aside className="h-full flex flex-col bg-navy-800 sidebar-scroll overflow-y-auto select-none">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/8">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-gold-400 font-bold text-lg leading-tight">Total Facility</p>
            <p className="font-display text-white/40 text-sm font-normal">Solutions</p>
          </div>
          {onClose && (
            <button onClick={onClose} className="lg:hidden btn btn-ghost text-white/60 p-1.5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Role Badge */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl">
          <Shield className="w-3.5 h-3.5 text-gold-400 flex-shrink-0" />
          <span className="text-xs font-semibold text-gold-400 uppercase tracking-wide">{roleLabels[user?.role]}</span>
        </div>
      </div>

      <div className="px-5 pb-4">
        <LanguageSelector compact className="bg-white/5 border-white/10" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pb-4">
        <div className="mb-1">
          <p className="px-3 text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2">{t('sidebar.menu')}</p>
          <div className="space-y-0.5">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={onClose}
                className={({ isActive }) =>
                  clsx('nav-link', isActive && 'nav-link-active')
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* User Footer */}
      <div className="px-3 pb-4 border-t border-white/8 pt-4">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <Avatar src={user?.avatar} name={user?.name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-white/40 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="nav-link text-red-400/70 hover:text-red-400 hover:bg-red-500/10">
          <LogOut className="w-4 h-4" />
          {t('sidebar.signOut')}
        </button>
      </div>
    </aside>
  );
}
