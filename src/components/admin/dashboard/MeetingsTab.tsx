'use client';

import { Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { DAY_LABELS, SLOT_OPTIONS } from './constants';
import type { MeetingBookingRow, WeeklyHoursState } from './types';

type Props = {
  meetings: MeetingBookingRow[];
  meetingsLoading: boolean;
  meetingActionId: number | null;
  weeklyHours: WeeklyHoursState;
  slotMinutes: number;
  scheduleLoading: boolean;
  scheduleSaving: boolean;
  onRefresh: () => void;
  onConfirmMeeting: (bookingId: number) => void;
  onCompleteMeeting: (bookingId: number) => void;
  onWeeklyHoursChange: (next: WeeklyHoursState) => void;
  onSlotMinutesChange: (value: number) => void;
  onSaveSchedule: () => void;
};

export function MeetingsTab({
  meetings,
  meetingsLoading,
  meetingActionId,
  weeklyHours,
  slotMinutes,
  scheduleLoading,
  scheduleSaving,
  onRefresh,
  onConfirmMeeting,
  onCompleteMeeting,
  onWeeklyHoursChange,
  onSlotMinutesChange,
  onSaveSchedule,
}: Props) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-bold text-lg">Календарь броней</h2>
        <button
          type="button"
          onClick={onRefresh}
          className="p-2.5 rounded-xl bg-[var(--tg-theme-secondary-bg-color)] active:scale-95 transition-transform"
          aria-label="Обновить слоты"
        >
          <RefreshCw className={cn('w-5 h-5', meetingsLoading && 'animate-spin')} />
        </button>
      </div>
      {meetingsLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--tg-theme-button-color)]" />
        </div>
      ) : meetings.length === 0 ? (
        <p className="text-sm text-[var(--tg-theme-hint-color)] text-center py-8">Пока нет записей на слоты.</p>
      ) : (
        <ul className="space-y-3">
          {meetings.map((m) => {
            const st =
              m.status === 'confirmed' ? 'Подтверждена' : m.status === 'completed' ? 'Завершена' : 'Ждёт подтверждения';
            return (
              <li
                key={m.id}
                className="rounded-2xl p-4 bg-[var(--tg-theme-secondary-bg-color)] border border-black/[0.05] space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold">#{m.id}</div>
                    <div className="text-sm text-[var(--tg-theme-hint-color)]">
                      {m.student_full_name}
                      {m.student_username ? (
                        <span className="text-[var(--tg-theme-text-color)]"> @{m.student_username}</span>
                      ) : null}
                    </div>
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-bold uppercase px-2 py-1 rounded-lg shrink-0',
                      m.status === 'completed'
                        ? 'bg-slate-500/15 text-slate-700 dark:text-slate-300'
                        : m.status === 'confirmed'
                          ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                          : 'bg-amber-500/15 text-amber-900 dark:text-amber-200'
                    )}
                  >
                    {st}
                  </span>
                </div>
                <p className="text-sm font-semibold">{m.start_local_label}</p>
                {m.topic ? <p className="text-xs text-[var(--tg-theme-hint-color)]">Тема: {m.topic}</p> : null}
                {m.status === 'pending_confirm' && (
                  <button
                    type="button"
                    disabled={meetingActionId === m.id}
                    onClick={() => onConfirmMeeting(m.id)}
                    className="w-full py-3 rounded-xl bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] text-sm font-semibold disabled:opacity-50"
                  >
                    {meetingActionId === m.id ? (
                      <Loader2 className="w-4 h-4 animate-spin inline" />
                    ) : (
                      'Подтвердить встречу'
                    )}
                  </button>
                )}
                {m.status === 'confirmed' && (
                  <button
                    type="button"
                    disabled={meetingActionId === m.id}
                    onClick={() => onCompleteMeeting(m.id)}
                    className="w-full py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50"
                  >
                    {meetingActionId === m.id ? (
                      <Loader2 className="w-4 h-4 animate-spin inline" />
                    ) : (
                      'Завершить встречу'
                    )}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="rounded-3xl p-4 border border-black/[0.06] space-y-4">
        <h2 className="font-bold text-lg">Рабочие часы (Пн–Вс)</h2>
        <p className="text-xs text-[var(--tg-theme-hint-color)] leading-relaxed">
          Студенты видят только слоты внутри этих окон. Время указывается по Алматы.
        </p>
        {scheduleLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-7 h-7 animate-spin text-[var(--tg-theme-button-color)]" />
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {DAY_LABELS.map((label, i) => {
                const k = String(i);
                const row = weeklyHours[k] ?? { enabled: false, start: '10:00', end: '18:00' };
                return (
                  <div
                    key={k}
                    className="flex flex-wrap items-center gap-2 py-2 border-b border-black/[0.05] last:border-0"
                  >
                    <label className="flex items-center gap-2 w-24 shrink-0">
                      <input
                        type="checkbox"
                        checked={row.enabled}
                        onChange={(e) =>
                          onWeeklyHoursChange({
                            ...weeklyHours,
                            [k]: { ...row, enabled: e.target.checked },
                          })
                        }
                        className="rounded"
                      />
                      <span className="text-sm font-medium">{label}</span>
                    </label>
                    <input
                      type="time"
                      value={row.start}
                      disabled={!row.enabled}
                      onChange={(e) =>
                        onWeeklyHoursChange({
                          ...weeklyHours,
                          [k]: { ...row, start: e.target.value },
                        })
                      }
                      className="rounded-xl px-2 py-2 bg-[var(--tg-theme-bg-color)] border border-black/[0.08] text-sm disabled:opacity-40"
                    />
                    <span className="text-[var(--tg-theme-hint-color)]">—</span>
                    <input
                      type="time"
                      value={row.end}
                      disabled={!row.enabled}
                      onChange={(e) =>
                        onWeeklyHoursChange({
                          ...weeklyHours,
                          [k]: { ...row, end: e.target.value },
                        })
                      }
                      className="rounded-xl px-2 py-2 bg-[var(--tg-theme-bg-color)] border border-black/[0.08] text-sm disabled:opacity-40"
                    />
                  </div>
                );
              })}
            </div>
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[var(--tg-theme-hint-color)] uppercase">
                Длина слота (мин)
              </span>
              <select
                value={slotMinutes}
                onChange={(e) => onSlotMinutesChange(Number(e.target.value))}
                className="w-full rounded-2xl px-4 py-3 bg-[var(--tg-theme-secondary-bg-color)] border border-black/[0.06] text-sm"
              >
                {SLOT_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={scheduleSaving}
              onClick={onSaveSchedule}
              className="w-full py-3.5 rounded-2xl font-bold text-[var(--tg-theme-button-text-color)] bg-[var(--tg-theme-button-color)] disabled:opacity-50"
            >
              {scheduleSaving ? <Loader2 className="w-5 h-5 animate-spin inline" /> : 'Сохранить расписание'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
