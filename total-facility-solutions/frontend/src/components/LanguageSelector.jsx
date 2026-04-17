import { clsx } from 'clsx';
import { Languages } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageSelector({ className = '', compact = false }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className={clsx('rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm', compact ? 'p-2' : 'p-4', className)}>
      <div className={clsx('flex items-center gap-2', compact && 'justify-center')}>
        <Languages className="w-4 h-4 text-gold-500" />
        {!compact && (
          <div>
            <p className="text-sm font-semibold text-navy-800">{t('common.language')}</p>
            <p className="text-xs text-gray-500">{t('common.languageHelp')}</p>
          </div>
        )}
      </div>
      <div className={clsx('mt-3 inline-flex rounded-xl bg-navy-800/5 p-1', compact && 'mt-2')}>
        {[
          { id: 'en', label: t('common.english') },
          { id: 'hi', label: t('common.hindi') },
        ].map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setLanguage(id)}
            className={clsx(
              'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
              language === id ? 'bg-navy-800 text-white shadow-sm' : 'text-gray-600 hover:text-navy-800'
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
