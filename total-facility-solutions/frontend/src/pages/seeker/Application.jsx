import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { seekerAPI } from '../../utils/api';
import { PageHeader, Alert } from '../../components/UI';
import toast from 'react-hot-toast';
import { Loader2, Save, Send, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';

const CheckTag = ({ label, checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={clsx(
      'px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all duration-150 cursor-pointer',
      checked ? 'border-gold-500 bg-gold-50 text-gold-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
    )}
  >
    {checked && <span className="mr-1">+</span>}
    {label}
  </button>
);

const Section = ({ title, children }) => (
  <div className="card p-6 mb-5">
    <h3 className="font-display text-base font-bold text-navy-800 mb-5 pb-3 border-b border-gray-100">{title}</h3>
    {children}
  </div>
);

const FRow = ({ children }) => <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;

const F = ({ label, error, required, children }) => (
  <div>
    <label className="form-label">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
    {children}
    {error && <p className="form-error mt-1">{error}</p>}
  </div>
);

const formatText = (template, values = {}) =>
  Object.entries(values).reduce((text, [key, value]) => text.replace(`{${key}}`, value), template);

const buildOptions = (canonicalValues, labels) =>
  canonicalValues.map((value, index) => ({ value, label: labels[index] || value }));

const buildLookup = (canonicalValues, labels) => {
  const lookup = {};

  canonicalValues.forEach((value, index) => {
    const label = labels[index] || value;
    lookup[value] = value;
    lookup[label] = value;
  });

  return lookup;
};

const normalizeValue = (value, lookup, fallback = '') => lookup[value] || value || fallback;
const normalizeList = (values, lookup) => (values || []).map((value) => normalizeValue(value, lookup)).filter(Boolean);

export default function SeekerApplication() {
  const { user, refreshUser } = useAuth();
  const { t, language } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const englishSkills = t('seekerApplication.skills', 'en');
  const englishDocs = t('seekerApplication.docs', 'en');
  const englishShifts = t('seekerApplication.shifts', 'en');
  const englishExperiences = t('seekerApplication.experiences', 'en');
  const englishQualifications = t('seekerApplication.qualifications', 'en');
  const translatedSkills = t('seekerApplication.skills');
  const translatedDocs = t('seekerApplication.docs');
  const translatedShifts = t('seekerApplication.shifts');
  const translatedExperiences = t('seekerApplication.experiences');
  const translatedQualifications = t('seekerApplication.qualifications');
  const appStatus = user?.seekerProfile?.applicationStatus;
  const isSubmitted = ['submitted', 'under_review', 'shortlisted', 'placed'].includes(appStatus);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const skillOptions = useMemo(() => buildOptions(englishSkills, translatedSkills), [englishSkills, translatedSkills]);
  const docOptions = useMemo(() => buildOptions(englishDocs, translatedDocs), [englishDocs, translatedDocs]);
  const shiftOptions = useMemo(() => buildOptions(englishShifts, translatedShifts), [englishShifts, translatedShifts]);
  const experienceOptions = useMemo(() => buildOptions(englishExperiences, translatedExperiences), [englishExperiences, translatedExperiences]);
  const qualificationOptions = useMemo(() => buildOptions(englishQualifications, translatedQualifications), [englishQualifications, translatedQualifications]);

  const skillLookup = useMemo(() => buildLookup(englishSkills, translatedSkills), [englishSkills, translatedSkills]);
  const docLookup = useMemo(() => buildLookup(englishDocs, translatedDocs), [englishDocs, translatedDocs]);
  const shiftLookup = useMemo(() => buildLookup(englishShifts, translatedShifts), [englishShifts, translatedShifts]);
  const experienceLookup = useMemo(() => buildLookup(englishExperiences, translatedExperiences), [englishExperiences, translatedExperiences]);
  const qualificationLookup = useMemo(() => buildLookup(englishQualifications, translatedQualifications), [englishQualifications, translatedQualifications]);

  useEffect(() => {
    const p = user?.seekerProfile || {};
    reset({
      fatherName: p.fatherName || '',
      address: p.address || '',
      city: p.city || '',
      state: p.state || '',
      pincode: p.pincode || '',
      qualification: normalizeValue(p.qualification, qualificationLookup),
      school: p.school || '',
      experience: normalizeValue(p.experience, experienceLookup, englishExperiences[0]),
      primarySkill: normalizeValue(p.primarySkill, skillLookup),
      previousWork: p.previousWork || '',
      lastCompany: p.lastCompany || '',
      workTiming: p.workTiming || '',
      preferredShift: normalizeValue(p.preferredShift, shiftLookup, englishShifts[0]),
      willingToRelocate: p.willingToRelocate ? 'yes' : 'no',
      expectedSalary: p.expectedSalary || '',
    });
    setSelectedSkills(normalizeList(p.skills, skillLookup));
    setSelectedDocs(normalizeList(p.documentsSubmitted, docLookup));
  }, [docLookup, englishExperiences, englishShifts, experienceLookup, qualificationLookup, reset, shiftLookup, skillLookup, user]);

  const toggleSkill = (skill) => setSelectedSkills((prev) => prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]);
  const toggleDoc = (doc) => setSelectedDocs((prev) => prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc]);

  const buildPayload = (data) => ({
    ...data,
    skills: selectedSkills,
    documentsSubmitted: selectedDocs,
    willingToRelocate: data.willingToRelocate === 'yes',
    expectedSalary: data.expectedSalary ? Number(data.expectedSalary) : undefined,
  });

  const onSave = async (data) => {
    setSaving(true);
    try {
      await seekerAPI.updateProfile(buildPayload(data));
      await refreshUser();
      toast.success(t('seekerApplication.saveSuccess'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('seekerApplication.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const onSubmit = async (data) => {
    if (selectedSkills.length === 0) {
      toast.error(t('seekerApplication.selectSkillError'));
      return;
    }
    setSubmitting(true);
    try {
      await seekerAPI.updateProfile(buildPayload(data));
      await seekerAPI.submitApplication();
      await refreshUser();
      toast.success(t('seekerApplication.submitSuccess'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('seekerApplication.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl animate-fade-in">
      <PageHeader title={t('seekerApplication.title')} subtitle={t('seekerApplication.subtitle')} />

      {isSubmitted && (
        <Alert
          type="info"
          className="mb-5"
          title={t('seekerApplication.alreadySubmittedTitle')}
          message={formatText(t('seekerApplication.alreadySubmittedMessage'), { status: t(`status.${appStatus}`) })}
        />
      )}

      <form>
        <Section title={t('seekerApplication.personalInfo')}>
          <FRow>
            <F label={t('seekerApplication.fatherName')} error={errors.fatherName?.message}>
              <input className="form-input" {...register('fatherName')} placeholder={t('seekerApplication.fatherNamePlaceholder')} />
            </F>
            <F label={t('seekerApplication.mobileNumber')} error={errors.phone?.message}>
              <input className="form-input" value={user?.phone || ''} disabled placeholder={t('seekerApplication.updateProfilePage')} />
            </F>
          </FRow>
          <FRow>
            <F label={t('seekerApplication.aadhaarNumber')} error={errors.aadhaar?.message}>
              <input
                className="form-input"
                {...register('aadhaar', { pattern: { value: /^\d{12}$/, message: t('seekerApplication.aadhaarRequired') } })}
                placeholder={t('seekerApplication.aadhaarPlaceholder')}
                type="password"
              />
            </F>
            <F label={t('seekerApplication.pincode')} error={errors.pincode?.message}>
              <input
                className="form-input"
                {...register('pincode', { pattern: { value: /^\d{6}$/, message: t('seekerApplication.pincodeRequired') } })}
                placeholder={t('seekerApplication.pincodePlaceholder')}
              />
            </F>
          </FRow>
          <F label={t('seekerApplication.fullAddress')} required error={errors.address?.message}>
            <input
              className="form-input"
              {...register('address', { required: t('seekerApplication.addressRequired') })}
              placeholder={t('seekerApplication.addressPlaceholder')}
            />
          </F>
          <FRow>
            <F label={t('seekerApplication.city')} error={errors.city?.message}>
              <input className="form-input" {...register('city')} placeholder={t('seekerApplication.cityPlaceholder')} />
            </F>
            <F label={t('seekerApplication.state')} error={errors.state?.message}>
              <input className="form-input" {...register('state')} placeholder={t('seekerApplication.statePlaceholder')} />
            </F>
          </FRow>
        </Section>

        <Section title={t('seekerApplication.educationDetails')}>
          <FRow>
            <F label={t('seekerApplication.highestQualification')} error={errors.qualification?.message}>
              <select className="form-select" {...register('qualification')}>
                <option value="">{t('seekerApplication.selectQualification')}</option>
                {qualificationOptions.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </F>
            <F label={t('seekerApplication.schoolName')} error={errors.school?.message}>
              <input className="form-input" {...register('school')} placeholder={t('seekerApplication.schoolPlaceholder')} />
            </F>
          </FRow>
        </Section>

        <Section title={t('seekerApplication.workExperience')}>
          <FRow>
            <F label={t('seekerApplication.experienceLevel')} required error={errors.experience?.message}>
              <select className="form-select" {...register('experience', { required: true })}>
                {experienceOptions.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </F>
            <F label={t('seekerApplication.previousWorkType')} error={errors.previousWork?.message}>
              <input className="form-input" {...register('previousWork')} placeholder={t('seekerApplication.previousWorkPlaceholder')} />
            </F>
          </FRow>
          <F label={t('seekerApplication.lastCompany')} error={errors.lastCompany?.message}>
            <input className="form-input" {...register('lastCompany')} placeholder={t('seekerApplication.lastCompanyPlaceholder')} />
          </F>
        </Section>

        <Section title={t('seekerApplication.skillsTitle')}>
          <F label={t('seekerApplication.primarySkill')} required error={errors.primarySkill?.message}>
            <select className="form-select" {...register('primarySkill', { required: t('seekerApplication.primarySkillRequired') })}>
              <option value="">{t('seekerApplication.selectPrimarySkill')}</option>
              {skillOptions.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
          </F>
          <div className="mt-4">
            <label className="form-label">{t('seekerApplication.additionalSkills')}</label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {skillOptions.map(({ value, label }) => (
                <CheckTag key={value} label={label} checked={selectedSkills.includes(value)} onChange={() => toggleSkill(value)} />
              ))}
            </div>
          </div>
        </Section>

        <Section title={t('seekerApplication.jobPreferences')}>
          <FRow>
            <F label={t('seekerApplication.preferredWorkTiming')} error={errors.workTiming?.message}>
              <input className="form-input" {...register('workTiming')} placeholder={t('seekerApplication.workTimingPlaceholder')} />
            </F>
            <F label={t('seekerApplication.expectedSalary')} error={errors.expectedSalary?.message}>
              <input
                type="number"
                className="form-input"
                {...register('expectedSalary', { min: { value: 1000, message: t('seekerApplication.salaryMin') } })}
                placeholder={t('seekerApplication.salaryPlaceholder')}
              />
            </F>
          </FRow>
          <FRow>
            <F label={t('seekerApplication.preferredShift')} error={errors.preferredShift?.message}>
              <select className="form-select" {...register('preferredShift')}>
                {shiftOptions.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </F>
            <F label={t('seekerApplication.willingToRelocate')} error={errors.willingToRelocate?.message}>
              <select className="form-select" {...register('willingToRelocate')}>
                <option value="yes">{t('seekerApplication.yes')}</option>
                <option value="no">{t('seekerApplication.no')}</option>
              </select>
            </F>
          </FRow>
        </Section>

        <Section title={t('seekerApplication.documentsSubmitted')}>
          <label className="form-label">{t('seekerApplication.availableDocuments')}</label>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {docOptions.map(({ value, label }) => (
              <CheckTag key={value} label={label} checked={selectedDocs.includes(value)} onChange={() => toggleDoc(value)} />
            ))}
          </div>
        </Section>

        <div className="card p-6 bg-navy-800 border-navy-700 mb-5">
          <p className="text-white/80 text-sm leading-relaxed">
            <span className="font-bold text-gold-400">{t('seekerApplication.declarationTitle')} </span>
            {t('seekerApplication.declarationHindi')}
          </p>
          {language !== 'hi' && (
            <p className="text-white/50 text-xs mt-2 italic">{t('seekerApplication.declarationEnglish')}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={handleSubmit(onSave)} disabled={saving || submitting} className="btn btn-outline btn-md">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('seekerApplication.saving')}</> : <><Save className="w-4 h-4" /> {t('seekerApplication.saveDraft')}</>}
          </button>
          {!isSubmitted && (
            <button type="button" onClick={handleSubmit(onSubmit)} disabled={saving || submitting} className="btn btn-primary btn-md">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('seekerApplication.submitting')}</> : <><Send className="w-4 h-4" /> {t('seekerApplication.submitApplication')}</>}
            </button>
          )}
          {isSubmitted && (
            <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
              <CheckCircle className="w-4 h-4" /> {t('seekerApplication.applicationSubmitted')}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}


