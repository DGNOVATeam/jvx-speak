import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { LocaleSelector, useI18n, type UiLocale } from '@/lib/i18n';

const authSchema = z.object({
  fullName: z.string().optional(),
  email: z.string().email('Informe um e-mail válido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

type AuthFormValues = z.infer<typeof authSchema>;

export function LoginPage() {
  const { locale, setLocale, t } = useI18n();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [nativeLanguage, setNativeLanguage] = useState<UiLocale>(locale);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
  });

  const onSubmit = async (values: AuthFormValues) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isSupabaseConfigured) {
      setErrorMsg('Configure o arquivo .env.local com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
      return;
    }

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error) setErrorMsg(error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName || 'Aluno JVX SPEAK',
            native_language: nativeLanguage,
          },
        },
      });
      if (error) {
        setErrorMsg(error.message);
      } else {
        if (data.user) {
          await supabase
            .schema('core_identity')
            .from('profiles')
            .update({ native_language: nativeLanguage })
            .eq('id', data.user.id);
        }
        setLocale(nativeLanguage);
        setSuccessMsg('Conta criada! Se a confirmação por e-mail estiver ativa no Supabase, verifique sua caixa de entrada.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#06152B] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[#1F4E79]/60 bg-[#0B1F3B] p-8 shadow-2xl">
        <div className="flex flex-col items-start gap-2 mb-6">
          <div className="w-full flex items-center justify-between gap-2">
            <img
              src="/JVX_SPEAK_Brand_Kit/logos/horizontal-dark.svg"
              alt="JVX SPEAK — AI Language Academy"
              className="h-12 w-auto"
            />
            <LocaleSelector compact />
          </div>
          <p className="text-xs font-medium tracking-wider uppercase text-[#D4AF37]">
            {t('login_subtitle')}
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200 flex gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
            <span>
              <strong>.env.local não detectado.</strong> Copie <code>.env.example</code> para{' '}
              <code>.env.local</code> e preencha a URL e Anon Key do projeto <strong>jvxspeak</strong> no Supabase.
            </span>
          </div>
        )}

        <div className="flex rounded-xl bg-[#06152B] p-1 mb-6 border border-[#1F4E79]/40">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              mode === 'login' ? 'bg-[#D4AF37] text-[#0B1F3B] shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            {t('login_tab_signin')}
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              mode === 'signup' ? 'bg-[#D4AF37] text-[#0B1F3B] shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            {t('login_tab_signup')}
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1.5">
                  {t('login_name')}
                </label>
                <input
                  type="text"
                  placeholder="Seu nome"
                  {...register('fullName')}
                  className="w-full rounded-lg border border-[#1F4E79] bg-[#06152B] px-3.5 py-2.5 text-sm text-white placeholder-slate-400 focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1.5">
                  {t('native_lang_label')}
                </label>
                <select
                  value={nativeLanguage}
                  onChange={(e) => {
                    const val = e.target.value as UiLocale;
                    setNativeLanguage(val);
                    setLocale(val);
                  }}
                  className="w-full rounded-lg border border-[#1F4E79] bg-[#06152B] px-3.5 py-2.5 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
                <p className="mt-1 text-[11px] text-slate-400">{t('native_lang_hint')}</p>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-200 mb-1.5">{t('login_email')}</label>
            <input
              type="email"
              placeholder="voce@empresa.com"
              {...register('email')}
              className="w-full rounded-lg border border-[#1F4E79] bg-[#06152B] px-3.5 py-2.5 text-sm text-white placeholder-slate-400 focus:border-[#D4AF37] focus:outline-none"
            />
            {errors.email && <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-200 mb-1.5">Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              {...register('password')}
              className="w-full rounded-lg border border-[#1F4E79] bg-[#06152B] px-3.5 py-2.5 text-sm text-white placeholder-slate-400 focus:border-[#D4AF37] focus:outline-none"
            />
            {errors.password && <p className="mt-1 text-xs text-rose-400">{errors.password.message}</p>}
          </div>

          {errorMsg && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full jvx-btn-primary disabled:opacity-50 py-2.5 text-sm shadow-lg shadow-[#D4AF37]/15"
          >
            {isSubmitting ? '...' : mode === 'login' ? t('login_btn_signin') : t('login_btn_signup')}
          </button>
        </form>
      </div>
    </div>
  );
}
