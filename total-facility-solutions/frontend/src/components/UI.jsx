import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { uploadAPI } from '../utils/api';
import toast from 'react-hot-toast';
import {
  Bell, LogOut, Menu, X, ChevronRight, Upload, Trash2,
  Camera, Check, AlertCircle, Info, AlertTriangle, Loader2,
} from 'lucide-react';
import { clsx } from 'clsx';

// ─── Avatar ───────────────────────────────────────────────────────
export const Avatar = ({ src, name, size = 'md', className = '' }) => {
  const sizes = { xs: 'w-7 h-7 text-xs', sm: 'w-9 h-9 text-sm', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg', xl: 'w-20 h-20 text-2xl' };
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  if (src) {
    return <img src={src} alt={name} className={clsx('rounded-full object-cover flex-shrink-0', sizes[size], className)} />;
  }
  return (
    <div className={clsx('rounded-full flex items-center justify-center flex-shrink-0 font-semibold font-display bg-navy-800 text-gold-400', sizes[size], className)}>
      {initials}
    </div>
  );
};

// ─── AvatarUpload ─────────────────────────────────────────────────
export const AvatarUpload = ({ currentAvatar, name, onSuccess, translationKeyPrefix = 'seekerProfile' }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error(t(`${translationKeyPrefix}.imageTooLarge`)); return; }

    setLoading(true);
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const { data } = await uploadAPI.uploadAvatar(formData);
      onSuccess?.(data.avatar);
      toast.success(t(`${translationKeyPrefix}.photoUpdated`));
    } catch (err) {
      toast.error(err.response?.data?.message || t(`${translationKeyPrefix}.uploadFailed`));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await uploadAPI.deleteAvatar();
      onSuccess?.(null);
      toast.success(t(`${translationKeyPrefix}.photoRemoved`));
    } catch {
      toast.error(t(`${translationKeyPrefix}.removePhotoFailed`));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-5">
      <div className="relative">
        <Avatar src={currentAvatar} name={name} size="xl" />
        <button onClick={() => fileRef.current?.click()} disabled={loading}
          className="absolute -bottom-1 -right-1 w-7 h-7 bg-gold-500 rounded-full flex items-center justify-center shadow-md hover:bg-gold-400 transition-colors">
          <Camera className="w-3.5 h-3.5 text-navy-800" />
        </button>
      </div>
      <div className="flex flex-col gap-2">
        <button onClick={() => fileRef.current?.click()} disabled={loading}
          className="btn btn-outline btn-sm gap-2">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {t(`${translationKeyPrefix}.uploadPhoto`)}
        </button>
        {currentAvatar && (
          <button onClick={handleDelete} disabled={loading} className="btn btn-ghost btn-sm text-red-500 hover:text-red-600 hover:bg-red-50 gap-2">
            <Trash2 className="w-3.5 h-3.5" /> {t(`${translationKeyPrefix}.removePhoto`)}
          </button>
        )}
        <p className="text-xs text-gray-400">{t(`${translationKeyPrefix}.photoHelp`)}</p>
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
    </div>
  );
};

// ─── Badge ────────────────────────────────────────────────────────
export const StatusBadge = ({ status }) => {
  const { t } = useLanguage();
  const map = {
    // Application statuses
    draft: 'badge-gray',
    submitted: 'badge-blue',
    under_review: 'badge-gold',
    shortlisted: 'badge-purple',
    placed: 'badge-green',
    rejected: 'badge-red',
    // Request statuses
    pending: 'badge-gold',
    in_progress: 'badge-blue',
    fulfilled: 'badge-green',
    cancelled: 'badge-gray',
    // Verification
    verified: 'badge-green',
    unverified: 'badge-gray',
    // Account
    active: 'badge-green',
    suspended: 'badge-red',
  };
  const fallbackLabel = status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || t('status.unknown');
  const label = t(`status.${status}`) || fallbackLabel;
  return <span className={map[status] || 'badge-gray'}>{label}</span>;
};

// ─── Modal ────────────────────────────────────────────────────────
export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop animate-fade-in" onClick={onClose}>
      <div className={clsx('bg-white rounded-2xl shadow-modal w-full animate-scale-in max-h-[90vh] overflow-y-auto', sizes[size])} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-display font-bold text-navy-800">{title}</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm p-1.5 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// ─── Confirm Dialog ───────────────────────────────────────────────
