import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../utils/api';
import { PageHeader, StatusBadge, Modal, TableSkeleton, SearchBar, Pagination, Avatar } from '../../components/UI';
import { Eye, Phone, Mail, MapPin, Briefcase, Award, MoreHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

const STATUSES = ['', 'submitted', 'under_review', 'shortlisted', 'placed', 'rejected'];
const SKILLS = ['', 'Housekeeping', 'Security Guard', 'Office Boy', 'Salesman', 'Receptionist', 'Driver', 'Cook', 'Helper', 'Other'];

export default function AdminSeekers() {
  const [seekers, setSeekers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [viewing, setViewing] = useState(null);
  const [statusModal, setStatusModal] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchSeekers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, search: search || undefined, status: statusFilter || undefined, skill: skillFilter || undefined };
      const { data } = await adminAPI.getSeekers(params);
      setSeekers(data.seekers || []);
      setPagination(data.pagination || {});
    } catch { toast.error('Failed to load seekers'); }
    finally { setLoading(false); }
  }, [page, search, statusFilter, skillFilter]);

  useEffect(() => { const t = setTimeout(fetchSeekers, search ? 400 : 0); return () => clearTimeout(t); }, [fetchSeekers]);

  const openStatusModal = (seeker) => {
    setStatusModal(seeker);
    setNewStatus(seeker.seekerProfile?.applicationStatus || 'submitted');
    setAdminNote(seeker.seekerProfile?.adminNotes || '');
  };

  const handleUpdateStatus = async () => {
    setUpdating(true);
    try {
      await adminAPI.updateSeekerStatus(statusModal._id, { applicationStatus: newStatus, adminNotes: adminNote });
      toast.success('Status updated!');
      setStatusModal(null);
      fetchSeekers();
      if (viewing?._id === statusModal._id) setViewing(prev => ({ ...prev, seekerProfile: { ...prev.seekerProfile, applicationStatus: newStatus, adminNotes: adminNote } }));
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
    finally { setUpdating(false); }
  };

  const handleSuspend = async (seeker) => {
    try {
      await adminAPI.suspendUser(seeker._id);
      toast.success(`Account ${seeker.status === 'suspended' ? 'reactivated' : 'suspended'}`);
      fetchSeekers();
    } catch { toast.error('Action failed'); }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Job Seekers" subtitle="Review and manage all applicants on the platform" />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search name, email, phone..." className="flex-1 min-w-[200px]" />
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="form-select w-auto min-w-[140px]">
          {STATUSES.map(s => <option key={s} value={s}>{s === '' ? 'All Statuses' : s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
        </select>
        <select value={skillFilter} onChange={e => { setSkillFilter(e.target.value); setPage(1); }} className="form-select w-auto min-w-[140px]">
          {SKILLS.map(s => <option key={s} value={s}>{s === '' ? 'All Skills' : s}</option>)}
        </select>
      </div>

      {loading ? <TableSkeleton rows={8} cols={7} /> : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>Applicant</th><th>Primary Skill</th><th>Experience</th><th>Shift</th><th>Salary Exp.</th><th>Relocate</th><th>App. Status</th><th>Account</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {seekers.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-12 text-gray-400">No seekers found</td></tr>
                ) : seekers.map(s => (
                  <tr key={s._id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <Avatar src={s.avatar} name={s.name} size="sm" />
                        <div>
                          <p className="font-semibold text-navy-800 text-sm">{s.name}</p>
                          <p className="text-xs text-gray-400">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-blue text-xs">{s.seekerProfile?.primarySkill || '—'}</span></td>
                    <td className="text-sm">{s.seekerProfile?.experience || '—'}</td>
                    <td className="text-sm">{s.seekerProfile?.preferredShift || '—'}</td>
                    <td className="text-sm">{s.seekerProfile?.expectedSalary ? `₹${s.seekerProfile.expectedSalary.toLocaleString('en-IN')}` : '—'}</td>
                    <td className="text-sm">{s.seekerProfile?.willingToRelocate ? '✓ Yes' : 'No'}</td>
                    <td><StatusBadge status={s.seekerProfile?.applicationStatus || 'draft'} /></td>
                    <td><StatusBadge status={s.status} /></td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => setViewing(s)} className="btn btn-ghost btn-sm p-1.5" title="View profile"><Eye className="w-3.5 h-3.5" /></button>
                        <button onClick={() => openStatusModal(s)} className="btn btn-ghost btn-sm p-1.5" title="Update status"><MoreHorizontal className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} limit={15} onPageChange={setPage} />
        </>
      )}

      {/* Detail Modal */}
      <Modal isOpen={!!viewing} onClose={() => setViewing(null)} title="Seeker Profile" size="lg">
        {viewing && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar src={viewing.avatar} name={viewing.name} size="lg" />
              <div>
                <h3 className="font-display font-bold text-navy-800 text-xl">{viewing.name}</h3>
                <p className="text-gray-500 text-sm">{viewing.email}</p>
                <div className="flex gap-2 mt-1.5">
                  <StatusBadge status={viewing.seekerProfile?.applicationStatus || 'draft'} />
                  <StatusBadge status={viewing.status} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                ['Phone', viewing.phone, Phone],
                ['Primary Skill', viewing.seekerProfile?.primarySkill, Briefcase],
                ['Experience', viewing.seekerProfile?.experience, Award],
                ['Shift Pref.', viewing.seekerProfile?.preferredShift, null],
                ['Exp. Salary', viewing.seekerProfile?.expectedSalary ? `₹${viewing.seekerProfile.expectedSalary.toLocaleString('en-IN')}` : '—', null],
                ['City', viewing.seekerProfile?.city || '—', MapPin],
                ['Relocate', viewing.seekerProfile?.willingToRelocate ? 'Yes' : 'No', null],
                ['Qualification', viewing.seekerProfile?.qualification || '—', null],
                ['Last Company', viewing.seekerProfile?.lastCompany || '—', null],
              ].map(([k, v, Icon]) => (
                <div key={k} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">{k}</p>
                  <p className="text-sm font-semibold text-navy-800">{v || '—'}</p>
                </div>
              ))}
            </div>

            {viewing.seekerProfile?.skills?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">All Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {viewing.seekerProfile.skills.map(s => <span key={s} className="skill-tag">{s}</span>)}
                </div>
              </div>
            )}

            {viewing.seekerProfile?.adminNotes && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                <p className="text-xs font-bold text-blue-700 mb-1">Admin Notes</p>
                <p className="text-sm text-blue-600">{viewing.seekerProfile.adminNotes}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
              <button onClick={() => { setViewing(null); openStatusModal(viewing); }} className="btn btn-primary btn-sm">Update Status</button>
              <button onClick={() => { handleSuspend(viewing); setViewing(null); }}
                className={clsx('btn btn-sm', viewing.status === 'suspended' ? 'btn-success' : 'btn-danger')}>
                {viewing.status === 'suspended' ? 'Reactivate Account' : 'Suspend Account'}
              </button>
              {viewing.phone && <a href={`tel:${viewing.phone}`} className="btn btn-outline btn-sm gap-1.5"><Phone className="w-3.5 h-3.5" /> Call</a>}
              <a href={`mailto:${viewing.email}`} className="btn btn-outline btn-sm gap-1.5"><Mail className="w-3.5 h-3.5" /> Email</a>
            </div>
          </div>
        )}
      </Modal>

      {/* Status Update Modal */}
      <Modal isOpen={!!statusModal} onClose={() => setStatusModal(null)} title={`Update Status: ${statusModal?.name}`} size="sm">
        {statusModal && (
          <div className="space-y-4">
            <div>
              <label className="form-label">New Application Status</label>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="form-select">
                {['submitted', 'under_review', 'shortlisted', 'placed', 'rejected'].map(s => (
                  <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Note to Seeker (optional)</label>
              <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} className="form-input" rows="3"
                placeholder="Add a message or note for the applicant..." style={{ resize: 'vertical' }} />
            </div>
            <div className="flex gap-3">
              <button onClick={handleUpdateStatus} disabled={updating} className="btn btn-primary btn-md flex-1">
                {updating ? 'Updating...' : 'Update Status'}
              </button>
              <button onClick={() => setStatusModal(null)} className="btn btn-ghost btn-md">Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
