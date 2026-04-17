import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { userAPI } from '../../utils/api';
import { PageHeader, AvatarUpload } from '../../components/UI';
import toast from 'react-hot-toast';
import { Loader2, User, Lock, Shield } from 'lucide-react';

const Section = ({ title, icon: Icon, children }) => (
  <div className="card p-6 mb-5">
    <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
      <Icon className="w-4 h-4 text-gold-500" />
      <h3 className="font-display text-base font-bold text-navy-800">{title}</h3>
    </div>
    {children}
  </div>
);

export default function SeekerProfile() {
  const { user, updateUser } = useAuth();
  const { t, language } = useLanguage();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPassForm, setShowPassForm] = useState(false);
  const locale = language === 'hi' ? 'hi-IN' : 'en-IN';

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { name: user?.name || '', phone: user?.phone || '' },
  });

  const { register: rPass, handleSubmit: hPass, reset: resetPass, watch, formState: { errors: errPass } } = useForm();

  const onSaveProfile = async (data) => {
    setSavingProfile(true);
    try {
      await userAPI.updateMe(data);
      updateUser(data);
      toast.success(t('seekerProfile.profileUpdated'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('seekerProfile.updateFailed'));
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangePassword = async (data) => {
    setSavingPassword(true);
    try {
      await userAPI.changePassword({ currentPassword: data.current, newPassword: data.newPass });
      toast.success(t('seekerProfile.passwordChanged'));
      resetPass();
      setShowPassForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || t('seekerProfile.passwordChangeFailed'));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-2xl animate-fade-in">
      <PageHeader title={t('seekerProfile.title')} subtitle={t('seekerProfile.subtitle')} />

      <Section title={t('seekerProfile.profilePhoto')} icon={User}>
        <AvatarUpload
          currentAvatar={user?.avatar}
          name={user?.name}
          onSuccess={(url) => updateUser({ avatar: url })}
        />
      </Section>

      <Section title={t('seekerProfile.personalInformation')} icon={User}>
        <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-4">
          <div>
            <label className="form-label">{t('seekerProfile.fullName')}</label>
            <input
              className={`form-input ${errors.name ? 'form-input-error' : ''}`}
              {...register('name', {
                required: t('seekerProfile.nameRequired'),
                minLength: { value: 2, message: t('seekerProfile.nameTooShort') },
              })}
            />
            {errors.name && <p className="form-error">{errors.name.message}</p>}
          </div>
          <div>
            <label className="form-label">{t('seekerProfile.emailAddress')}</label>
            <input className="form-input bg-gray-50 cursor-not-allowed" value={user?.email || ''} disabled />
            <p className="text-xs text-gray-400 mt-1">{t('seekerProfile.emailLocked')}</p>
          </div>
          <div>
            <label className="form-label">{t('seekerProfile.mobileNumber')}</label>
            <input
              className={`form-input ${errors.phone ? 'form-input-error' : ''}`}
              {...register('phone', { pattern: { value: /^[6-9]\d{9}$/, message: t('seekerProfile.invalidIndianNumber') } })}
              placeholder={t('seekerProfile.mobilePlaceholder')}
            />
            {errors.phone && <p className="form-error">{errors.phone.message}</p>}
          </div>
          <button type="submit" disabled={savingProfile} className="btn btn-primary btn-md">
            {savingProfile ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('seekerProfile.saving')}</> : t('seekerProfile.saveChanges')}
          </button>
        </form>
      </Section>

      <Section title={t('seekerProfile.accountDetails')} icon={Shield}>
        <div className="space-y-3">
          {[
            [t('seekerProfile.role'), t('sidebar.seeker')],
            [t('seekerProfile.accountStatus'), t(`status.${user?.status || 'active'}`)],
            [t('seekerProfile.emailVerified'), user?.isVerified ? t('seekerProfile.verifiedYes') : t('seekerProfile.verifiedNo')],
            [
              t('seekerProfile.memberSince'),
              user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
                : t('seekerProfile.notAvailable'),
            ],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-500">{k}</span>
              <span className="text-sm font-semibold text-navy-800">{v}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title={t('seekerProfile.security')} icon={Lock}>
        {!showPassForm ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 font-medium">{t('seekerProfile.password')}</p>
              <p className="text-xs text-gray-400 mt-0.5">{t('seekerProfile.lastChangedUnknown')}</p>
            </div>
            <button onClick={() => setShowPassForm(true)} className="btn btn-outline btn-sm">{t('seekerProfile.changePassword')}</button>
          </div>
        ) : (
          <form onSubmit={hPass(onChangePassword)} className="space-y-4">
            <div>
              <label className="form-label">{t('seekerProfile.currentPassword')}</label>
              <input
                type="password"
                className={`form-input ${errPass.current ? 'form-input-error' : ''}`}
                {...rPass('current', { required: t('seekerProfile.currentPasswordRequired') })}
                placeholder={t('seekerProfile.passwordPlaceholder')}
              />
              {errPass.current && <p className="form-error">{errPass.current.message}</p>}
            </div>
            <div>
              <label className="form-label">{t('seekerProfile.newPassword')}</label>
              <input
                type="password"
                className={`form-input ${errPass.newPass ? 'form-input-error' : ''}`}
                {...rPass('newPass', {
                  required: t('seekerProfile.newPasswordRequired'),
                  minLength: { value: 8, message: t('seekerProfile.minEight') },
                  pattern: { value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: t('seekerProfile.passwordRule') },
                })}
                placeholder={t('seekerProfile.minEight')}
              />
              {errPass.newPass && <p className="form-error">{errPass.newPass.message}</p>}
            </div>
            <div>
              <label className="form-label">{t('seekerProfile.confirmNewPassword')}</label>
              <input
                type="password"
                className={`form-input ${errPass.confirm ? 'form-input-error' : ''}`}
                {...rPass('confirm', {
                  required: t('seekerProfile.confirmPasswordRequired'),
                  validate: (value) => value === watch('newPass') || t('seekerProfile.passwordsDoNotMatch'),
                })}
                placeholder={t('seekerProfile.repeatNewPassword')}
              />
              {errPass.confirm && <p className="form-error">{errPass.confirm.message}</p>}
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={savingPassword} className="btn btn-primary btn-md">
                {savingPassword ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('seekerProfile.changing')}</> : t('seekerProfile.changePassword')}
              </button>
              <button type="button" onClick={() => { setShowPassForm(false); resetPass(); }} className="btn btn-ghost btn-md">{t('seekerProfile.cancel')}</button>
            </div>
          </form>
        )}
      </Section>
    </div>
  );
}
