import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, Users, Building2, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import BackHomeButton from '../../components/BackHomeButton';
import LanguageSelector from '../../components/LanguageSelector';

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(searchParams.get('role') || 'seeker');

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await registerUser({ ...data, role });
      if (result.success) {
        toast.success(t('auth.accountCreated'));
        navigate('/verify-email', { state: { userId: result.userId, email: data.email } });
      }
    } catch (err) {
      const error = err.response?.data;
      if (error?.errors) {
        error.errors.forEach((e) => toast.error(e.message));
      } else {
        toast.error(error?.message || t('auth.registrationFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { id: 'seeker', label: t('auth.jobSeeker'), icon: Users, desc: t('auth.lookingForWork') },
    { id: 'employer', label: t('auth.employer'), icon: Building2, desc: t('auth.needStaff') },
  ];

  return (
    <div className="min-h-screen bg-[#F7F4EF] flex">
      <div className="hidden lg:flex lg:w-2/5 hero-bg flex-col justify-between p-10">
        <div className="space-y-6">
          <BackHomeButton variant="dark" />
          <LanguageSelector className="bg-white/10 border-white/10" />
        </div>
        <div>
          <p className="font-display text-3xl font-bold text-gold-400 mb-1">{t('auth.joinPlatform')}</p>
          <p className="text-white/50 mt-4 leading-relaxed max-w-xs">{t('auth.registerIntro')}</p>
          <div className="mt-10 grid grid-cols-1 gap-4">
            <div className="bg-white/8 border border-white/12 rounded-xl p-4">
              <p className="text-gold-400 font-semibold text-sm mb-1">{t('auth.forJobSeekers')}</p>
              <p className="text-white/50 text-xs">{t('auth.seekerCardText')}</p>
            </div>
            <div className="bg-white/8 border border-white/12 rounded-xl p-4">
              <p className="text-gold-400 font-semibold text-sm mb-1">{t('auth.forEmployers')}</p>
              <p className="text-white/50 text-xs">{t('auth.employerCardText')}</p>
            </div>
          </div>
        </div>
        <p className="text-white/20 text-xs">{t('common.footerCopyright')}</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden mb-6 space-y-4">
            <BackHomeButton />
            <LanguageSelector compact />
          </div>

          <div className="mb-6">
            <h1 className="font-display text-3xl font-bold text-navy-800 mb-2">{t('auth.createAccount')}</h1>
            <p className="text-gray-500">{t('auth.joinFree')}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {roleOptions.map(({ id, label, icon: Icon, desc }) => (
              <button key={id} type="button" onClick={() => setRole(id)}
                className={clsx('p-4 rounded-xl border-2 text-left transition-all duration-150',
                  role === id ? 'border-gold-500 bg-gold-50' : 'border-gray-200 bg-white hover:border-gray-300')}>
                <div className="flex items-center justify-between mb-2">
                  <Icon className={clsx('w-5 h-5', role === id ? 'text-gold-500' : 'text-gray-400')} />
                  {role === id && <div className="w-4 h-4 bg-gold-500 rounded-full flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white" /></div>}
                </div>
                <p className={clsx('font-semibold text-sm', role === id ? 'text-navy-800' : 'text-gray-600')}>{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="form-label">{t('auth.fullName')}</label>
              <input
                {...register('name', { required: t('auth.nameRequired'), minLength: { value: 2, message: t('auth.nameTooShort') } })}
                className={`form-input ${errors.name ? 'form-input-error' : ''}`}
                placeholder={t('auth.yourFullName')}
                autoComplete="name"
              />
              {errors.name && <p className="form-error">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">{t('auth.emailAddress')} *</label>
                <input
                  type="email"
                  {...register('email', { required: t('auth.emailRequired'), pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t('auth.enterValidEmail') } })}
                  className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                  placeholder={t('auth.emailPlaceholder')}
                />
                {errors.email && <p className="form-error">{errors.email.message}</p>}
              </div>
              <div>
                <label className="form-label">{t('auth.mobileNumber')}</label>
                <input
                  {...register('phone', { pattern: { value: /^[6-9]\d{9}$/, message: t('auth.invalidNumber') } })}
                  className={`form-input ${errors.phone ? 'form-input-error' : ''}`}
                  placeholder={t('auth.mobilePlaceholder')}
                />
                {errors.phone && <p className="form-error">{errors.phone.message}</p>}
              </div>
            </div>

            <div>
              <label className="form-label">{t('auth.password')} *</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  {...register('password', {
                    required: t('auth.passwordRequired'),
                    minLength: { value: 8, message: t('auth.minEight') },
                    pattern: { value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: t('auth.passwordRule') },
                  })}
                  className={`form-input pr-11 ${errors.password ? 'form-input-error' : ''}`}
                  placeholder={t('auth.passwordRulePlaceholder')}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full mt-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('auth.createAccountLoading')}</> : role === 'seeker' ? t('auth.createSeekerAccount') : t('auth.createEmployerAccount')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link to="/login" className="text-gold-600 font-semibold hover:text-gold-500">{t('auth.signIn')}</Link>
          </p>

          <p className="text-center text-xs text-gray-400 mt-4">
            {t('auth.byRegistering')}
          </p>
        </div>
      </div>
    </div>
  );
}
