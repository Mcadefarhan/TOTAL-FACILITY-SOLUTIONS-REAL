import { useState } from 'react';
import { adminAPI } from '../../utils/api';
import { PageHeader, Alert } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Bell, Shield, Loader2, Send } from 'lucide-react';

const Section = ({ title, icon: Icon, children }) => (
  <div className="card p-6 mb-5">
    <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
      <Icon className="w-4 h-4 text-gold-500" />
      <h3 className="font-display text-base font-bold text-navy-800">{title}</h3>
    </div>
    {children}
  </div>
);

export default function AdminSettings() {
  const { user } = useAuth();
  const [notif, setNotif] = useState({ title: '', message: '', type: 'info', targetRole: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!notif.title || !notif.message) { toast.error('Title and message required'); return; }
    setSending(true);
    try {
      const { data } = await adminAPI.broadcastNotification(notif);
      toast.success(data.message);
      setSent(true);
      setNotif({ title: '', message: '', type: 'info', targetRole: '' });
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Broadcast failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl animate-fade-in">
      <PageHeader title="Admin Settings" subtitle="Platform configuration and management tools" />

      {/* Admin Info */}
      <Section title="Admin Account" icon={Shield}>
        <div className="space-y-3">
          {[
            ['Name', user?.name],
            ['Email', user?.email],
            ['Role', 'Super Administrator'],
            ['Account Status', 'Active'],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-500">{k}</span>
              <span className="text-sm font-semibold text-navy-800">{v}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
          <p className="text-xs text-amber-700 font-semibold">⚠️ Security Reminder</p>
          <p className="text-xs text-amber-600 mt-1">Change your default admin password immediately after first login. Use a strong, unique password.</p>
        </div>
      </Section>

      {/* Broadcast Notification */}
      <Section title="Broadcast Notification" icon={Bell}>
        <p className="text-sm text-gray-500 mb-4">Send a notification to all users or a specific group.</p>
        {sent && <Alert type="success" message="Notification sent successfully!" className="mb-4" />}
        <form onSubmit={handleBroadcast} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Target Audience</label>
              <select className="form-select" value={notif.targetRole} onChange={e => setNotif(p => ({ ...p, targetRole: e.target.value }))}>
                <option value="">All Users</option>
                <option value="seeker">Job Seekers Only</option>
                <option value="employer">Employers Only</option>
              </select>
            </div>
            <div>
              <label className="form-label">Notification Type</label>
              <select className="form-select" value={notif.type} onChange={e => setNotif(p => ({ ...p, type: e.target.value }))}>
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Alert</option>
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Title *</label>
            <input className="form-input" value={notif.title} onChange={e => setNotif(p => ({ ...p, title: e.target.value }))}
              placeholder="Notification title" maxLength={100} />
          </div>
          <div>
            <label className="form-label">Message *</label>
            <textarea className="form-input" rows="3" value={notif.message} onChange={e => setNotif(p => ({ ...p, message: e.target.value }))}
              placeholder="Write your message to users..." maxLength={500} style={{ resize: 'vertical' }} />
            <p className="text-xs text-gray-400 mt-1">{notif.message.length}/500</p>
          </div>
          <button type="submit" disabled={sending} className="btn btn-primary btn-md gap-2">
            {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send Broadcast</>}
          </button>
        </form>
      </Section>

      {/* Platform Info */}
      <Section title="Platform Information" icon={Shield}>
        <div className="space-y-3">
          {[
            ['Platform Name', 'Total Facility Solutions'],
            ['Version', '1.0.0'],
            ['Backend', 'Node.js + Express'],
            ['Database', 'MongoDB (Atlas)'],
            ['Auth', 'JWT + Email OTP'],
            ['Storage', 'Cloudinary'],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-500">{k}</span>
              <span className="text-sm font-mono text-navy-800 bg-gray-100 px-2 py-0.5 rounded">{v}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
