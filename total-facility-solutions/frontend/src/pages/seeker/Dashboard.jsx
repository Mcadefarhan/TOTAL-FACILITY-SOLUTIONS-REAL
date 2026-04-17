import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { seekerAPI } from '../../utils/api';
import { StatCard, PageHeader, Alert, StatusBadge, Skeleton } from '../../components/UI';
import { FileText, CheckCircle, Clock, Eye, ArrowRight, Bell } from 'lucide-react';

const profileCompletion = (user) => {
  const profile = user?.seekerProfile || {};
  const checks = [
    !!user?.phone,
    !!profile.address,
    profile.skills?.length > 0,
    !!profile.experience,
    !!profile.primarySkill,
    !!profile.expectedSalary,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

const formatText = (template, values = {}) =>
  Object.entries(values).reduce((text, [key, value]) => text.replace(`{${key}}`, value), template);

export default function SeekerDashboard() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const completion = profileCompletion(user);
  const locale = language === 'hi' ? 'hi-IN' : 'en-IN';

  useEffect(() => {
    seekerAPI.getStatus().then((r) => setStatus(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const appStatus = status?.applicationStatus || user?.seekerProfile?.applicationStatus || 'draft';

  const timeline = [
    { label: t('seekerDashboard.timeline.profileCreated'), done: true, date: user?.createdAt ? new Date(user.createdAt).toLocaleDateString(locale) : '' },
    { label: t('seekerDashboard.timeline.applicationSubmitted'), done: ['submitted', 'under_review', 'shortlisted', 'placed'].includes(appStatus), date: status?.submittedAt ? new Date(status.submittedAt).toLocaleDateString(locale) : '' },
    { label: t('seekerDashboard.timeline.underReview'), done: ['under_review', 'shortlisted', 'placed'].includes(appStatus) },
    { label: t('seekerDashboard.timeline.shortlisted'), done: ['shortlisted', 'placed'].includes(appStatus) },
    { label: t('seekerDashboard.timeline.placedSuccessfully'), done: appStatus === 'placed', date: status?.placedAt ? new Date(status.placedAt).toLocaleDateString(locale) : '' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={formatText(t('seekerDashboard.greeting'), { name: user?.name?.split(' ')[0] || '' })}
        subtitle={t('seekerDashboard.subtitle')}
      />

      {completion < 60 && (
        <Alert
          type="warning"
          title={t('seekerDashboard.completeProfileTitle')}
          message={t('seekerDashboard.completeProfileMessage')}
        />
      )}

      {appStatus === 'placed' && (
        <Alert
          type="success"
          title={t('seekerDashboard.placedTitle')}
          message={status?.adminNotes
            ? formatText(t('seekerDashboard.placedMessageWithNote'), { note: status.adminNotes })
            : t('seekerDashboard.placedMessageDefault')}
        />
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard label={t('seekerDashboard.profileComplete')} value={`${completion}%`} icon={CheckCircle} iconBg="bg-green-100" iconColor="text-green-600" />
        <StatCard label={t('seekerDashboard.applicationStatus')} value={<StatusBadge status={appStatus} />} icon={FileText} iconBg="bg-blue-100" iconColor="text-blue-600" />
        <StatCard label={t('seekerDashboard.unreadNotifications')} value={user?.unreadNotifications || 0} icon={Bell} iconBg="bg-purple-100" iconColor="text-purple-600" />
        <StatCard label={t('seekerDashboard.daysActive')} value={user?.createdAt ? Math.floor((Date.now() - new Date(user.createdAt)) / 86400000) : 0} icon={Clock} iconBg="bg-amber-100" iconColor="text-amber-600" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="section-header">
            <h2 className="section-title">{t('seekerDashboard.applicationJourney')}</h2>
          </div>
          {loading ? <Skeleton className="h-32" /> : (
            <div className="space-y-0">
              {timeline.map(({ label, done, date }, i) => (
                <div key={label} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-colors duration-300 ${done ? 'bg-green-500' : 'bg-gray-200'}`}>
                      {done ? <CheckCircle className="w-4 h-4 text-white" /> : <div className="w-2 h-2 bg-gray-400 rounded-full" />}
                    </div>
                    {i < timeline.length - 1 && <div className={`w-0.5 h-8 mt-0 ${done ? 'bg-green-300' : 'bg-gray-200'}`} />}
                  </div>
                  <div className="pb-6 min-w-0">
                    <p className={`text-sm font-semibold ${done ? 'text-navy-800' : 'text-gray-400'}`}>{label}</p>
                    {date && <p className="text-xs text-gray-400 mt-0.5">{date}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {appStatus === 'draft' && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link to="/seeker/application" className="btn btn-primary btn-md">
                {t('seekerDashboard.submitApplication')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {status?.adminNotes && appStatus !== 'placed' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-xs font-semibold text-blue-700 mb-0.5">{t('seekerDashboard.adminNoteTitle')}</p>
              <p className="text-sm text-blue-600">{status.adminNotes}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-display font-bold text-navy-800 text-base mb-4">{t('seekerDashboard.quickActions')}</h3>
            <div className="space-y-2">
              <Link to="/seeker/profile" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className="w-8 h-8 bg-navy-800/10 rounded-lg flex items-center justify-center group-hover:bg-navy-800/15">
                  <Eye className="w-4 h-4 text-navy-800" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy-800">{t('seekerDashboard.updateProfile')}</p>
                  <p className="text-xs text-gray-400">{t('seekerDashboard.keepInfoCurrent')}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 ml-auto group-hover:text-gray-400" />
              </Link>
              <Link to="/seeker/application" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className="w-8 h-8 bg-gold-500/10 rounded-lg flex items-center justify-center group-hover:bg-gold-500/15">
                  <FileText className="w-4 h-4 text-gold-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy-800">{t('seekerDashboard.myApplication')}</p>
                  <p className="text-xs text-gray-400">{t('seekerDashboard.viewEditForm')}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 ml-auto group-hover:text-gray-400" />
              </Link>
              <Link to="/seeker/notifications" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center group-hover:bg-purple-500/15">
                  <Bell className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy-800">{t('seekerDashboard.notifications')}</p>
                  <p className="text-xs text-gray-400">{formatText(t('seekerDashboard.unreadCount'), { count: user?.unreadNotifications || 0 })}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 ml-auto group-hover:text-gray-400" />
              </Link>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-display font-bold text-navy-800 text-base mb-3">{t('seekerDashboard.profileStrength')}</h3>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-gold-500 to-green-500 rounded-full transition-all duration-700" style={{ width: `${completion}%` }} />
              </div>
              <span className="text-sm font-bold text-navy-800">{completion}%</span>
            </div>
            <p className="text-xs text-gray-400">{completion < 100 ? t('seekerDashboard.completeProfileHint') : t('seekerDashboard.profileCompleteHint')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
