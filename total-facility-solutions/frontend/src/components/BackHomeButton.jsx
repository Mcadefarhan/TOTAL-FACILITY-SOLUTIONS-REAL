import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { useLanguage } from '../context/LanguageContext';

export default function BackHomeButton({ className, variant = 'light' }) {
  const { t } = useLanguage();

  return (
    <Link
      to="/"
      className={clsx(
        'inline-flex items-center gap-2 rounded-lg text-sm font-medium transition-colors',
        variant === 'dark'
          ? 'text-white/60 hover:text-white'
          : 'text-gray-500 hover:text-gray-700',
        className
      )}
    >
      <ArrowLeft className="w-4 h-4" />
      {t('common.backToHome')}
    </Link>
  );
}
