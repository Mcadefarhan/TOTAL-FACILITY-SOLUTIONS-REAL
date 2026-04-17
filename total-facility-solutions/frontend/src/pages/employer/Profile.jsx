import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { employerAPI } from '../../utils/api';
import { PageHeader, AvatarUpload } from '../../components/UI';
import toast from 'react-hot-toast';
import { Loader2, Building2, User } from 'lucide-react';

const Section = ({ title, icon: Icon, children }) => (
  <div className="card p-6 mb-5">
    <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
      <Icon className="w-4 h-4 text-gold-500" />
      <h3 className="font-display text-base font-bold text-navy-800">{title}</h3>
    </div>
    {children}
  </div>
);

const buildOptions = (canonicalValues, labels) =>
  canonicalValues.map((value, index) => ({ value, label: labels[index] || value }));

export function EmployerProfile() {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);

  const businessTypeOptions = buildOptions(t('employerProfile.businessTypes', 'en'), t('employerProfile.businessTypes'));

  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      businessName: user?.employerProfile?.businessName || '',
      businessType: user?.employerProfile?.businessType || '',
      gstNumber: user?.employerProfile?.gstNumber || '',
      businessAddress: user?.employerProfile?.businessAddress || '',
      city: user?.employerProfile?.city || '',
      state: user?.employerProfile?.state || '',
      website: user?.employerProfile?.website || '',
      description: user?.employerProfile?.description || '',
    },
  });

  const onSave = async (data) => {
    setSaving(true);
    try {
      await employerAPI.updateProfile(data);
      updateUser({ name: data.name, phone: data.phone, employerProfile: { ...(user?.employerProfile || {}), ...data } });
      toast.success(t('employerProfile.profileUpdated'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('employerProfile.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl animate-fade-in">
      <PageHeader title={t('employerProfile.title')} subtitle={t('employerProfile.subtitle')} />

      <Section title={t('employerProfile.profilePhoto')} icon={User}>
        <AvatarUpload currentAvatar={user?.avatar} name={user?.name} onSuccess={(url) => updateUser({ avatar: url })} />
      </Section>

      <form onSubmit={handleSubmit(onSave)}>
        <Section title={t('employerProfile.accountInformation')} icon={User}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">{t('employerProfile.yourName')}</label>
              <input className="form-input" {...register('name', { required: true })} />
            </div>
            <div>
              <label className="form-label">{t('employerProfile.mobileNumber')}</label>
              <input className="form-input" {...register('phone')} placeholder={t('employerProfile.mobilePlaceholder')} />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">{t('employerProfile.email')}</label>
              <input className="form-input bg-gray-50" value={user?.email || ''} disabled />
            </div>
          </div>
        </Section>

        <Section title={t('employerProfile.businessInformation')} icon={Building2}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">{t('employerProfile.businessName')}</label>
              <input className="form-input" {...register('businessName')} placeholder={t('employerProfile.businessNamePlaceholder')} />
            </div>
            <div>
              <label className="form-label">{t('employerProfile.businessType')}</label>
              <select className="form-select" {...register('businessType')}>
                <option value="">{t('employerProfile.selectType')}</option>
                {businessTypeOptions.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">{t('employerProfile.gstNumber')}</label>
              <input className="form-input" {...register('gstNumber')} placeholder={t('employerProfile.gstPlaceholder')} />
            </div>
            <div>
              <label className="form-label">{t('employerProfile.website')}</label>
              <input className="form-input" {...register('website')} placeholder={t('employerProfile.websitePlaceholder')} />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">{t('employerProfile.businessAddress')}</label>
              <input className="form-input" {...register('businessAddress')} placeholder={t('employerProfile.businessAddressPlaceholder')} />
            </div>
            <div>
              <label className="form-label">{t('employerProfile.city')}</label>
              <input className="form-input" {...register('city')} placeholder={t('employerProfile.cityPlaceholder')} />
            </div>
            <div>
              <label className="form-label">{t('employerProfile.state')}</label>
              <input className="form-input" {...register('state')} placeholder={t('employerProfile.statePlaceholder')} />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">{t('employerProfile.businessDescription')}</label>
              <textarea className="form-input" rows="3" {...register('description')} placeholder={t('employerProfile.businessDescriptionPlaceholder')} style={{ resize: 'vertical' }} />
            </div>
          </div>
        </Section>

        <button type="submit" disabled={saving} className="btn btn-primary btn-lg">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('employerProfile.saving')}</> : t('employerProfile.saveProfile')}
        </button>
      </form>
    </div>
  );
}

export default EmployerProfile;
