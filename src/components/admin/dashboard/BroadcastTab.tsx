'use client';

import { Loader2, Radio } from 'lucide-react';

type Props = {
  broadcastText: string;
  broadcastSubmitting: boolean;
  onTextChange: (value: string) => void;
  onSubmit: () => void;
};

export function BroadcastTab({ broadcastText, broadcastSubmitting, onTextChange, onSubmit }: Props) {
  const maxLength = 3900;
  const currentLength = broadcastText.length;
  const isNearLimit = currentLength > maxLength * 0.8;
  const isOverLimit = currentLength > maxLength;

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--tg-theme-hint-color)]">
        Свободный текст всем студентам. Для структурированного анонса используй вкладку «Событие».
      </p>
      <textarea
        value={broadcastText}
        onChange={(e) => onTextChange(e.target.value)}
        rows={8}
        placeholder="Текст объявления…"
        className="w-full rounded-2xl px-4 py-3.5 bg-[var(--tg-theme-secondary-bg-color)] border border-black/[0.06] outline-none focus:ring-2 focus:ring-[var(--tg-theme-button-color)]/40 resize-none text-sm leading-relaxed"
      />
      <div className={`text-xs text-right transition-colors ${
        isOverLimit 
          ? 'text-rose-600 font-semibold' 
          : isNearLimit 
            ? 'text-amber-600 font-medium' 
            : 'text-[var(--tg-theme-hint-color)]'
      }`}>
        {currentLength} / {maxLength}
        {isOverLimit && ' (превышен лимит)'}
      </div>
      <button
        type="button"
        onClick={onSubmit}
        disabled={broadcastSubmitting || isOverLimit || currentLength === 0}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-[var(--tg-theme-button-text-color)] bg-[var(--tg-theme-button-color)] disabled:opacity-50"
      >
        {broadcastSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Radio className="w-5 h-5" />}
        Отправить рассылку
      </button>
    </div>
  );
}
