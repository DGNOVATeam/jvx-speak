import { useEffect, useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut, Moon, Shield, Sun } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { InstallAppPrompt } from '@/components/pwa/InstallAppPrompt';
import { LocaleSelector, useI18n } from '@/lib/i18n';

const NAV_ITEMS = [
  { to: '/', labelKey: 'nav_home', iconName: 'home' },
  { to: '/courses', labelKey: 'nav_courses', iconName: 'courses' },
  { to: '/skills', labelKey: 'nav_skills', iconName: 'progress' },
  { to: '/schedule', labelKey: 'nav_schedule', iconName: 'calendar' },
  { to: '/settings', labelKey: 'nav_settings', iconName: 'settings' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const { t } = useI18n();
  const [dark, setDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex bg-[#F4F6FA] dark:bg-[#06152B] text-[#0B1F3B] dark:text-white">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r border-slate-200 dark:border-[#1F4E79]/40 bg-white dark:bg-[#0B1F3B]">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-[#1F4E79]/40">
          <img
            src={
              dark
                ? '/JVX_SPEAK_Brand_Kit/logos/horizontal-dark.svg'
                : '/JVX_SPEAK_Brand_Kit/logos/horizontal-light.svg'
            }
            alt="JVX SPEAK"
            className="h-10 w-auto"
          />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-[#D4AF37] text-[#0B1F3B] shadow-sm'
                    : 'text-[#0B1F3B]/80 dark:text-slate-200 hover:bg-[#F4F6FA] dark:hover:bg-[#1F4E79]/40'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <img
                    src={`/JVX_SPEAK_Brand_Kit/icons/${item.iconName}-${
                      isActive ? 'navy' : dark ? 'gold' : 'navy'
                    }.svg`}
                    alt=""
                    className="h-4 w-4 shrink-0"
                  />
                  <span>{t(item.labelKey)}</span>
                </>
              )}
            </NavLink>
          ))}
          {profile?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-[#D4AF37] text-[#0B1F3B] shadow-sm'
                    : 'text-[#D4AF37] hover:bg-[#F4F6FA] dark:hover:bg-[#1F4E79]/40'
                }`
              }
            >
              <Shield className="h-4 w-4 shrink-0" />
              <span>{t('nav_admin')}</span>
            </NavLink>
          )}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-[#1F4E79]/40 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <LocaleSelector compact />
            <button
              type="button"
              onClick={() => setDark((d) => !d)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1F4E79]/50 text-[#D4AF37]"
              title="Alternar tema"
              aria-label="Alternar tema claro e escuro"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
          <InstallAppPrompt variant="sidebar" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-300 truncate">
              {profile?.full_name || t('student_default')}
            </span>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1F4E79]/40"
          >
            <LogOut className="h-4 w-4" />
            {t('nav_signout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 w-full flex flex-col pb-16 md:pb-0">
        <header className="md:hidden flex items-center justify-between gap-2 px-3 py-3 border-b border-slate-200 dark:border-[#1F4E79]/40 bg-white dark:bg-[#0B1F3B] min-w-0">
          <img
            src={
              dark
                ? '/JVX_SPEAK_Brand_Kit/logos/horizontal-dark.svg'
                : '/JVX_SPEAK_Brand_Kit/logos/horizontal-light.svg'
            }
            alt="JVX SPEAK"
            className="h-8 w-auto"
          />
          <div className="flex items-center gap-2">
            <LocaleSelector compact />
            <InstallAppPrompt variant="header" />
            <button
              type="button"
              onClick={() => setDark((d) => !d)}
              className="p-1.5 rounded-lg text-[#D4AF37]"
              aria-label="Alternar tema claro e escuro"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        <main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">{children}</main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 border-t border-slate-200 dark:border-[#1F4E79]/40 bg-white dark:bg-[#0B1F3B] flex justify-around py-2 z-40">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[11px] font-semibold ${
                isActive ? 'text-[#D4AF37]' : 'text-slate-500 dark:text-slate-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <img
                  src={`/JVX_SPEAK_Brand_Kit/icons/${item.iconName}-${
                    isActive ? 'gold' : dark ? 'white' : 'navy'
                  }.svg`}
                  alt=""
                  className="h-4 w-4"
                />
                <span>{t(item.labelKey)}</span>
              </>
            )}
          </NavLink>
        ))}
        {profile?.role === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[11px] font-semibold ${
                isActive ? 'text-[#D4AF37]' : 'text-slate-500 dark:text-slate-300'
              }`
            }
          >
            <Shield className="h-4 w-4" />
            <span>Admin</span>
          </NavLink>
        )}
      </nav>
    </div>
  );
}
