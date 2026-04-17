import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import BackHomeButton from '../../components/BackHomeButton';
import LanguageSelector from '../../components/LanguageSelector';

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await login(data.email, data.password);
      if (result.success) {
        toast.success(`${t('auth.welcomeBackToast')}, ${result.user.name}!`);
        const redirect = result.user.role === 'admin' ? '/admin' : result.user.role === 'employer' ? '/employer' : '/seeker';
        navigate(redirect, { replace: true });
      }
    } catch (err) {
      const error = err.response?.data;
      if (error?.code === 'EMAIL_NOT_VERIFIED') {
        toast.error(t('auth.verifyEmailFirst'));
        navigate('/verify-email', { state: { userId: error.userId } });
      } else {
        toast.error(error?.message || t('auth.invalidEmailOrPassword'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4EF] flex">
      <div className="hidden lg:flex lg:w-2/5 hero-bg flex-col justify-between p-10">
        <div className="space-y-6">
          <BackHomeButton variant="dark" />
          <LanguageSelector className="bg-white/10 border-white/10" />
        </div>
        <div>
          <p className="font-display text-3xl font-bold text-gold-400 mb-1">{t('common.totalFacility')}</p>
          <p className="font-display text-xl text-white/40">{t('common.solutions')}</p>
          <p className="text-white/50 mt-6 leading-relaxed max-w-xs">{t('common.trustedPlatform')}</p>
          <div className="mt-10 space-y-3">
            {[t('common.secureAccounts'), t('common.tracking'), t('common.adminMatching')].map((item) => (
              <p key={item} className="text-white/60 text-sm">{`✓ ${item}`}</p>
            ))}
          </div>
        </div>
        <p className="text-white/20 text-xs">{t('common.footerCopyright')}</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden mb-6 space-y-4">
            <BackHomeButton />
            <LanguageSelector compact />
          </div>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-navy-800 mb-2">{t('auth.welcomeBack')}</h1>
            <p className="text-gray-500">{t('auth.signInContinue')}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="form-label">{t('auth.emailAddress')}</label>
              <input
                type="email"
                {...register('email', {
                  required: t('auth.emailIsRequired'),
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t('auth.enterValidEmail') },
                })}
                className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                placeholder={t('auth.emailPlaceholder')}
                autoComplete="email"
              />
              {errors.email && <p className="form-error"><span>{errors.email.message}</span></p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="form-label mb-0">{t('auth.password')}</label>
                <Link to="/forgot-password" className="text-xs text-gold-600 hover:text-gold-500 transition-colors">{t('auth.forgotPassword')}</Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  {...register('password', { required: t('auth.passwordRequired') })}
                  className={`form-input pr-11 ${errors.password ? 'form-input-error' : ''}`}
                  placeholder={t('auth.passwordPlaceholder')}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="form-error"><span>{errors.password.message}</span></p>}
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full mt-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('auth.signingIn')}</> : t('auth.signIn')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t('auth.dontHaveAccount')}{' '}
            <Link to="/register" className="text-gold-600 font-semibold hover:text-gold-500 transition-colors">{t('auth.createOneFree')}</Link>
          </p>

          
        </div>
      </div>
    </div>
  );
}
