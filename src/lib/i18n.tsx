import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type UiLocale = 'pt-BR' | 'es' | 'en';

const STORAGE_KEY = 'jvx_ui_locale';

const DICTIONARY: Record<UiLocale, Record<string, string>> = {
  'pt-BR': {
    nav_home: 'Início',
    nav_courses: 'Cursos',
    nav_skills: 'Progresso CEFR',
    nav_schedule: 'Agenda SRS',
    nav_settings: 'Meu Plano',
    nav_admin: 'Gestão Admin',
    nav_signout: 'Sair',
    student_default: 'Aluno',
    native_lang_label: 'Seu idioma nativo',
    native_lang_hint: 'Usado para adaptar dicas gramaticais e evitar erros comuns do seu idioma.',
    ui_lang_label: 'Idioma da interface',
    login_subtitle: 'Learn. Speak. Evolve. Sua jornada CEFR personalizada com IA.',
    login_tab_signin: 'Entrar',
    login_tab_signup: 'Criar conta',
    login_name: 'Nome completo',
    login_email: 'E-mail',
    login_password: 'Senha',
    login_btn_signin: 'Entrar na Plataforma',
    login_btn_signup: 'Criar minha conta',
    step_1: '1. Input & Regras',
    step_2: '2. Fixação (XP)',
    step_3: '3. Prática Guiada IA',
    step_4: '4. Exercício Final',
    admin_title: 'Painel Super Admin — Gestão SaaS',
    admin_subtitle: 'Acompanhe alunos matriculados, tempo de estudo, revisões SRS e evolução CEFR.',
    admin_tab_students: 'Alunos & KPIs',
    admin_tab_billing: 'Planos & Financeiro',
    admin_tab_school: 'Configurações da Escola',
  },
  es: {
    nav_home: 'Inicio',
    nav_courses: 'Cursos',
    nav_skills: 'Progreso CEFR',
    nav_schedule: 'Agenda SRS',
    nav_settings: 'Mi Plan',
    nav_admin: 'Gestión Admin',
    nav_signout: 'Salir',
    student_default: 'Alumno',
    native_lang_label: 'Tu idioma nativo',
    native_lang_hint: 'Se usa para adaptar consejos gramaticales y evitar errores típicos de tu idioma.',
    ui_lang_label: 'Idioma de la interfaz',
    login_subtitle: 'Learn. Speak. Evolve. Tu ruta CEFR personalizada con IA.',
    login_tab_signin: 'Iniciar sesión',
    login_tab_signup: 'Crear cuenta',
    login_name: 'Nombre completo',
    login_email: 'Correo electrónico',
    login_password: 'Contraseña',
    login_btn_signin: 'Entrar a la Plataforma',
    login_btn_signup: 'Crear mi cuenta',
    step_1: '1. Input y Reglas',
    step_2: '2. Fijación (XP)',
    step_3: '3. Práctica Guiada IA',
    step_4: '4. Ejercicio Final',
    admin_title: 'Panel Super Admin — Gestión SaaS',
    admin_subtitle: 'Supervisa alumnos inscritos, tiempo de estudio, repasos SRS y evolución CEFR.',
    admin_tab_students: 'Alumnos y KPIs',
    admin_tab_billing: 'Planes y Finanzas',
    admin_tab_school: 'Configuración de Escuela',
  },
  en: {
    nav_home: 'Home',
    nav_courses: 'Courses',
    nav_skills: 'CEFR Progress',
    nav_schedule: 'SRS Schedule',
    nav_settings: 'My Plan',
    nav_admin: 'Admin Panel',
    nav_signout: 'Sign out',
    student_default: 'Student',
    native_lang_label: 'Your native language',
    native_lang_hint: 'Used to tailor grammar tips and prevent common mistakes from your native tongue.',
    ui_lang_label: 'Interface language',
    login_subtitle: 'Learn. Speak. Evolve. Your personalized AI-powered CEFR journey.',
    login_tab_signin: 'Sign in',
    login_tab_signup: 'Create account',
    login_name: 'Full name',
    login_email: 'Email',
    login_password: 'Password',
    login_btn_signin: 'Sign in to Platform',
    login_btn_signup: 'Create my account',
    step_1: '1. Input & Rules',
    step_2: '2. Fixation (XP)',
    step_3: '3. AI Guided Practice',
    step_4: '4. Final Exercise',
    admin_title: 'Super Admin — SaaS Management',
    admin_subtitle: 'Track enrolled students, study time, SRS reviews, and CEFR progression.',
    admin_tab_students: 'Students & KPIs',
    admin_tab_billing: 'Plans & Billing',
    admin_tab_school: 'School Settings',
  },
};

export function normalizeUiLocale(raw?: string | null): UiLocale {
  if (raw === 'es' || raw === 'es-ES') return 'es';
  if (raw === 'en' || raw === 'en-US') return 'en';
  return 'pt-BR';
}

interface I18nContextValue {
  locale: UiLocale;
  setLocale: (loc: UiLocale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<UiLocale>(() => {
    if (typeof window === 'undefined') return 'pt-BR';
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'pt-BR' || saved === 'es' || saved === 'en') return saved;
    const navLang = navigator.language?.toLowerCase() ?? '';
    if (navLang.startsWith('es')) return 'es';
    if (navLang.startsWith('en')) return 'en';
    return 'pt-BR';
  });

  const setLocale = (loc: UiLocale) => {
    setLocaleState(loc);
    try {
      localStorage.setItem(STORAGE_KEY, loc);
    } catch {
      // ignore storage errors
    }
  };

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = (key: string) => DICTIONARY[locale][key] ?? DICTIONARY['pt-BR'][key] ?? key;

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}

export function LocaleSelector({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useI18n();
  const options: Array<{ code: UiLocale; label: string }> = [
    { code: 'pt-BR', label: 'PT' },
    { code: 'es', label: 'ES' },
    { code: 'en', label: 'EN' },
  ];

  return (
    <div
      className={`inline-flex items-center rounded-lg border border-slate-200 dark:border-[#1F4E79]/60 bg-slate-100 dark:bg-[#06152B] p-0.5 ${
        compact ? 'text-[10px]' : 'text-xs'
      }`}
      role="group"
      aria-label="Selecionar idioma da interface"
    >
      {options.map((opt) => (
        <button
          key={opt.code}
          type="button"
          onClick={() => setLocale(opt.code)}
          className={`rounded-md font-bold transition ${compact ? 'px-1.5 py-0.5' : 'px-2 py-1'} ${
            locale === opt.code
              ? 'bg-[#D4AF37] text-[#0B1F3B]'
              : 'text-slate-500 dark:text-slate-300 hover:text-[#D4AF37]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
