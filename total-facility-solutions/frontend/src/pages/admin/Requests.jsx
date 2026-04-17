import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../utils/api';
import { PageHeader, StatusBadge, Modal, TableSkeleton, SearchBar, Pagination, Avatar, EmptyState } from '../../components/UI';
import { Eye, Users, UserPlus, CheckCircle, Building2, Phone, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

const STATUSES = ['', 'pending', 'under_review', 'in_progress', 'fulfilled', 'cancelled', 'rejected'];
const STAFF_TYPES = ['', 'Housekeeping', 'Security Guard', 'Office Boy', 'Salesman', 'Receptionist', 'Driver', 'Cook', 'Helper', 'Other'];

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [staffTypeFilter, setStaffTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [viewing, setViewing] = useState(null);
  const [matchModal, setMatchModal] = useState(null);
  const [availableSeekers, setAvailableSeekers] = useState([]);
  const [seekersLoading, setSeekersLoading] = useState(false);
  const [matchNote, setMatchNote] = useState('');
  const [matching, setMatching] = useState(false);
  const [statusUpdateModal, setStatusUpdateModal] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getJobRequests({ page, limit: 15, search: search || undefined, status: statusFilter || undefined, staffType: staffTypeFilter || undefined });
      setRequests(data.jobRequests || []);
      setPagination(data.pagination || {});
    } catch { toast.error('Failed to load requests'); }
    finally { setLoading(false); }
  }, [page, search, statusFilter, staffTypeFilter]);

  useEffect(() => { const t = setTimeout(fetchRequests, search ? 400 : 0); return () => clearTimeout(t); }, [fetchRequests]);

  const openMatchModal = async (request) => {
    setMatchModal(request);
    setMatchNote('');
    setSeekersLoading(true);
    try {
      const { data } = await adminAPI.getSeekersForMatching({ skill: request.staffType });
      setAvailableSeekers(data.seekers || []);
    } catch { toast.error('Failed to load seekers'); }
    finally { setSeekersLoading(false); }
  };

  const handleMatch = async (seekerId) => {
    setMatching(true);
    try {
      await adminAPI.matchSeeker(matchModal._id, { seekerId, adminNote: matchNote });
      toast.success('Candidate matched successfully!');
      setMatchModal(null);
      fetchRequests();
    } catch (err) { toast.error(err.response?.data?.message || 'Match failed'); }
    finally { setMatching(false); }
  };

  const handleStatusUpdate = async () => {
    setUpdating(true);
    try {
      await adminAPI.updateRequestStatus(statusUpdateModal._id, { status: newStatus, adminNotes: adminNote });
      toast.success('Status updated!');
      setStatusUpdateModal(null);
      fetchRequests();
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
    finally { setUpdating(false); }
  };

  const alreadyMatchedIds = matchModal?.matchedSeekers?.map(m => m.seeker?._id || m.seeker) || [];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Staff Requests" subtitle="Review, process, and match employer requirements with suitable candidates" />

      <div className="flex flex-wrap gap-3 mb-5">
        <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search title, location..." className="flex-1 min-w-[200px]" />
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="form-select w-auto">
          {STATUSES.map(s => <option key={s} value={s}>{s === '' ? 'All Statuses' : s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
        </select>
        <select value={staffTypeFilter} onChange={e => { setStaffTypeFilter(e.target.value); setPage(1); }} className="form-select w-auto">
          {STAFF_TYPES.map(s => <option key={s} value={s}>{s === '' ? 'All Types' : s}</option>)}
        </select>
      </div>

      {loading ? <TableSkeleton rows={8} cols={7} /> : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>Request</th><th>Employer</th><th>Staff Type</th><th>Count</th><th>Location</th><th>Matches</th><th>Status</th><th>Date</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-12 text-gray-400">No requests found</td></tr>
                ) : requests.map(r => (
                  <tr key={r._id}>
                    <td>
                      <p className="font-semibold text-navy-800 text-sm truncate max-w-[140px]">{r.title}</p>
                      <p className="text-xs text-gray-400">{r.shift} · {r.workTiming || '—'}</p>
                    </td>
                    <td>
                      <p className="text-sm font-medium">{r.employer?.employerProfile?.businessName || r.employer?.name}</p>
                      <p className="text-xs text-gray-400">{r.employer?.phone || '—'}</p>
                    </td>
                    <td><span className="badge badge-gold text-xs">{r.staffType}</span></td>
                    <td className="font-semibold text-center">{r.numberOfStaff}</td>
                    <td className="text-sm text-gray-500">{r.city || r.location || '—'}</td>
                    <td>
                      {r.matchedSeekers?.length > 0 ? (
                        <span className="badge badge-green"><Users className="w-3 h-3" /> {r.matchedSeekers.length}</span>
                      ) : <span className="text-gray-400 text-xs">None</span>}
                    </td>
                    <td><StatusBadge status={r.status} /></td>
                    <td className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('en-IN')}</td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => setViewing(r)} className="btn btn-ghost btn-sm p-1.5" title="View details"><Eye className="w-3.5 h-3.5" /></button>
                        <button onClick={() => openMatchModal(r)} className="btn btn-ghost btn-sm p-1.5 text-green-600 hover:bg-green-50" title="Match seeker">
                          <UserPlus className="w-3.5 h-3.5" />
                        </button>
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
      <Modal isOpen={!!viewing} onClose={() => setViewing(null)} title="Request Details" size="lg">
        {viewing && (
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display font-bold text-navy-800 text-xl">{viewing.title}</h3>
                <div className="flex gap-2 mt-1.5">
                  <span className="badge badge-gold">{viewing.staffType}</span>
                  <StatusBadge status={viewing.status} />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-2">Employer</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center"><Building2 className="w-4 h-4 text-amber-700" /></div>
                <div>
                  <p className="font-semibold text-navy-800">{viewing.employer?.employerProfile?.businessName || viewing.employer?.name}</p>
                  <p className="text-xs text-gray-500">{viewing.employer?.email} · {viewing.employer?.phone || '—'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                ['Staff Needed', viewing.numberOfStaff],
                ['Location', viewing.location || '—'],
                ['City', viewing.city || '—'],
                ['Shift', viewing.shift],
                ['Work Timing', viewing.workTiming || '—'],
                ['Duration', viewing.contractDuration || '—'],
                ['Min Experience', viewing.minExperience || 'Any'],
                ['Gender Pref.', viewing.genderPreference || 'Any'],
                ['Salary', viewing.salaryMin ? `₹${viewing.salaryMin}–${viewing.salaryMax || '?'}` : '—'],
              ].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">{k}</p>
                  <p className="text-sm font-semibold text-navy-800">{v}</p>
                </div>
              ))}
            </div>

            {viewing.description && <p className="text-sm text-gray-600 leading-relaxed">{viewing.description}</p>}

            {/* Matched Seekers */}
            {viewing.matchedSeekers?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Matched Candidates</p>
                <div className="space-y-2">
                  {viewing.matchedSeekers.map(m => (
                    <div key={m._id} className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-xl">
                      <Avatar src={m.seeker?.avatar} name={m.seeker?.name} size="sm" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{m.seeker?.name}</p>
                        <p className="text-xs text-gray-500">{m.seeker?.seekerProfile?.primarySkill} · {m.seeker?.phone}</p>
                      </div>
                      <StatusBadge status={m.matchStatus} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
              <button onClick={() => { setViewing(null); openMatchModal(viewing); }} className="btn btn-success btn-sm gap-1.5">
                <UserPlus className="w-3.5 h-3.5" /> Match Candidate
              </button>
              <button onClick={() => { setViewing(null); setStatusUpdateModal(viewing); setNewStatus(viewing.status); setAdminNote(viewing.adminNotes || ''); }}
                className="btn btn-primary btn-sm">Update Status</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Match Seeker Modal */}
      <Modal isOpen={!!matchModal} onClose={() => setMatchModal(null)} title={`Match Candidate: ${matchModal?.title}`} size="lg">
        {matchModal && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-amber-700">
              Looking for: <strong>{matchModal.staffType}</strong> · {matchModal.numberOfStaff} staff needed · {matchModal.city || matchModal.location}
            </div>
            <div>
              <label className="form-label">Note to Employer (optional)</label>
              <input className="form-input" value={matchNote} onChange={e => setMatchNote(e.target.value)} placeholder="Why this candidate is a good match..." />
            </div>
            <div>
              <p className="form-label mb-2">Available Candidates ({availableSeekers.length})</p>
              {seekersLoading ? (
                <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>
              ) : availableSeekers.length === 0 ? (
                <EmptyState icon={Users} title="No available seekers" description={`No seekers with matching skill "${matchModal.staffType}" found in submitted applications.`} />
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {availableSeekers.map(s => {
                    const alreadyMatched = alreadyMatchedIds.includes(s._id);
                    return (
                      <div key={s._id} className={clsx('flex items-center gap-3 p-3 rounded-xl border transition-all', alreadyMatched ? 'bg-green-50 border-green-200 opacity-70' : 'bg-white border-gray-200 hover:border-gold-300')}>
                        <Avatar src={s.avatar} name={s.name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-navy-800">{s.name}</p>
                          <p className="text-xs text-gray-500">{s.seekerProfile?.primarySkill} · {s.seekerProfile?.experience} · {s.seekerProfile?.city || '—'}</p>
                          {s.seekerProfile?.expectedSalary && <p className="text-xs text-gray-400">Exp. ₹{s.seekerProfile.expectedSalary.toLocaleString('en-IN')}/mo</p>}
                        </div>
                        {alreadyMatched ? (
                          <span className="badge badge-green"><CheckCircle className="w-3 h-3" /> Matched</span>
                        ) : (
                          <button onClick={() => handleMatch(s._id)} disabled={matching} className="btn btn-success btn-sm">
                            <UserPlus className="w-3.5 h-3.5" /> Match
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Status Update Modal */}
      <Modal isOpen={!!statusUpdateModal} onClose={() => setStatusUpdateModal(null)} title="Update Request Status" size="sm">
        {statusUpdateModal && (
          <div className="space-y-4">
            <div>
              <label className="form-label">New Status</label>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="form-select">
                {['pending', 'under_review', 'in_progress', 'fulfilled', 'cancelled', 'rejected'].map(s => (
                  <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                ))}
              </select>
            </div>
            {newStatus === 'rejected' && (
              <div>
                <label className="form-label">Rejection Reason</label>
                <textarea className="form-input" rows="2" value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Reason for rejection..." style={{ resize: 'vertical' }} />
              </div>
            )}
            <div>
              <label className="form-label">Admin Notes (optional)</label>
              <textarea className="form-input" rows="2" value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Internal notes or message to employer..." style={{ resize: 'vertical' }} />
            </div>
            <div className="flex gap-3">
              <button onClick={handleStatusUpdate} disabled={updating} className="btn btn-primary btn-md flex-1">
                {updating ? 'Updating...' : 'Update Status'}
              </button>
              <button onClick={() => setStatusUpdateModal(null)} className="btn btn-ghost btn-md">Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
