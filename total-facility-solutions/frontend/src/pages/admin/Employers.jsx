import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../utils/api';
import { PageHeader, StatusBadge, Modal, TableSkeleton, SearchBar, Pagination, Avatar } from '../../components/UI';
import { Eye, Phone, Mail, Building2, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminEmployers() {
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [verFilter, setVerFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [viewing, setViewing] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const fetchEmployers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getEmployers({ page, limit: 15, search: search || undefined, verificationStatus: verFilter || undefined });
      setEmployers(data.employers || []);
      setPagination(data.pagination || {});
    } catch { toast.error('Failed to load employers'); }
    finally { setLoading(false); }
  }, [page, search, verFilter]);

  useEffect(() => { const t = setTimeout(fetchEmployers, search ? 400 : 0); return () => clearTimeout(t); }, [fetchEmployers]);

  const handleVerify = async (employerId, status) => {
    setVerifying(true);
    try {
      await adminAPI.verifyEmployer(employerId, { status });
      toast.success(`Employer ${status}!`);
      fetchEmployers();
      if (viewing?._id === employerId) setViewing(prev => ({ ...prev, employerProfile: { ...prev.employerProfile, verificationStatus: status } }));
    } catch { toast.error('Action failed'); }
    finally { setVerifying(false); }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Employers" subtitle="Manage and verify employer accounts" />

      <div className="flex flex-wrap gap-3 mb-5">
        <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search by name, business, email..." className="flex-1 min-w-[200px]" />
        <select value={verFilter} onChange={e => { setVerFilter(e.target.value); setPage(1); }} className="form-select w-auto">
          <option value="">All Verification</option>
          <option value="unverified">Unverified</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
        </select>
      </div>

      {loading ? <TableSkeleton rows={8} cols={6} /> : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>Business</th><th>Owner</th><th>Contact</th><th>City</th><th>Requests</th><th>Verification</th><th>Account</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {employers.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-400">No employers found</td></tr>
                ) : employers.map(e => (
                  <tr key={e._id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-amber-700" />
                        </div>
                        <div>
                          <p className="font-semibold text-navy-800 text-sm">{e.employerProfile?.businessName || '—'}</p>
                          <p className="text-xs text-gray-400">{e.employerProfile?.businessType || 'Business'}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="text-sm font-medium">{e.name}</p>
                      <p className="text-xs text-gray-400">{e.email}</p>
                    </td>
                    <td className="text-sm text-gray-500">{e.phone || '—'}</td>
                    <td className="text-sm text-gray-500">{e.employerProfile?.city || '—'}</td>
                    <td className="text-center font-semibold">{e.requestCount || 0}</td>
                    <td><StatusBadge status={e.employerProfile?.verificationStatus || 'unverified'} /></td>
                    <td><StatusBadge status={e.status} /></td>
                    <td>
                      <button onClick={() => setViewing(e)} className="btn btn-ghost btn-sm p-1.5"><Eye className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} limit={15} onPageChange={setPage} />
        </>
      )}

      {/* Employer Detail Modal */}
      <Modal isOpen={!!viewing} onClose={() => setViewing(null)} title="Employer Details" size="lg">
        {viewing && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-7 h-7 text-amber-700" />
              </div>
              <div>
                <h3 className="font-display font-bold text-navy-800 text-xl">{viewing.employerProfile?.businessName || 'Business'}</h3>
                <p className="text-gray-500 text-sm">{viewing.name} · {viewing.email}</p>
                <div className="flex gap-2 mt-1.5">
                  <StatusBadge status={viewing.employerProfile?.verificationStatus || 'unverified'} />
                  <StatusBadge status={viewing.status} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                ['Business Type', viewing.employerProfile?.businessType || '—'],
                ['GST Number', viewing.employerProfile?.gstNumber || '—'],
                ['Phone', viewing.phone || '—'],
                ['City', viewing.employerProfile?.city || '—'],
                ['State', viewing.employerProfile?.state || '—'],
                ['Website', viewing.employerProfile?.website || '—'],
                ['Total Requests', viewing.requestCount || 0],
                ['Member Since', new Date(viewing.createdAt).toLocaleDateString('en-IN')],
              ].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">{k}</p>
                  <p className="text-sm font-semibold text-navy-800">{v}</p>
                </div>
              ))}
            </div>

            {viewing.employerProfile?.businessAddress && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Business Address</p>
                <p className="text-sm text-navy-800">{viewing.employerProfile.businessAddress}</p>
              </div>
            )}

            {viewing.employerProfile?.description && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm text-gray-600 leading-relaxed">{viewing.employerProfile.description}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
              {viewing.employerProfile?.verificationStatus !== 'verified' ? (
                <button onClick={() => handleVerify(viewing._id, 'verified')} disabled={verifying}
                  className="btn btn-success btn-sm gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Verify Employer</button>
              ) : (
                <button onClick={() => handleVerify(viewing._id, 'unverified')} disabled={verifying}
                  className="btn btn-danger btn-sm gap-1.5"><XCircle className="w-3.5 h-3.5" /> Remove Verification</button>
              )}
              {viewing.phone && <a href={`tel:${viewing.phone}`} className="btn btn-outline btn-sm gap-1.5"><Phone className="w-3.5 h-3.5" /> Call</a>}
              <a href={`mailto:${viewing.email}`} className="btn btn-outline btn-sm gap-1.5"><Mail className="w-3.5 h-3.5" /> Email</a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
