'use client';

import { ArrowLeft, Shield } from 'lucide-react';

type Props = {
  onBack: () => void;
};

export function DashboardHeader({ onBack }: Props) {
  return (
    <div className="relative overflow-hidden px-4 pt-3 pb-8">
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% -20%, var(--tg-theme-button-color), transparent)`,
        }}
      />
      <button
        type="button"
        onClick={onBack}
        className="relative z-10 flex items-center gap-2 text-sm font-medium text-[var(--tg-theme-hint-color)] mb-6 active:opacity-70"
      >
        <ArrowLeft className="w-5 h-5" />
        Назад
      </button>
      <div className="relative z-10 flex items-start gap-3">
        <div className="p-3 rounded-2xl bg-[var(--tg-theme-button-color)]/15 ring-1 ring-[var(--tg-theme-button-color)]/25">
          <Shield className="w-8 h-8 text-[var(--tg-theme-button-color)]" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight leading-tight">Панель ментора</h1>
          <p className="text-sm text-[var(--tg-theme-hint-color)] mt-1 leading-snug">
            Заявки, слоты встреч, события и рассылки — в одном месте.
          </p>
        </div>
      </div>
    </div>
  );
}
