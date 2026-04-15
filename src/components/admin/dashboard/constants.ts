import { CalendarClock, CalendarHeart, Radio, Sparkles, Users } from 'lucide-react';
import type { TabId, WeeklyHoursState } from './types';

export const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
export const SLOT_OPTIONS = [15, 20, 30, 45, 60] as const;

export const FILTERS: Array<{ key: string; label: string }> = [
  { key: 'all', label: 'Все' },
  { key: 'meeting', label: 'Встречи' },
  { key: 'game_108', label: '108' },
  { key: 'question', label: 'Вопросы' },
  { key: 'anonymous_question', label: 'Анонимно' },
  { key: 'crisis_triage', label: 'Поддержка' },
];

export const TYPE_ACCENT: Record<string, string> = {
  meeting: 'from-sky-400 to-blue-600',
  game_108: 'from-violet-400 to-purple-600',
  question: 'from-emerald-400 to-teal-600',
  anonymous_question: 'from-slate-400 to-slate-600',
  crisis_triage: 'from-rose-400 to-red-500',
};

export const TABS: Array<{ id: TabId; label: string; icon: typeof Sparkles }> = [
  { id: 'requests', label: 'Заявки', icon: Sparkles },
  { id: 'meetings', label: 'Слоты', icon: CalendarClock },
  { id: 'event', label: 'Событие', icon: CalendarHeart },
  { id: 'users', label: 'Студенты', icon: Users },
  { id: 'broadcast', label: 'Рассылка', icon: Radio },
];

export function emptyWeeklyHours(): WeeklyHoursState {
  return Object.fromEntries(
    Array.from({ length: 7 }, (_, i) => [
      String(i),
      { enabled: i < 5, start: '10:00', end: '18:00' },
    ])
  ) as WeeklyHoursState;
}
