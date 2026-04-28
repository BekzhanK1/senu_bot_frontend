'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentTgUser, showTwaAlert, showTwaError } from '@/lib/twa';
import { useTwaBackButton } from '@/lib/useTwaBackButton';
import { ChevronLeft, Clock, Loader2 } from 'lucide-react';

type SlotItem = { start_at: string; end_at: string; label: string };

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function MeetingPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotItem | null>(null);
  const [topic, setTopic] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [slotMinutes, setSlotMinutes] = useState(30);

  useTwaBackButton(router);

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d;
  });

  const loadSlots = useCallback(async (d: Date) => {
    setSlotsLoading(true);
    setSelectedSlot(null);
    try {
      const key = localDateKey(d);
      const response = await fetch(`/api/meetings/availability?date=${encodeURIComponent(key)}`, {
        cache: 'no-store',
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail || 'Не удалось загрузить слоты.');
      }
      const data = (await response.json()) as {
        slots?: SlotItem[];
        slot_minutes?: number;
      };
      setSlots(data.slots ?? []);
      if (typeof data.slot_minutes === 'number') setSlotMinutes(data.slot_minutes);
    } catch (e) {
      setSlots([]);
      await showTwaError(e instanceof Error ? e : new Error('Ошибка загрузки слотов.'));
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    void loadSlots(selectedDate);
  }, [selectedDate, loadSlots]);

  const handleConfirm = async () => {
    if (!selectedDate || !selectedSlot) {
      await showTwaError('Сначала выбери дату и время.');
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const tgUser = await getCurrentTgUser();
      const response = await fetch('/api/meetings/book', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          tg_user: tgUser,
          start_at: selectedSlot.start_at,
          end_at: selectedSlot.end_at,
          topic: topic.trim() || null,
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const detail = (err as { detail?: string }).detail;
        throw new Error(typeof detail === 'string' ? detail : 'Слот занят или недоступен.');
      }
      await showTwaAlert('Запрос отправлен. Проверь чат с ботом — там будет подтверждение, когда ментор согласует время.');
    } catch (e) {
      await showTwaError(e instanceof Error ? e : new Error('Не удалось записаться.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="p-4 min-h-screen animate-in fade-in duration-500 pb-36">
      <div
        className="flex items-center gap-2 mb-6 text-[var(--tg-theme-button-color)]"
        onClick={() => router.back()}
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="font-medium">Назад</span>
      </div>

      <h1 className="text-2xl font-bold mb-2">Запись на встречу 📅</h1>
      <p className="text-[var(--tg-theme-hint-color)] text-sm mb-6 leading-relaxed">
        Выбери день и свободный слот. Время указано по Алматы. Длительность одного слота — {slotMinutes} мин.
      </p>

      <section className="mb-8">
        <h3 className="font-semibold mb-4 text-xs uppercase tracking-wider opacity-60">Доступные даты</h3>
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1 no-scrollbar">
          {days.map((date, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedDate(date)}
              className={`flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center transition-all ${
                selectedDate?.toDateString() === date.toDateString()
                  ? 'bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] scale-105'
                  : 'bg-[var(--tg-theme-secondary-bg-color)]'
              }`}
            >
              <span className="text-[10px] opacity-60 uppercase">
                {date.toLocaleDateString('ru', { weekday: 'short' })}
              </span>
              <span className="text-lg font-bold">{date.getDate()}</span>
            </button>
          ))}
        </div>
      </section>

      {selectedDate && (
        <section className="animate-in slide-in-from-bottom duration-300 space-y-4">
          <h3 className="font-semibold text-xs uppercase tracking-wider opacity-60">Свободные слоты</h3>
          {slotsLoading ? (
            <div className="flex items-center gap-2 text-[var(--tg-theme-hint-color)] py-8 justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--tg-theme-button-color)]" />
              <span className="text-sm">Загружаем…</span>
            </div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-[var(--tg-theme-hint-color)] py-4">
              В этот день нет свободных окон. Выбери другую дату.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {slots.map((slot) => (
                <button
                  key={slot.start_at}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-1 ${
                    selectedSlot?.start_at === slot.start_at
                      ? 'bg-[var(--tg-theme-button-color)] border-transparent text-[var(--tg-theme-button-text-color)]'
                      : 'bg-[var(--tg-theme-secondary-bg-color)] border-transparent'
                  }`}
                >
                  <Clock className="w-3 h-3 opacity-60" />
                  <span className="font-medium text-sm">{slot.label}</span>
                </button>
              ))}
            </div>
          )}

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-[var(--tg-theme-hint-color)] uppercase tracking-wide">
              Тема (по желанию)
            </span>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="О чём хочешь поговорить"
              className="w-full rounded-2xl px-4 py-3 bg-[var(--tg-theme-secondary-bg-color)] border border-black/[0.06] outline-none focus:ring-2 focus:ring-[var(--tg-theme-button-color)]/40 resize-none text-sm"
            />
          </label>
        </section>
      )}

      {selectedDate && selectedSlot && !slotsLoading && slots.length > 0 && (
        <div className="fixed bottom-6 left-4 right-4 animate-in slide-in-from-bottom duration-500">
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={isSubmitting}
            className="w-full p-4 bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] rounded-2xl font-bold shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Отправка...' : 'Записаться на слот'}
          </button>
        </div>
      )}
    </main>
  );
}
