import { useEffect, useState } from 'react';
import { Download, PlusSquare, Share, Smartphone, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function InstallAppPrompt({ variant = 'sidebar' }: { variant?: 'sidebar' | 'header' }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => isStandaloneMode());
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [iosDevice] = useState(() => isIosDevice());

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  if (installed) return null;
  if (!deferredPrompt && !iosDevice) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstalled(true);
      }
      setDeferredPrompt(null);
      return;
    }
    if (iosDevice) {
      setShowIosGuide(true);
    }
  };

  return (
    <>
      {variant === 'sidebar' ? (
        <button
          type="button"
          onClick={handleInstallClick}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#D4AF37]/50 bg-[#D4AF37]/10 px-3 py-2 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/20 transition"
        >
          <Download className="h-3.5 w-3.5" />
          {iosDevice ? 'Instalar no iPhone' : 'Instalar Aplicativo'}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleInstallClick}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#D4AF37]/60 bg-[#D4AF37]/15 px-2.5 py-1.5 text-xs font-semibold text-[#D4AF37]"
        >
          <Smartphone className="h-3.5 w-3.5" />
          Instalar
        </button>
      )}

      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#1F4E79] bg-[#0B1F3B] text-white p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37]">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Instalar JVX SPEAK no iPhone</h3>
                  <p className="text-xs text-slate-300">Adicione à tela inicial pelo Safari</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="p-1 text-slate-400 hover:text-white"
                aria-label="Fechar instruções"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <ol className="space-y-3 text-sm text-slate-200">
              <li className="flex items-start gap-3 rounded-xl bg-[#06152B] p-3 border border-[#1F4E79]/40">
                <span className="h-6 w-6 rounded-full bg-[#D4AF37] text-[#0B1F3B] font-bold text-xs flex items-center justify-center shrink-0">
                  1
                </span>
                <div className="flex-1">
                  Toque no ícone <strong>Compartilhar</strong>{' '}
                  <Share className="inline h-4 w-4 text-[#D4AF37] mx-0.5" /> na barra inferior do Safari.
                </div>
              </li>
              <li className="flex items-start gap-3 rounded-xl bg-[#06152B] p-3 border border-[#1F4E79]/40">
                <span className="h-6 w-6 rounded-full bg-[#D4AF37] text-[#0B1F3B] font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </span>
                <div className="flex-1">
                  Role as opções e toque em{' '}
                  <strong>Adicionar à Tela de Início</strong>{' '}
                  <PlusSquare className="inline h-4 w-4 text-[#D4AF37] mx-0.5" />.
                </div>
              </li>
              <li className="flex items-start gap-3 rounded-xl bg-[#06152B] p-3 border border-[#1F4E79]/40">
                <span className="h-6 w-6 rounded-full bg-[#D4AF37] text-[#0B1F3B] font-bold text-xs flex items-center justify-center shrink-0">
                  3
                </span>
                <div className="flex-1">
                  Toque em <strong>Adicionar</strong> no canto superior direito. O app JVX SPEAK aparecerá com o ícone oficial na sua tela!
                </div>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full jvx-btn-primary py-2.5 text-sm"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