export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', variant = 'danger', loading = false }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <p className="text-gray-600 mb-6">{message}</p>
    <div className="flex gap-3 justify-end">
      <button onClick={onClose} className="btn btn-ghost btn-md">Cancel</button>
      <button onClick={onConfirm} disabled={loading} className={clsx('btn btn-md', variant === 'danger' ? 'btn-danger' : 'btn-primary')}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmLabel}
      </button>
    </div>
  </Modal>
);

// ─── Alert ────────────────────────────────────────────────────────
export const Alert = ({ type = 'info', title, message, className = '' }) => {
  const map = {
    info: { bg: 'bg-blue-50 border-blue-200', icon: <Info className="w-4 h-4 text-blue-600" />, text: 'text-blue-800' },
    success: { bg: 'bg-green-50 border-green-200', icon: <Check className="w-4 h-4 text-green-600" />, text: 'text-green-800' },
    warning: { bg: 'bg-amber-50 border-amber-200', icon: <AlertTriangle className="w-4 h-4 text-amber-600" />, text: 'text-amber-800' },
    error: { bg: 'bg-red-50 border-red-200', icon: <AlertCircle className="w-4 h-4 text-red-600" />, text: 'text-red-800' },
  };
  const s = map[type];
  return (
    <div className={clsx('flex gap-3 p-4 rounded-xl border', s.bg, className)}>
      <div className="mt-0.5 flex-shrink-0">{s.icon}</div>
      <div>
        {title && <p className={clsx('font-semibold text-sm mb-0.5', s.text)}>{title}</p>}
        <p className={clsx('text-sm', s.text)}>{message}</p>
      </div>
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────
export const StatCard = ({ label, value, icon: Icon, iconBg = 'bg-navy-800/10', iconColor = 'text-navy-800', sub, trend }) => (
  <div className="stat-card animate-fade-in">
    <div className={clsx('stat-icon', iconBg)}>
      <Icon className={clsx('w-5 h-5', iconColor)} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold font-display text-navy-800 leading-none">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      {trend && <p className={clsx('text-xs font-medium mt-1', trend > 0 ? 'text-green-600' : 'text-red-500')}>
        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
      </p>}
    </div>
  </div>
);

// ─── Empty State ──────────────────────────────────────────────────
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-display font-bold text-gray-700 mb-2">{title}</h3>
    <p className="text-sm text-gray-400 max-w-xs mb-5">{description}</p>
    {action}
  </div>
);

// ─── Skeleton ─────────────────────────────────────────────────────
export const Skeleton = ({ className = '' }) => <div className={clsx('skeleton', className)} />;

export const TableSkeleton = ({ rows = 5, cols = 5 }) => (
  <div className="table-wrapper">
    <table className="data-table">
      <thead><tr>{Array.from({ length: cols }).map((_, i) => <th key={i}><Skeleton className="h-3 w-20" /></th>)}</tr></thead>
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <tr key={i}>{Array.from({ length: cols }).map((_, j) => <td key={j}><Skeleton className="h-4 w-full max-w-[120px]" /></td>)}</tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ─── Pagination ───────────────────────────────────────────────────
export const Pagination = ({ page, pages, total, limit, onPageChange }) => {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
      <span>Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total}</span>
      <div className="flex gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1} className="btn btn-ghost btn-sm disabled:opacity-40">← Prev</button>
        {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map(p => (
          <button key={p} onClick={() => onPageChange(p)} className={clsx('btn btn-sm w-8 h-8 rounded-lg', p === page ? 'btn-secondary' : 'btn-ghost')}>{p}</button>
        ))}
        <button onClick={() => onPageChange(page + 1)} disabled={page === pages} className="btn btn-ghost btn-sm disabled:opacity-40">Next →</button>
      </div>
    </div>
  );
};

// ─── Search Bar ───────────────────────────────────────────────────
export const SearchBar = ({ value, onChange, placeholder = 'Search...', className = '' }) => (
  <div className={clsx('relative', className)}>
    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
    <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="search-input w-full" />
  </div>
);

// ─── Page Header ──────────────────────────────────────────────────
export const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between mb-6 animate-fade-in">
    <div>
      <h1 className="text-2xl font-display font-bold text-navy-800">{title}</h1>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
    {action && <div className="flex-shrink-0">{action}</div>}
  </div>
);

// ─── Notification Bell ────────────────────────────────────────────
export const NotificationBell = ({ count = 0, onClick }) => (
  <button onClick={onClick} className="relative btn btn-ghost p-2 rounded-xl" aria-label="Notifications">
    <Bell className="w-5 h-5" />
    {count > 0 && (
      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
        {count > 99 ? '99+' : count}
      </span>
    )}
  </button>
);
