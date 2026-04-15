'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadWebApp } from '@/lib/twa';
import { useTwaBackButton } from '@/lib/useTwaBackButton';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

export default function MeetingPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  useTwaBackButton(router);

  const slots = ["10:00", "11:30", "14:00", "15:30", "17:00"];
  
  // Генерация ближайших рабочих дней
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d;
  });

  const handleConfirm = () => {
    if (!selectedDate || !selectedSlot) return;
    const formattedDate = selectedDate.toLocaleDateString('ru', { day: 'numeric', month: 'long' });
    void loadWebApp().then((WebApp) => {
      WebApp.sendData(
        JSON.stringify({
          type: 'meeting',
          day: formattedDate,
          time: selectedSlot,
        })
      );
    });
  };

  return (
    <main className="p-4 min-h-screen animate-in fade-in duration-500">
      <div className="flex items-center gap-2 mb-6 text-[var(--tg-theme-button-color)]" onClick={() => router.back()}>
        <ChevronLeft className="w-5 h-5" />
        <span className="font-medium">Назад</span>
      </div>

      <h1 className="text-2xl font-bold mb-2">Запись на встречу 📅</h1>
      <p className="text-[var(--tg-theme-hint-color)] text-sm mb-8 leading-relaxed">
        Выбери удобный день и время для консультации с ментором Айнур.
      </p>

      <section className="mb-8">
        <h3 className="font-semibold mb-4 text-xs uppercase tracking-wider opacity-60">Доступные даты</h3>
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1 no-scrollbar">
          {days.map((date, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedDate(date)}
              className={`flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center transition-all ${
                selectedDate?.toDateString() === date.toDateString()
                ? 'bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] scale-105'
                : 'bg-[var(--tg-theme-secondary-bg-color)]'
              }`}
            >
              <span className="text-[10px] opacity-60 uppercase">{date.toLocaleDateString('ru', { weekday: 'short' })}</span>
              <span className="text-lg font-bold">{date.getDate()}</span>
            </button>
          ))}
        </div>
      </section>

      {selectedDate && (
        <section className="animate-in slide-in-from-bottom duration-300">
          <h3 className="font-semibold mb-4 text-xs uppercase tracking-wider opacity-60">Свободные слоты</h3>
          <div className="grid grid-cols-3 gap-3">
            {slots.map((slot) => (
              <button
                key={slot}
                onClick={() => setSelectedSlot(slot)}
                className={`p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-1 ${
                  selectedSlot === slot
                  ? 'bg-[var(--tg-theme-button-color)] border-transparent text-[var(--tg-theme-button-text-color)]'
                  : 'bg-[var(--tg-theme-secondary-bg-color)] border-transparent'
                }`}
              >
                <Clock className="w-3 h-3 opacity-60" />
                <span className="font-medium text-sm">{slot}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {selectedDate && selectedSlot && (
        <div className="fixed bottom-6 left-4 right-4 animate-in slide-in-from-bottom duration-500">
          <button
            onClick={handleConfirm}
            className="w-full p-4 bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] rounded-2xl font-bold shadow-lg active:scale-[0.98] transition-all"
          >
            Подтвердить запись
          </button>
        </div>
      )}
    </main>
  );
}
