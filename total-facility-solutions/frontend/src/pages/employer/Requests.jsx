import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { employerAPI } from '../../utils/api';
import { PageHeader, StatusBadge, Modal, EmptyState, Skeleton, ConfirmDialog, Pagination } from '../../components/UI';
import { Avatar } from '../../components/UI';
import { BriefcaseBusiness, Eye, X, FilePlus, Users, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const formatText = (template, values = {}) =>
  Object.entries(values).reduce((text, [key, value]) => text.replace(`{${key}}`, value), template);

export default function EmployerRequests() {
  const { t, language } = useLanguage();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [viewing, setViewing] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const locale = language === 'hi' ? 'hi-IN' : 'en-IN';

  const fetchRequests = async (currentPage = 1) => {
    setLoading(true);
    try {
      const params = { page: currentPage, limit: 10 };
      if (filter) params.status = filter;
      const { data } = await employerAPI.getRequests(params);
      setRequests(data.jobRequests || []);
      setPagination(data.pagination || {});
    } catch {
      toast.error(t('employerRequests.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(page);
  }, [page, filter]);

  const handleCancel = async () => {
    setCancelLoading(true);
    try {
      await employerAPI.cancelRequest(cancelling._id);
      toast.success(t('employerRequests.cancelSuccess'));
      setCancelling(null);
      fetchRequests(page);
    } catch (err) {
      toast.error(err.response?.data?.message || t('employerRequests.cancelFailed'));
    } finally {
      setCancelLoading(false);
    }
  };

  const statuses = ['', 'pending', 'under_review', 'in_progress', 'fulfilled', 'cancelled'];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('employerRequests.title')}
        subtitle={t('employerRequests.subtitle')}
        action={<Link to="/employer/new-request" className="btn btn-primary btn-md"><FilePlus className="w-4 h-4" /> {t('employerRequests.newRequest')}</Link>}
      />

      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {statuses.map((status) => (
          <button key={status} onClick={() => { setFilter(status); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${filter === status ? 'bg-navy-800 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
            {status === '' ? t('employerRequests.all') : t(`status.${status}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : requests.length === 0 ? (
        <div className="card p-8">
          <EmptyState icon={BriefcaseBusiness} title={t('employerRequests.emptyTitle')} description={t('employerRequests.emptyDescription')} action={<Link to="/employer/new-request" className="btn btn-primary btn-md">{t('employerRequests.submitRequest')}</Link>} />
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>{t('employerRequests.table.request')}</th><th>{t('employerRequests.table.staffType')}</th><th>{t('employerRequests.table.count')}</th><th>{t('employerRequests.table.location')}</th><th>{t('employerRequests.table.matches')}</th><th>{t('employerRequests.table.status')}</th><th>{t('employerRequests.table.date')}</th><th></th></tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request._id}>
                    <td>
                      <p className="font-semibold text-navy-800 truncate max-w-[160px]">{request.title}</p>
                      {request.workTiming && <p className="text-xs text-gray-400">{request.workTiming}</p>}
                    </td>
                    <td><span className="badge badge-gold">{request.staffType}</span></td>
                    <td className="font-semibold">{request.numberOfStaff}</td>
                    <td className="text-gray-500">{request.city || request.location || t('employerRequests.notAvailable')}</td>
                    <td>{request.matchedSeekers?.length > 0 ? <span className="badge badge-green"><Users className="w-3 h-3" /> {request.matchedSeekers.length}</span> : <span className="text-gray-400 text-xs">{t('employerRequests.noneYet')}</span>}</td>
                    <td><StatusBadge status={request.status} /></td>
                    <td className="text-xs text-gray-400">{new Date(request.createdAt).toLocaleDateString(locale)}</td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => setViewing(request)} className="btn btn-ghost btn-sm p-1.5"><Eye className="w-4 h-4" /></button>
                        {['pending', 'under_review'].includes(request.status) && <button onClick={() => setCancelling(request)} className="btn btn-ghost btn-sm p-1.5 text-red-400 hover:bg-red-50"><X className="w-4 h-4" /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} limit={10} onPageChange={setPage} />
        </>
      )}

      <Modal isOpen={!!viewing} onClose={() => setViewing(null)} title={t('employerRequests.requestDetails')} size="lg">
        {viewing && (
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display font-bold text-navy-800 text-lg">{viewing.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="badge badge-gold">{viewing.staffType}</span>
                  <StatusBadge status={viewing.status} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                [t('employerRequests.detail.staffNeeded'), viewing.numberOfStaff],
                [t('employerRequests.detail.location'), viewing.location || t('employerRequests.notAvailable')],
                [t('employerRequests.detail.city'), viewing.city || t('employerRequests.notAvailable')],
                [t('employerRequests.detail.shift'), viewing.shift || t('employerRequests.notAvailable')],
                [t('employerRequests.detail.workTiming'), viewing.workTiming || t('employerRequests.notAvailable')],
                [t('employerRequests.detail.duration'), viewing.contractDuration || t('employerRequests.notAvailable')],
                [t('employerRequests.detail.minExperience'), viewing.minExperience || t('employerRequests.any')],
                [t('employerRequests.detail.genderPreference'), viewing.genderPreference || t('employerRequests.any')],
                [t('employerRequests.detail.salaryRange'), viewing.salaryMin ? formatText(t('employerRequests.salaryRangeValue'), { min: viewing.salaryMin, max: viewing.salaryMax || '?' }) : t('employerRequests.notAvailable')],
              ].map(([label, value]) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-sm font-semibold text-navy-800">{value}</p>
                </div>
              ))}
            </div>

            {viewing.description && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">{t('employerRequests.description')}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{viewing.description}</p>
              </div>
            )}

            {viewing.adminNotes && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs font-bold text-blue-700 mb-1">{t('employerRequests.noteFromAdmin')}</p>
                <p className="text-sm text-blue-600">{viewing.adminNotes}</p>
              </div>
            )}

            {viewing.matchedSeekers?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">{formatText(t('employerRequests.matchedCandidates'), { count: viewing.matchedSeekers.length })}</p>
                <div className="space-y-3">
                  {viewing.matchedSeekers.map((match) => (
                    <div key={match._id} className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-xl">
                      <Avatar src={match.seeker?.avatar} name={match.seeker?.name} size="sm" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-navy-800">{match.seeker?.name}</p>
                        <p className="text-xs text-gray-500">{match.seeker?.seekerProfile?.primarySkill}</p>
                      </div>
                      <div className="flex gap-2">
                        {match.seeker?.phone && <a href={`tel:${match.seeker.phone}`} className="btn btn-ghost btn-sm p-1.5 text-green-600"><Phone className="w-4 h-4" /></a>}
                        {match.seeker?.email && <a href={`mailto:${match.seeker.email}`} className="btn btn-ghost btn-sm p-1.5 text-blue-600"><Mail className="w-4 h-4" /></a>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={!!cancelling} onClose={() => setCancelling(null)} onConfirm={handleCancel} title={t('employerRequests.cancelRequest')} confirmLabel={t('employerRequests.confirmCancel')} variant="danger" loading={cancelLoading} message={formatText(t('employerRequests.cancelMessage'), { title: cancelling?.title || '' })} />
    </div>
  );
}
