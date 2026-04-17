import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { employerAPI } from '../../utils/api';
import { StatCard, PageHeader, StatusBadge, EmptyState, Skeleton } from '../../components/UI';
import { BriefcaseBusiness, Clock, CheckCircle, FilePlus, ArrowRight, Bell, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const formatText = (template, values = {}) =>
  Object.entries(values).reduce((text, [key, value]) => text.replace(`{${key}}`, value), template);

export default function EmployerDashboard() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const locale = language === 'hi' ? 'hi-IN' : 'en-IN';

  useEffect(() => {
    Promise.all([
      employerAPI.getDashboardStats(),
      employerAPI.getRequests({ limit: 5 }),
    ])
      .then(([s, r]) => {
        setStats(s.data.stats);
        setRequests(r.data.jobRequests || []);
      })
      .catch(() => toast.error(t('employerDashboard.loadFailed')))
      .finally(() => setLoading(false));
  }, [t]);

  const businessName = user?.employerProfile?.businessName ? `, ${user.employerProfile.businessName}` : '';

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={formatText(t('employerDashboard.title'), { businessName })}
        subtitle={t('employerDashboard.subtitle')}
        action={(
          <Link to="/employer/new-request" className="btn btn-primary btn-md">
            <FilePlus className="w-4 h-4" /> {t('employerDashboard.newRequest')}
          </Link>
        )}
      />

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
          <StatCard label={t('employerDashboard.totalRequests')} value={stats?.total ?? 0} icon={BriefcaseBusiness} iconBg="bg-navy-800/10" iconColor="text-navy-800" />
          <StatCard label={t('employerDashboard.pendingReview')} value={stats?.pending ?? 0} icon={Clock} iconBg="bg-amber-100" iconColor="text-amber-600" />
          <StatCard label={t('employerDashboard.inProgress')} value={stats?.inProgress ?? 0} icon={Loader2} iconBg="bg-blue-100" iconColor="text-blue-600" />
          <StatCard label={t('employerDashboard.fulfilled')} value={stats?.fulfilled ?? 0} icon={CheckCircle} iconBg="bg-green-100" iconColor="text-green-600" />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="section-header">
            <h2 className="section-title">{t('employerDashboard.recentRequests')}</h2>
            <Link to="/employer/requests" className="text-sm text-gold-600 hover:text-gold-500 font-medium">{t('employerDashboard.viewAll')}</Link>
          </div>
          {loading ? <Skeleton className="h-48" /> : requests.length === 0 ? (
            <EmptyState
              icon={BriefcaseBusiness}
              title={t('employerDashboard.noRequestsTitle')}
              description={t('employerDashboard.noRequestsDescription')}
              action={<Link to="/employer/new-request" className="btn btn-primary btn-md">{t('employerDashboard.submitRequest')}</Link>}
            />
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('employerDashboard.table.staffType')}</th>
                    <th>{t('employerDashboard.table.count')}</th>
                    <th>{t('employerDashboard.table.location')}</th>
                    <th>{t('employerDashboard.table.status')}</th>
                    <th>{t('employerDashboard.table.date')}</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r._id}>
                      <td className="font-medium">{r.staffType}</td>
                      <td>{r.numberOfStaff}</td>
                      <td className="text-gray-500">{r.city || r.location || t('employerDashboard.table.notAvailable')}</td>
                      <td><StatusBadge status={r.status} /></td>
                      <td className="text-gray-400 text-xs">{new Date(r.createdAt).toLocaleDateString(locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-display font-bold text-navy-800 text-base mb-4">{t('employerDashboard.quickActions')}</h3>
            <div className="space-y-2">
              {[
                { to: '/employer/new-request', icon: FilePlus, label: t('employerDashboard.newStaffRequest'), sub: t('employerDashboard.submitRequirement'), color: 'bg-gold-500/10', ic: 'text-gold-600' },
                { to: '/employer/requests', icon: BriefcaseBusiness, label: t('employerDashboard.viewAllRequests'), sub: t('employerDashboard.trackStatus'), color: 'bg-navy-800/10', ic: 'text-navy-800' },
                { to: '/employer/notifications', icon: Bell, label: t('employerDashboard.notifications'), sub: formatText(t('employerDashboard.unreadCount'), { count: user?.unreadNotifications || 0 }), color: 'bg-purple-100', ic: 'text-purple-600' },
              ].map(({ to, icon: Icon, label, sub, color, ic }) => (
                <Link key={to} to={to} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${ic}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy-800">{label}</p>
                    <p className="text-xs text-gray-400">{sub}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 ml-auto group-hover:text-gray-400" />
                </Link>
              ))}
            </div>
          </div>

          <div className="card p-5 bg-navy-800 border-navy-700">
            <p className="text-gold-400 font-display font-bold mb-2">{t('employerDashboard.needHelp')}</p>
            <p className="text-white/60 text-sm mb-3">{t('employerDashboard.needHelpText')}</p>
            <p className="text-white/40 text-xs">+91 7488 220 852</p>
            <p className="text-white/40 text-xs mt-1">totalfacultysolution@gmail.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
