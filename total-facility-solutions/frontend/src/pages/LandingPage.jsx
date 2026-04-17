import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Users, Zap, Star, CheckCircle, Phone, Mail, MapPin, Building2, Briefcase, HeartHandshake } from 'lucide-react';
import LanguageSelector from '../components/LanguageSelector';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const featureIcons = [Shield, Zap, Users, HeartHandshake];

export default function LandingPage() {
  const { t } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const skills = t('landing.skills');
  const stats = t('landing.stats');
  const features = t('landing.features');
  const steps = t('landing.steps');
  const testimonials = t('landing.testimonials');
  const footerLinks = t('landing.footerLinks');
  const floatingSkills = t('landing.floatingSkills');
  const seekerList = t('landing.seekerList');
  const employerList = t('landing.employerList');
  const dashboardPath = user?.role === 'admin' ? '/admin' : user?.role === 'employer' ? '/employer' : '/seeker';

  return (
    <div className="min-h-screen font-body">
      <nav className="sticky top-0 z-50 bg-navy-800/95 backdrop-blur-sm border-b border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <span className="font-display text-xl font-bold text-gold-400">{t('common.totalFacility')}</span>
              <span className="font-display text-sm text-white/40 ml-1">{t('common.solutions')}</span>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <a href="#how-it-works" className="text-sm text-white/60 hover:text-white px-3 py-2 rounded-lg hover:bg-white/8 transition-colors">{t('landing.navHow')}</a>
              <a href="#skills" className="text-sm text-white/60 hover:text-white px-3 py-2 rounded-lg hover:bg-white/8 transition-colors">{t('landing.navSkills')}</a>
              {isAuthenticated ? (
                <Link to={dashboardPath} className="btn btn-primary btn-md">Dashboard</Link>
              ) : (
                <>
                  <Link to="/login" className="btn btn-ghost btn-md text-white/70 hover:text-white hover:bg-white/10">{t('landing.signIn')}</Link>
                  <Link to="/register" className="btn btn-primary btn-md">{t('landing.getStarted')}</Link>
                </>
              )}
            </div>
            <div className="md:hidden flex gap-2">
              {isAuthenticated ? (
                <Link to={dashboardPath} className="btn btn-primary btn-sm">Dashboard</Link>
              ) : (
                <>
                  <Link to="/login" className="btn btn-ghost btn-sm text-white/70">{t('landing.signIn')}</Link>
                  <Link to="/register" className="btn btn-primary btn-sm">{t('landing.register')}</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <section className="hero-bg relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-gold-500/15 border border-gold-500/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-pulse-slow" />
              <span className="text-gold-400 text-xs font-semibold uppercase tracking-wider">{t('landing.trustedBadge')}</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              {t('landing.heroTitle1')}<br />
              <span className="text-gold-400">{t('landing.heroTitle2')}</span><br />
              <span className="text-white/70">{t('landing.heroTitle3')}</span>
            </h1>
            <p className="text-lg text-white/60 leading-relaxed mb-8 max-w-xl">
              {t('landing.heroText')}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/register?role=seeker" className="btn btn-primary btn-lg">
                {t('landing.heroWork')} <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/register?role=employer" className="btn btn-outline btn-lg border-white/30 text-white hover:bg-white hover:text-navy-800">
                {t('landing.heroStaff')}
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-3 opacity-60">
          {floatingSkills.map((skill, i) => (
            <div key={skill} className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm font-medium" style={{ transform: `translateX(${i % 2 === 0 ? '0' : '16px'})` }}>
              {`✓ ${skill}`}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-bold text-navy-800 mb-2">{t('landing.languageSectionTitle')}</h2>
            <p className="text-gray-500 mb-4">{t('landing.languageSectionText')}</p>
            <LanguageSelector />
          </div>
        </div>
      </section>

      <section className="bg-gold-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="font-display text-3xl font-bold text-navy-800">{value}</p>
                <p className="text-sm font-semibold text-navy-700 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-navy-800 mb-3">{t('landing.whyTitle')}</h2>
            <p className="text-gray-500 max-w-xl mx-auto">{t('landing.whyText')}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ title, desc }, index) => {
              const Icon = featureIcons[index];

              return (
                <div key={title} className="card-hover p-6 group">
                  <div className="w-12 h-12 bg-gold-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-gold-500/20 transition-colors">
                    <Icon className="w-6 h-6 text-gold-500" />
                  </div>
                  <h3 className="font-display font-bold text-navy-800 mb-2">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 bg-[#F7F4EF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-navy-800 mb-3">{t('landing.howTitle')}</h2>
            <p className="text-gray-500">{t('landing.howText')}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(({ n, title, desc }, i) => (
              <div key={n} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-5 left-full w-full h-px bg-gradient-to-r from-gold-500/40 to-transparent z-0" />
                )}
                <div className="card p-6 relative z-10">
                  <div className="w-10 h-10 bg-navy-800 rounded-xl flex items-center justify-center mb-4">
                    <span className="text-xs font-bold text-gold-400 font-mono">{n}</span>
                  </div>
                  <h3 className="font-display font-bold text-navy-800 mb-2">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="skills" className="py-20 bg-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-white mb-3">{t('landing.skillsTitle')}</h2>
          <p className="text-white/50 mb-10">{t('landing.skillsText')}</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {skills.map((skill) => (
              <span key={skill} className="px-4 py-2 bg-white/8 border border-white/12 rounded-full text-white/80 text-sm font-medium hover:bg-white/12 transition-colors cursor-default">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-navy-800 to-navy-700 rounded-2xl p-8 text-white">
              <div className="w-12 h-12 bg-gold-500/20 rounded-xl flex items-center justify-center mb-5">
                <Briefcase className="w-6 h-6 text-gold-400" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-3">{t('landing.seekersTitle')}</h3>
              <p className="text-white/60 mb-6 leading-relaxed">{t('landing.seekersText')}</p>
              <ul className="space-y-3 mb-8">
                {seekerList.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-white/80">
                    <CheckCircle className="w-4 h-4 text-gold-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/register?role=seeker" className="btn btn-primary btn-md">{t('landing.seekersCta')}</Link>
            </div>

            <div className="bg-[#F7F4EF] rounded-2xl p-8 border border-gray-200">
              <div className="w-12 h-12 bg-navy-800/10 rounded-xl flex items-center justify-center mb-5">
                <Building2 className="w-6 h-6 text-navy-800" />
              </div>
              <h3 className="font-display text-2xl font-bold text-navy-800 mb-3">{t('landing.employersTitle')}</h3>
              <p className="text-gray-500 mb-6 leading-relaxed">{t('landing.employersText')}</p>
              <ul className="space-y-3 mb-8">
                {employerList.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/register?role=employer" className="btn btn-secondary btn-md">{t('landing.employersCta')}</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#F7F4EF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-navy-800 mb-3">{t('landing.testimonialsTitle')}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map(({ name, role, text, rating }) => (
              <div key={`${name}-${role}`} className="card p-6">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: rating }).map((_, i) => <Star key={i} className="w-4 h-4 fill-gold-500 text-gold-500" />)}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4 italic">"{text}"</p>
                <div>
                  <p className="font-semibold text-navy-800 text-sm">{name}</p>
                  <p className="text-xs text-gray-400">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="hero-bg py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-white mb-4">{t('landing.ctaTitle')}</h2>
          <p className="text-white/60 mb-8 max-w-xl mx-auto">{t('landing.ctaText')}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            {isAuthenticated ? (
              <Link to={dashboardPath} className="btn btn-primary btn-lg">Go to Dashboard</Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">{t('landing.ctaCreate')}</Link>
                <Link to="/login" className="btn btn-outline btn-lg border-white/30 text-white hover:bg-white hover:text-navy-800">{t('landing.signIn')}</Link>
              </>
            )}
          </div>
        </div>
      </section>

      <footer className="bg-navy-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div className="lg:col-span-2">
              <p className="font-display text-xl font-bold text-gold-400 mb-1">{`${t('common.totalFacility')} ${t('common.solutions')}`}</p>
              <p className="text-white/40 text-sm leading-relaxed max-w-xs">{t('landing.since')}</p>
            </div>
            <div>
              <p className="text-white/60 font-semibold text-sm mb-3">{t('landing.platform')}</p>
              <div className="space-y-2">
                {footerLinks.map((link) => (
                  <p key={link} className="text-white/30 text-sm hover:text-white/60 cursor-pointer transition-colors">{link}</p>
                ))}
              </div>
            </div>
            <div>
              <p className="text-white/60 font-semibold text-sm mb-3">{t('landing.contact')}</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-white/30 text-sm"><Phone className="w-3.5 h-3.5" /><span>+91 7488 220 852</span></div>
                <div className="flex items-center gap-2 text-white/30 text-sm"><Mail className="w-3.5 h-3.5" /><span>totalfacultysolution@gmail.com</span></div>
                <div className="flex items-center gap-2 text-white/30 text-sm"><MapPin className="w-3.5 h-3.5" /><span>Aurangabad Bihar</span></div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/8 pt-6 text-center">
            <p className="text-white/20 text-xs">{`© ${new Date().getFullYear()} ${t('common.totalFacility')} ${t('common.solutions')}. ${t('landing.rights')}`}</p>
            <p className="text-white/30 text-xs mt-2">Developed By Md Farhan Kalim</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

