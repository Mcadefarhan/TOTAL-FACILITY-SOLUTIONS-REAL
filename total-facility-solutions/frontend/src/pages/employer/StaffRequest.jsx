import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useLanguage } from '../../context/LanguageContext';
import { employerAPI } from '../../utils/api';
import { PageHeader, Alert } from '../../components/UI';
import toast from 'react-hot-toast';
import { Loader2, Send } from 'lucide-react';

const F = ({ label, required, error, children }) => (
  <div>
    <label className="form-label">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
    {children}
    {error && <p className="form-error mt-1">{error}</p>}
  </div>
);

const Row = ({ children }) => <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;

const buildOptions = (canonicalValues, labels) =>
  canonicalValues.map((value, index) => ({ value, label: labels[index] || value }));

export default function StaffRequest() {
  const { t } = useLanguage();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const staffTypeOptions = buildOptions(t('employerStaffRequest.staffTypes', 'en'), t('employerStaffRequest.staffTypes'));
  const shiftOptions = buildOptions(t('employerStaffRequest.shiftOptions', 'en'), t('employerStaffRequest.shiftOptions'));
  const minExperienceOptions = buildOptions(t('employerStaffRequest.minExperienceOptions', 'en'), t('employerStaffRequest.minExperienceOptions'));
  const genderOptions = buildOptions(t('employerStaffRequest.genderOptions', 'en'), t('employerStaffRequest.genderOptions'));
  const qualificationOptions = buildOptions(t('employerStaffRequest.qualificationOptions', 'en'), t('employerStaffRequest.qualificationOptions'));

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await employerAPI.createRequest({
        ...data,
        numberOfStaff: parseInt(data.numberOfStaff, 10),
        salaryMin: data.salaryMin ? parseInt(data.salaryMin, 10) : undefined,
        salaryMax: data.salaryMax ? parseInt(data.salaryMax, 10) : undefined,
      });
      toast.success(t('employerStaffRequest.submitSuccess'));
      navigate('/employer/requests');
    } catch (err) {
      const error = err.response?.data;
      if (error?.errors) error.errors.forEach((item) => toast.error(item.message));
      else toast.error(error?.message || t('employerStaffRequest.submitFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl animate-fade-in">
      <PageHeader title={t('employerStaffRequest.title')} subtitle={t('employerStaffRequest.subtitle')} />

      <Alert type="info" className="mb-5" message={t('employerStaffRequest.alertMessage')} />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card p-6 mb-5">
          <h3 className="font-display text-base font-bold text-navy-800 mb-5 pb-3 border-b border-gray-100">{t('employerStaffRequest.businessInformation')}</h3>
          <Row>
            <F label={t('employerStaffRequest.requestTitle')} required error={errors.title?.message}>
              <input className="form-input" {...register('title', { required: t('employerStaffRequest.titleRequired') })} placeholder={t('employerStaffRequest.requestTitlePlaceholder')} />
            </F>
            <F label={t('employerStaffRequest.staffType')} required error={errors.staffType?.message}>
              <select className="form-select" {...register('staffType', { required: t('employerStaffRequest.staffTypeRequired') })}>
                <option value="">{t('employerStaffRequest.selectType')}</option>
                {staffTypeOptions.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </F>
          </Row>
          <Row>
            <F label={t('employerStaffRequest.numberOfStaff')} required error={errors.numberOfStaff?.message}>
              <input type="number" className="form-input" {...register('numberOfStaff', { required: t('employerStaffRequest.required'), min: { value: 1, message: t('employerStaffRequest.minOne') }, max: { value: 500, message: t('employerStaffRequest.maxFiveHundred') } })} placeholder={t('employerStaffRequest.numberOfStaffPlaceholder')} min="1" />
            </F>
            <F label={t('employerStaffRequest.location')} required error={errors.location?.message}>
              <input className="form-input" {...register('location', { required: t('employerStaffRequest.locationRequired') })} placeholder={t('employerStaffRequest.locationPlaceholder')} />
            </F>
          </Row>
          <Row>
            <F label={t('employerStaffRequest.city')} error={errors.city?.message}>
              <input className="form-input" {...register('city')} placeholder={t('employerStaffRequest.cityPlaceholder')} />
            </F>
            <F label={t('employerStaffRequest.state')} error={errors.state?.message}>
              <input className="form-input" {...register('state')} placeholder={t('employerStaffRequest.statePlaceholder')} />
            </F>
          </Row>
        </div>

        <div className="card p-6 mb-5">
          <h3 className="font-display text-base font-bold text-navy-800 mb-5 pb-3 border-b border-gray-100">{t('employerStaffRequest.jobRequirements')}</h3>
          <Row>
            <F label={t('employerStaffRequest.workTiming')} error={errors.workTiming?.message}>
              <input className="form-input" {...register('workTiming')} placeholder={t('employerStaffRequest.workTimingPlaceholder')} />
            </F>
            <F label={t('employerStaffRequest.shiftPreference')} error={errors.shift?.message}>
              <select className="form-select" {...register('shift')}>
                {shiftOptions.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </F>
          </Row>
          <Row>
            <F label={t('employerStaffRequest.minimumSalary')} error={errors.salaryMin?.message}>
              <input type="number" className="form-input" {...register('salaryMin', { min: { value: 1000, message: t('employerStaffRequest.minSalary') } })} placeholder={t('employerStaffRequest.minimumSalaryPlaceholder')} />
            </F>
            <F label={t('employerStaffRequest.maximumSalary')} error={errors.salaryMax?.message}>
              <input type="number" className="form-input" {...register('salaryMax')} placeholder={t('employerStaffRequest.maximumSalaryPlaceholder')} />
            </F>
          </Row>
          <Row>
            <F label={t('employerStaffRequest.contractDuration')} error={errors.contractDuration?.message}>
              <input className="form-input" {...register('contractDuration')} placeholder={t('employerStaffRequest.contractDurationPlaceholder')} />
            </F>
            <F label={t('employerStaffRequest.minimumExperience')} error={errors.minExperience?.message}>
              <select className="form-select" {...register('minExperience')}>
                <option value="">{t('employerStaffRequest.anyExperience')}</option>
                {minExperienceOptions.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </F>
          </Row>
          <Row>
            <F label={t('employerStaffRequest.genderPreference')} error={errors.genderPreference?.message}>
              <select className="form-select" {...register('genderPreference')}>
                {genderOptions.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </F>
            <F label={t('employerStaffRequest.qualificationRequired')} error={errors.qualificationRequired?.message}>
              <select className="form-select" {...register('qualificationRequired')}>
                <option value="">{t('employerStaffRequest.anyQualification')}</option>
                {qualificationOptions.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </F>
          </Row>
          <F label={t('employerStaffRequest.jobDescription')} error={errors.description?.message}>
            <textarea className="form-input" rows="3" {...register('description', { maxLength: { value: 2000, message: t('employerStaffRequest.maxTwoThousandChars') } })} placeholder={t('employerStaffRequest.jobDescriptionPlaceholder')} style={{ resize: 'vertical' }} />
          </F>
          <F label={t('employerStaffRequest.specialRequirements')} error={errors.specialRequirements?.message}>
            <textarea className="form-input" rows="2" {...register('specialRequirements')} placeholder={t('employerStaffRequest.specialRequirementsPlaceholder')} style={{ resize: 'vertical' }} />
          </F>
        </div>

        <div className="card p-5 bg-navy-800 border-navy-700 mb-5">
          <p className="text-white/70 text-sm">{t('employerStaffRequest.declaration')}</p>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn btn-primary btn-lg">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('employerStaffRequest.submitting')}</> : <><Send className="w-4 h-4" /> {t('employerStaffRequest.submitRequest')}</>}
          </button>
          <button type="button" onClick={() => navigate('/employer')} className="btn btn-ghost btn-md">{t('employerStaffRequest.cancel')}</button>
        </div>
      </form>
    </div>
  );
}
