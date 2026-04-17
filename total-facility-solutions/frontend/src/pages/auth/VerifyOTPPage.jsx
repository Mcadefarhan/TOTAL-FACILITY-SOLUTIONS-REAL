import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2, Mail, ArrowLeft, RotateCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { authAPI } from '../../utils/api';
import BackHomeButton from '../../components/BackHomeButton';
import LanguageSelector from '../../components/LanguageSelector';

export function VerifyOTPPage() {
  const { verifyOTP } = useAuth();
  const { t } = useLanguage();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const refs = useRef([]);

  useEffect(() => {
    if (!state?.userId) {
      navigate('/login');
      return;
    }
    const timer = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [navigate, state?.userId]);

  const handleVerify = async (code) => {
    setLoading(true);
    try {
      const result = await verifyOTP(state.userId, code);
      if (result.success) {
        toast.success(t('auth.emailVerified'));
        const redirect = result.user.role === 'admin' ? '/admin' : result.user.role === 'employer' ? '/employer' : '/seeker';
        navigate(redirect, { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t('auth.invalidOtp'));
      setOtp(['', '', '', '', '', '']);
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
    if (next.every((digit) => digit) && next.join('').length === 6) handleVerify(next.join(''));
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      handleVerify(pasted);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authAPI.resendOTP({ userId: state.userId });
      toast.success(t('auth.newCodeSent'));
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      toast.error(err.response?.data?.message || t('auth.failedToResend'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in space-y-4">
        <BackHomeButton />
        <LanguageSelector compact />
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-navy-800/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Mail className="w-8 h-8 text-navy-800" />
          </div>
          <h1 className="font-display text-2xl font-bold text-navy-800 mb-2">{t('auth.checkEmail')}</h1>
          <p className="text-gray-500 text-sm mb-2">{t('auth.sentCode')}</p>
          <p className="font-semibold text-navy-800 mb-7">{state?.email || t('auth.yourEmailAddress')}</p>

          <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { refs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="otp-input"
                maxLength={1}
                disabled={loading}
              />
            ))}
          </div>

          <button onClick={() => handleVerify(otp.join(''))} disabled={loading || otp.some((digit) => !digit)}
            className="btn btn-primary btn-lg w-full mb-4">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('auth.verifying')}</> : t('auth.verifyEmail')}
          </button>

          <div className="text-sm text-gray-500">
            {t('auth.didntReceive')}{' '}
            {countdown > 0 ? (
              <span className="text-gray-400">{`${t('auth.resendIn')} ${countdown}s`}</span>
            ) : (
              <button onClick={handleResend} disabled={resending} className="text-gold-600 font-semibold hover:text-gold-500">
                {resending ? <><RotateCcw className="w-3 h-3 inline animate-spin mr-1" />{t('auth.sending')}</> : t('auth.resendCode')}
              </button>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-3.5 h-3.5" /> {t('auth.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { authAPI: api } = await import('../../utils/api');
      await api.forgotPassword({ email });
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in space-y-4">
        <BackHomeButton />
        <LanguageSelector compact />
        <div className="card p-8">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6">
            <ArrowLeft className="w-3.5 h-3.5" /> {t('auth.backToLogin')}
          </Link>
          <h1 className="font-display text-2xl font-bold text-navy-800 mb-2">{t('auth.resetPassword')}</h1>
          <p className="text-gray-500 text-sm mb-6">{t('auth.resetIntro')}</p>
          {sent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
              <p className="font-semibold text-navy-800 mb-1">{t('auth.checkInbox')}</p>
              <p className="text-sm text-gray-500">{t('auth.resetSent')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">{t('auth.emailAddress')}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="form-input" placeholder={t('auth.emailPlaceholder')} />
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('auth.sending')}</> : t('auth.sendResetLink')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export function ResetPasswordPage() {
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error(t('auth.passwordMinLength'));
      return;
    }
    setLoading(true);
    try {
      const { authAPI: api } = await import('../../utils/api');
      await api.resetPassword({ token: params.get('token'), userId: params.get('id'), password });
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      toast.error(err.response?.data?.message || t('auth.resetFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in space-y-4">
        <BackHomeButton />
        <LanguageSelector compact />
        <div className="card p-8">
          <h1 className="font-display text-2xl font-bold text-navy-800 mb-2">{t('auth.createNewPassword')}</h1>
          <p className="text-gray-500 text-sm mb-6">{t('auth.newPasswordIntro')}</p>
          {done ? (
            <div className="text-center py-4">
              <p className="font-semibold text-green-600 mb-1">{t('auth.passwordResetSuccess')}</p>
              <p className="text-sm text-gray-500">{t('auth.redirectingLogin')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">{t('auth.newPassword')}</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="form-input" placeholder={t('auth.minChars')} />
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('auth.resetting')}</> : t('auth.resetPassword')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyOTPPage;
