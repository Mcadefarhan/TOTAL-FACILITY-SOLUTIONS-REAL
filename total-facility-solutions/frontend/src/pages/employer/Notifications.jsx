import { useState, useEffect } from 'react';
import { employerAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { PageHeader, EmptyState } from '../../components/UI';
import { Bell, CheckCheck, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

const typeMap = {
  info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-100', iconColor: 'text-blue-500' },
  success: { icon: CheckCircle, bg: 'bg-green-50', border: 'border-green-100', iconColor: 'text-green-500' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-100', iconColor: 'text-amber-500' },
  error: { icon: XCircle, bg: 'bg-red-50', border: 'border-red-100', iconColor: 'text-red-500' },
};

const formatText = (template, values = {}) =>
  Object.entries(values).reduce((text, [key, value]) => text.replace(`{${key}}`, value), template);

export default function EmployerNotifications() {
  const { updateUser } = useAuth();
  const { t, language } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const locale = language === 'hi' ? 'hi-IN' : 'en-IN';

  useEffect(() => {
    employerAPI.getNotifications()
      .then((response) => setNotifications(response.data.notifications || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    try {
      await employerAPI.markNotificationsRead();
      setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
      updateUser({ unreadNotifications: 0 });
      toast.success(t('employerNotifications.markedAllRead'));
    } catch {
      toast.error(t('employerNotifications.updateFailed'));
    }
  };

  const unread = notifications.filter((notification) => !notification.read).length;

  return (
    <div className="max-w-2xl animate-fade-in">
      <PageHeader
        title={t('employerNotifications.title')}
        subtitle={unread > 0 ? formatText(t('employerNotifications.unreadSubtitle'), { count: unread }) : t('employerNotifications.allCaughtUp')}
        action={unread > 0 && (
          <button onClick={markAllRead} className="btn btn-ghost btn-sm gap-1.5">
            <CheckCheck className="w-4 h-4" /> {t('employerNotifications.markAllRead')}
          </button>
        )}
      />
      {loading ? <div className="animate-pulse space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-20 bg-gray-100 rounded-xl" />)}</div>
        : notifications.length === 0 ? (
          <EmptyState icon={Bell} title={t('employerNotifications.emptyTitle')} description={t('employerNotifications.emptyDescription')} />
        ) : (
          <div className="space-y-3">
            {notifications.map((notification, index) => {
              const style = typeMap[notification.type] || typeMap.info;
              const Icon = style.icon;
              return (
                <div key={index} className={clsx('flex gap-4 p-4 rounded-xl border', style.bg, style.border, !notification.read && 'ring-1 ring-gold-500/20')}>
                  <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', style.bg)}>
                    <Icon className={clsx('w-4 h-4', style.iconColor)} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-navy-800">{notification.title}</p>
                      {!notification.read && <span className="w-2 h-2 bg-gold-500 rounded-full flex-shrink-0 mt-1.5" />}
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{notification.message}</p>
                    {notification.createdAt && <p className="text-xs text-gray-400 mt-1.5">{new Date(notification.createdAt).toLocaleDateString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}
