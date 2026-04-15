'use client';

import { CalendarHeart, Loader2, Send } from 'lucide-react';

type Props = {
  eventTitle: string;
  eventPlace: string;
  eventDesc: string;
  eventSubmitting: boolean;
  onEventTitleChange: (value: string) => void;
  onEventPlaceChange: (value: string) => void;
  onEventDescChange: (value: string) => void;
  onSubmit: () => void;
};

export function EventTab({
  eventTitle,
  eventPlace,
  eventDesc,
  eventSubmitting,
  onEventTitleChange,
  onEventPlaceChange,
  onEventDescChange,
  onSubmit,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl p-4 bg-gradient-to-br from-[var(--tg-theme-secondary-bg-color)] to-transparent border border-black/[0.05]">
        <h2 className="font-bold text-lg mb-1 flex items-center gap-2">
          <CalendarHeart className="w-5 h-5 text-[var(--tg-theme-button-color)]" />
          Новое событие
        </h2>
        <p className="text-xs text-[var(--tg-theme-hint-color)] leading-relaxed">
          Уведомление уйдёт всем, кто хоть раз нажал «Старт» в боте. Студенты увидят название, место и описание.
        </p>
      </div>
      <label className="block space-y-1.5">
        <span className="text-xs font-semibold text-[var(--tg-theme-hint-color)] uppercase tracking-wide">Название</span>
        <input
          value={eventTitle}
          onChange={(e) => onEventTitleChange(e.target.value)}
          placeholder="Например: Круглый стол про выгорание"
          className="w-full rounded-2xl px-4 py-3.5 bg-[var(--tg-theme-secondary-bg-color)] border border-black/[0.06] text-[var(--tg-theme-text-color)] placeholder:text-[var(--tg-theme-hint-color)]/60 outline-none focus:ring-2 focus:ring-[var(--tg-theme-button-color)]/40"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-semibold text-[var(--tg-theme-hint-color)] uppercase tracking-wide">Место</span>
        <input
          value={eventPlace}
          onChange={(e) => onEventPlaceChange(e.target.value)}
          placeholder="Аудитория, кампус или ссылка Zoom"
          className="w-full rounded-2xl px-4 py-3.5 bg-[var(--tg-theme-secondary-bg-color)] border border-black/[0.06] outline-none focus:ring-2 focus:ring-[var(--tg-theme-button-color)]/40"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-semibold text-[var(--tg-theme-hint-color)] uppercase tracking-wide">Описание</span>
        <textarea
          value={eventDesc}
          onChange={(e) => onEventDescChange(e.target.value)}
          rows={5}
          placeholder="Что будет на событии, для кого, во сколько начало…"
          className="w-full rounded-2xl px-4 py-3.5 bg-[var(--tg-theme-secondary-bg-color)] border border-black/[0.06] outline-none focus:ring-2 focus:ring-[var(--tg-theme-button-color)]/40 resize-none"
        />
      </label>
      <button
        type="button"
        onClick={onSubmit}
        disabled={eventSubmitting}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-[var(--tg-theme-button-text-color)] bg-[var(--tg-theme-button-color)] disabled:opacity-50 active:scale-[0.99]"
      >
        {eventSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        Опубликовать всем студентам
      </button>
    </div>
  );
}
