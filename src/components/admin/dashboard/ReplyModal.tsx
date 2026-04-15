'use client';

import { Loader2, Send } from 'lucide-react';
import type { AdminRequestItem } from './types';

type Props = {
  replyOpen: boolean;
  replyTarget: AdminRequestItem | null;
  replyText: string;
  replySending: boolean;
  onReplyTextChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function ReplyModal({
  replyOpen,
  replyTarget,
  replyText,
  replySending,
  onReplyTextChange,
  onClose,
  onSubmit,
}: Props) {
  if (!replyOpen || !replyTarget) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Закрыть"
        onClick={() => {
          if (!replySending) onClose();
        }}
      />
      <div className="relative w-full max-w-md rounded-3xl bg-[var(--tg-theme-bg-color)] border border-black/[0.08] shadow-2xl p-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg">Ответ студенту</h3>
          <span className="text-xs text-[var(--tg-theme-hint-color)]">№{replyTarget.id}</span>
        </div>
        <p className="text-xs text-[var(--tg-theme-hint-color)] mb-3">
          Сообщение придёт в чат с ботом. Закрой заявку отдельно, когда вопрос решён.
        </p>
        <textarea
          value={replyText}
          onChange={(e) => onReplyTextChange(e.target.value)}
          rows={6}
          placeholder="Твой ответ…"
          className="w-full rounded-2xl px-3 py-3 bg-[var(--tg-theme-secondary-bg-color)] border border-black/[0.06] outline-none focus:ring-2 focus:ring-[var(--tg-theme-button-color)]/40 resize-none text-sm mb-4"
        />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={replySending}
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-semibold bg-[var(--tg-theme-secondary-bg-color)]"
          >
            Отмена
          </button>
          <button
            type="button"
            disabled={replySending || !replyText.trim()}
            onClick={onSubmit}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-[var(--tg-theme-button-text-color)] bg-[var(--tg-theme-button-color)] disabled:opacity-40"
          >
            {replySending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Отправить
          </button>
        </div>
      </div>
    </div>
  );
}
