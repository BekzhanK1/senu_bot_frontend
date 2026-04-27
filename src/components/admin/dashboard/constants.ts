import { CalendarClock, CalendarHeart, FileText, Menu, Radio, Settings2, Sparkles, UserCog, Users, MoreHorizontal } from 'lucide-react';
import type { AppSettings, TabId, WeeklyHoursState } from './types';

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

// Primary tabs - always visible
export const PRIMARY_TABS: Array<{ id: TabId; label: string; icon: typeof Sparkles }> = [
  { id: 'requests', label: 'Заявки', icon: Sparkles },
  { id: 'meetings', label: 'Слоты', icon: CalendarClock },
  { id: 'users', label: 'Студенты', icon: Users },
  { id: 'event', label: 'Событие', icon: CalendarHeart },
  { id: 'broadcast', label: 'Рассылка', icon: Radio },
];

// Secondary tabs - in "More" menu
export const SECONDARY_TABS: Array<{ id: TabId; label: string; icon: typeof Sparkles }> = [
  { id: 'content', label: 'Контент', icon: FileText },
  { id: 'menu', label: 'Меню', icon: Menu },
  { id: 'mentors', label: 'Менторы', icon: UserCog },
  { id: 'settings', label: 'Настройки', icon: Settings2 },
];

// All tabs combined
export const TABS: Array<{ id: TabId; label: string; icon: typeof Sparkles }> = [
  ...PRIMARY_TABS,
  ...SECONDARY_TABS,
];

export const CONTENT_CATEGORIES = [
  { value: 'general', label: 'Общее' },
  { value: 'crisis', label: 'Кризис' },
  { value: 'menu', label: 'Меню' },
  { value: 'notification', label: 'Уведомления' },
];

export const CONTENT_TYPES = [
  { value: 'text', label: 'Текст' },
  { value: 'html', label: 'HTML' },
  { value: 'markdown', label: 'Markdown' },
];

export const ACTION_TYPES = [
  { value: 'command', label: 'Команда' },
  { value: 'webapp', label: 'Web App' },
  { value: 'callback', label: 'Callback' },
];

export function emptyWeeklyHours(): WeeklyHoursState {
  return Object.fromEntries(
    Array.from({ length: 7 }, (_, i) => [
      String(i),
      { enabled: i < 5, start: '10:00', end: '18:00' },
    ])
  ) as WeeklyHoursState;
}

export function defaultAppSettings(): AppSettings {
  return {
    welcome_message:
      '🌟 <b>Привет, {first_name}!</b>\n\nЯ бот SENU Buddy: помогаю связаться с ментором без лишних шагов.',
    mentor_about_text: '👑 <b>Айнур — твой проводник и ментор</b>',
    mentor_photo_url: '',
    support_bot_username: '@pcs_nu_bot',
    support_hotline: '111',
    miniapp_home_title: 'Твой SENU-помощник готов к работе',
    miniapp_home_footer: 'SENU Digital Mentor v2.0',
  };
}
