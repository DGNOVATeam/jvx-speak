import { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';
import type { SupportMessage } from '@/lib/supportChat';

interface SupportMessageBubbleProps {
  message: SupportMessage;
  viewerRole: 'student' | 'admin';
  senderLabel?: string;
}

export function SupportMessageBubble({
  message,
  viewerRole,
  senderLabel,
}: SupportMessageBubbleProps) {
  const [zoomed, setZoomed] = useState(false);
  const isMine = message.sender_role === viewerRole;

  const timeStr = new Date(message.created_at).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <>
      <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2 mb-1 px-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {senderLabel ??
              (message.sender_role === 'admin' ? 'Professor / Suporte JVX' : 'Você')}
          </span>
          <span className="text-[10px] text-slate-500">{timeStr}</span>
        </div>

        <div
          className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm space-y-2 ${
            isMine
              ? 'bg-gradient-to-br from-[#D4AF37] to-[#B89226] text-[#0B1F3B] font-medium rounded-tr-sm'
              : 'bg-slate-100 dark:bg-[#112A4C] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-[#1F4E79]/60 rounded-tl-sm'
          }`}
        >
          {message.attachment_url && (
            <button
              type="button"
              onClick={() => setZoomed(true)}
              className="group relative block overflow-hidden rounded-xl border border-black/10 dark:border-white/10 bg-black/5"
              title="Clique para ampliar o print"
            >
              <img
                src={message.attachment_url}
                alt={message.attachment_name || 'Print anexado'}
                className="max-h-56 w-auto object-contain rounded-xl"
              />
              <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white opacity-0 group-hover:opacity-100 transition">
                <ZoomIn className="h-3 w-3" /> Ampliar
              </span>
            </button>
          )}

          {message.body && (
            <p className="whitespace-pre-wrap break-words leading-relaxed">{message.body}</p>
          )}
        </div>
      </div>

      {zoomed && message.attachment_url && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setZoomed(false)}
        >
          <button
            type="button"
            onClick={() => setZoomed(false)}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition"
            aria-label="Fechar imagem"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={message.attachment_url}
            alt={message.attachment_name || 'Print ampliado'}
            className="max-h-[90vh] max-w-[92vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
