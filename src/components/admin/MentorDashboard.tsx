'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bell,
  CalendarClock,
  CalendarHeart,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Radio,
  RefreshCw,
  Send,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { getCurrentTgUser, showTwaAlert, showTwaError, twaHapticLight, twaHapticSuccess } from '@/lib/twa';
import { requestTypeLabelRu } from '@/lib/requestLabels';
import { useTwaBackButton } from '@/lib/useTwaBackButton';

export type AdminRequestItem = {
  id: number;
  user_id: number;
  user_full_name: string;
  user_username?: string | null;
  request_type: string;
  content: string;
  status: string;
  created_at: string;
};

export type AdminUserItem = {
  telegram_id: number;
  username?: string | null;
  full_name: string;
  joined_at: string;
  is_blocked: boolean;
};

type MeetingBookingRow = {
  id: number;
  student_user_id: number;
  student_full_name: string;
  student_username?: string | null;
  start_at: string;
  end_at: string;
  start_local_label: string;
  status: string;
  topic?: string | null;
  request_id?: number | null;
};

type DaySchedule = { enabled: boolean; start: string; end: string };
type WeeklyHoursState = Record<string, DaySchedule>;

type TabId = 'requests' | 'meetings' | 'event' | 'users' | 'broadcast';

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const SLOT_OPTIONS = [15, 20, 30, 45, 60] as const;

function emptyWeeklyHours(): WeeklyHoursState {
  return Object.fromEntries(
    Array.from({ length: 7 }, (_, i) => [
      String(i),
      { enabled: i < 5, start: '10:00', end: '18:00' },
    ])
  ) as WeeklyHoursState;
}

const FILTERS: Array<{ key: string; label: string }> = [
  { key: 'all', label: 'Все' },
  { key: 'meeting', label: 'Встречи' },
  { key: 'game_108', label: '108' },
  { key: 'question', label: 'Вопросы' },
  { key: 'anonymous_question', label: 'Анонимно' },
  { key: 'crisis_triage', label: 'Поддержка' },
];

const TYPE_ACCENT: Record<string, string> = {
  meeting: 'from-sky-400 to-blue-600',
  game_108: 'from-violet-400 to-purple-600',
  question: 'from-emerald-400 to-teal-600',
  anonymous_question: 'from-slate-400 to-slate-600',
  crisis_triage: 'from-rose-400 to-red-500',
};

const TABS: Array<{ id: TabId; label: string; icon: typeof Sparkles }> = [
  { id: 'requests', label: 'Заявки', icon: Sparkles },
  { id: 'meetings', label: 'Слоты', icon: CalendarClock },
  { id: 'event', label: 'Событие', icon: CalendarHeart },
  { id: 'users', label: 'Студенты', icon: Users },
  { id: 'broadcast', label: 'Рассылка', icon: Radio },
];

export function MentorDashboard({ adminId }: { adminId: number }) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>('requests');
  const [items, setItems] = useState<AdminRequestItem[]>([]);
  /** Все заявки выбранного статуса (без фильтра по типу) — для честных счётчиков в чипах. */
  const [statsItems, setStatsItems] = useState<AdminRequestItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [statusTab, setStatusTab] = useState<'pending' | 'resolved'>('pending');
  const [loading, setLoading] = useState(true);
  const [tgUserId, setTgUserId] = useState<number | null>(null);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [blockingUserId, setBlockingUserId] = useState<number | null>(null);

  const [replyOpen, setReplyOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<AdminRequestItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);

  const [eventTitle, setEventTitle] = useState('');
  const [eventPlace, setEventPlace] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventSubmitting, setEventSubmitting] = useState(false);

  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastSubmitting, setBroadcastSubmitting] = useState(false);

  const [meetings, setMeetings] = useState<MeetingBookingRow[]>([]);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [meetingActionId, setMeetingActionId] = useState<number | null>(null);
  const [weeklyHours, setWeeklyHours] = useState<WeeklyHoursState>(() => emptyWeeklyHours());
  const [slotMinutes, setSlotMinutes] = useState(30);
  const [scheduleTimezone, setScheduleTimezone] = useState('Asia/Almaty');
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);

  useTwaBackButton(router);

  const categoryCounters = useMemo(() => {
    const base: Record<string, number> = {
      all: 0,
      meeting: 0,
      game_108: 0,
      question: 0,
      anonymous_question: 0,
      crisis_triage: 0,
    };
    for (const item of statsItems) {
      base.all += 1;
      if (item.request_type in base) base[item.request_type] += 1;
    }
    return base;
  }, [statsItems]);

  const visibleItems = useMemo(() => {
    if (selectedFilter === 'all') return items;
    return items.filter((i) => i.request_type === selectedFilter);
  }, [items, selectedFilter]);

  const loadStats = useCallback(async (userId: number, status: 'pending' | 'resolved') => {
    try {
      const params = new URLSearchParams({ tg_user_id: String(userId), status });
      const response = await fetch(`/api/admin/requests?${params}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(await response.text());
      const data = (await response.json()) as { items: AdminRequestItem[] };
      setStatsItems(data.items ?? []);
    } catch (e) {
      await showTwaError(e instanceof Error ? e : new Error('Не удалось загрузить сводку заявок.'));
    }
  }, []);

  const loadRequests = useCallback(async (userId: number, filter: string, status: 'pending' | 'resolved') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tg_user_id: String(userId) });
      if (filter !== 'all') params.set('request_type', filter);
      params.set('status', status);
      const response = await fetch(`/api/admin/requests?${params}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(await response.text());
      const data = (await response.json()) as { items: AdminRequestItem[] };
      setItems(data.items ?? []);
    } catch (e) {
      await showTwaError(e instanceof Error ? e : new Error('Не удалось загрузить заявки.'));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMeetingsAndSchedule = useCallback(async (userId: number) => {
    setMeetingsLoading(true);
    setScheduleLoading(true);
    try {
      const [mRes, sRes] = await Promise.all([
        fetch(`/api/admin/meetings?${new URLSearchParams({ tg_user_id: String(userId) })}`, {
          cache: 'no-store',
        }),
        fetch(`/api/admin/schedule?${new URLSearchParams({ tg_user_id: String(userId) })}`, {
          cache: 'no-store',
        }),
      ]);
      if (!mRes.ok) throw new Error(await mRes.text());
      if (!sRes.ok) throw new Error(await sRes.text());
      const mData = (await mRes.json()) as { items?: MeetingBookingRow[] };
      const sData = (await sRes.json()) as {
        weekly_hours?: WeeklyHoursState;
        slot_minutes?: number;
        timezone?: string;
      };
      setMeetings(mData.items ?? []);
      const base = emptyWeeklyHours();
      const wh = sData.weekly_hours ?? {};
      for (let i = 0; i < 7; i++) {
        const k = String(i);
        const row = wh[k];
        if (row && typeof row.start === 'string' && typeof row.end === 'string') {
          base[k] = {
            enabled: Boolean(row.enabled),
            start: row.start,
            end: row.end,
          };
        }
      }
      setWeeklyHours(base);
      if (typeof sData.slot_minutes === 'number') setSlotMinutes(sData.slot_minutes);
      if (typeof sData.timezone === 'string' && sData.timezone.trim()) {
        setScheduleTimezone(sData.timezone.trim());
      }
    } catch (e) {
      await showTwaError(e instanceof Error ? e : new Error('Не удалось загрузить слоты и расписание.'));
    } finally {
      setMeetingsLoading(false);
      setScheduleLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async (userId: number) => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({ tg_user_id: String(userId) });
      const response = await fetch(`/api/admin/users?${params}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(await response.text());
      const data = (await response.json()) as { items: AdminUserItem[] };
      setUsers(data.items ?? []);
    } catch (e) {
      await showTwaError(e instanceof Error ? e : new Error('Не удалось загрузить студентов.'));
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    if (!tgUserId) return;
    void twaHapticLight();
    const extra = tab === 'meetings' ? [loadMeetingsAndSchedule(tgUserId)] : [];
    await Promise.all([
      loadStats(tgUserId, statusTab),
      loadRequests(tgUserId, selectedFilter, statusTab),
      loadUsers(tgUserId),
      ...extra,
    ]);
    void twaHapticSuccess();
  }, [tgUserId, loadStats, loadRequests, loadUsers, loadMeetingsAndSchedule, selectedFilter, statusTab, tab]);

  useEffect(() => {
    void (async () => {
      try {
        const tg = await getCurrentTgUser();
        setTgUserId(tg.id);
        if (!adminId || tg.id !== adminId) {
          await showTwaError('Эта панель только для ментора.');
          router.replace('/');
          return;
        }
        await Promise.all([
          loadStats(tg.id, 'pending'),
          loadRequests(tg.id, 'all', 'pending'),
          loadUsers(tg.id),
        ]);
      } catch (e) {
        await showTwaError(e instanceof Error ? e : new Error('Не удалось войти.'));
        router.replace('/');
      }
    })();
  }, [adminId, loadStats, loadRequests, loadUsers, router]);

  useEffect(() => {
    if (!tgUserId) return;
    void loadStats(tgUserId, statusTab);
  }, [tgUserId, statusTab, loadStats]);

  useEffect(() => {
    if (!tgUserId) return;
    void loadRequests(tgUserId, selectedFilter, statusTab);
  }, [tgUserId, loadRequests, selectedFilter, statusTab]);

  useEffect(() => {
    if (!tgUserId || tab !== 'meetings') return;
    void loadMeetingsAndSchedule(tgUserId);
  }, [tgUserId, tab, loadMeetingsAndSchedule]);

  const saveSchedule = async () => {
    if (!tgUserId || scheduleSaving) return;
    setScheduleSaving(true);
    void twaHapticLight();
    try {
      const response = await fetch('/api/admin/schedule', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          tg_user_id: tgUserId,
          weekly_hours: weeklyHours,
          slot_minutes: slotMinutes,
          timezone: scheduleTimezone.trim() || 'Asia/Almaty',
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail || (await response.text()));
      }
      void twaHapticSuccess();
      await showTwaAlert('Расписание сохранено.');
    } catch (e) {
      await showTwaError(e instanceof Error ? e : new Error('Не удалось сохранить.'));
    } finally {
      setScheduleSaving(false);
    }
  };

  const confirmMeeting = async (bookingId: number) => {
    if (!tgUserId || meetingActionId) return;
    setMeetingActionId(bookingId);
    void twaHapticLight();
    try {
      const response = await fetch(`/api/admin/meetings/${bookingId}/confirm`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tg_user_id: tgUserId }),
      });
      if (!response.ok) throw new Error(await response.text());
      void twaHapticSuccess();
      await showTwaAlert('Студент получил подтверждение в Telegram.');
      await loadMeetingsAndSchedule(tgUserId);
    } catch (e) {
      await showTwaError(e instanceof Error ? e : new Error('Не удалось подтвердить.'));
    } finally {
      setMeetingActionId(null);
    }
  };

  const completeMeeting = async (bookingId: number) => {
    if (!tgUserId || meetingActionId) return;
    setMeetingActionId(bookingId);
    void twaHapticLight();
    try {
      const response = await fetch(`/api/admin/meetings/${bookingId}/complete`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tg_user_id: tgUserId }),
      });
      if (!response.ok) throw new Error(await response.text());
      void twaHapticSuccess();
      await showTwaAlert('Встреча завершена, студент уведомлён.');
      await loadMeetingsAndSchedule(tgUserId);
      await loadStats(tgUserId, statusTab);
      await loadRequests(tgUserId, selectedFilter, statusTab);
    } catch (e) {
      await showTwaError(e instanceof Error ? e : new Error('Не удалось завершить.'));
    } finally {
      setMeetingActionId(null);
    }
  };

  const markResolved = async (id: number) => {
    if (!tgUserId || resolvingId) return;
    void twaHapticLight();
    setResolvingId(id);
    try {
      const response = await fetch(`/api/admin/requests/${id}/resolve`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tg_user_id: tgUserId }),
      });
      if (!response.ok) throw new Error(await response.text());
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status: 'resolved' } : x)));
      setStatsItems((prev) => prev.map((x) => (x.id === id ? { ...x, status: 'resolved' } : x)));
      void twaHapticSuccess();
      await showTwaAlert('Студент получил уведомление о закрытии заявки.');
    } catch (e) {
      await showTwaError(e instanceof Error ? e : new Error('Ошибка.'));
    } finally {
      setResolvingId(null);
    }
  };

  const openReply = (item: AdminRequestItem) => {
    void twaHapticLight();
    setReplyTarget(item);
    setReplyText('');
    setReplyOpen(true);
  };

  const sendReply = async () => {
    if (!tgUserId || !replyTarget || !replyText.trim() || replySending) return;
    setReplySending(true);
    try {
      const response = await fetch(`/api/admin/requests/${replyTarget.id}/reply`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tg_user_id: tgUserId, text: replyText.trim() }),
      });
      if (!response.ok) throw new Error(await response.text());
      void twaHapticSuccess();
      setReplyOpen(false);
      setReplyTarget(null);
      setReplyText('');
      await showTwaAlert('Сообщение отправлено студенту в Telegram.');
    } catch (e) {
      await showTwaError(e instanceof Error ? e : new Error('Не отправилось.'));
    } finally {
      setReplySending(false);
    }
  };

  const submitEvent = async () => {
    if (!tgUserId || eventSubmitting) return;
    const title = eventTitle.trim();
    const place = eventPlace.trim();
    const description = eventDesc.trim();
    if (title.length < 2 || place.length < 2 || description.length < 5) {
      await showTwaError('Заполни все поля: название и место — от 2 символов, описание — от 5.');
      return;
    }
    setEventSubmitting(true);
    void twaHapticLight();
    try {
      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tg_user_id: tgUserId, title, place, description }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail || (await response.text()));
      }
      const data = (await response.json()) as { delivered: number; total: number; event_id: number };
      void twaHapticSuccess();
      setEventTitle('');
      setEventPlace('');
      setEventDesc('');
      await showTwaAlert(`Событие №${data.event_id} отправлено: ${data.delivered} из ${data.total} студентов.`);
    } catch (e) {
      await showTwaError(e instanceof Error ? e : new Error('Ошибка публикации.'));
    } finally {
      setEventSubmitting(false);
    }
  };

  const submitBroadcast = async () => {
    if (!tgUserId || broadcastSubmitting) return;
    const text = broadcastText.trim();
    if (text.length < 1) {
      await showTwaError('Введи текст рассылки.');
      return;
    }
    setBroadcastSubmitting(true);
    void twaHapticLight();
    try {
      const response = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tg_user_id: tgUserId, text }),
      });
      if (!response.ok) throw new Error(await response.text());
      const data = (await response.json()) as { delivered: number; total: number };
      void twaHapticSuccess();
      setBroadcastText('');
      await showTwaAlert(`Доставлено: ${data.delivered} из ${data.total}.`);
    } catch (e) {
      await showTwaError(e instanceof Error ? e : new Error('Ошибка рассылки.'));
    } finally {
      setBroadcastSubmitting(false);
    }
  };

  const toggleBlock = async (targetUserId: number, isBlocked: boolean) => {
    if (!tgUserId || blockingUserId) return;
    void twaHapticLight();
    setBlockingUserId(targetUserId);
    try {
      const action = isBlocked ? 'unblock' : 'block';
      const response = await fetch(`/api/admin/users/${targetUserId}/${action}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tg_user_id: tgUserId }),
      });
      if (!response.ok) throw new Error(await response.text());
      setUsers((prev) =>
        prev.map((u) => (u.telegram_id === targetUserId ? { ...u, is_blocked: !isBlocked } : u))
      );
      void twaHapticSuccess();
    } catch (e) {
      await showTwaError(e instanceof Error ? e : new Error('Не удалось изменить статус.'));
    } finally {
      setBlockingUserId(null);
    }
  };

  const accentBar = (type: string) =>
    TYPE_ACCENT[type] ?? 'from-[var(--tg-theme-button-color)] to-indigo-600';

  return (
    <div className="min-h-screen pb-28 max-w-lg mx-auto">
      {/* Hero */}
      <div className="relative overflow-hidden px-4 pt-3 pb-8">
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            background: `radial-gradient(ellipse 80% 60% at 50% -20%, var(--tg-theme-button-color), transparent)`,
          }}
        />
        <button
          type="button"
          onClick={() => {
            void twaHapticLight();
            router.back();
          }}
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

      {/* Tabs */}
      <div className="px-4 -mt-2 mb-4">
        <div className="flex gap-1 p-1 rounded-2xl bg-[var(--tg-theme-secondary-bg-color)] border border-black/[0.04] dark:border-white/[0.06]">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                void twaHapticLight();
                setTab(id);
              }}
              className={cn(
                'flex-1 flex flex-col items-center gap-0.5 py-2.5 px-1 rounded-xl text-[10px] font-semibold transition-all min-w-0',
                tab === id
                  ? 'bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] shadow-sm'
                  : 'text-[var(--tg-theme-hint-color)]'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={2} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-6">
        {tab === 'requests' && (
          <>
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-2 p-1 rounded-xl bg-[var(--tg-theme-secondary-bg-color)]">
                {(['pending', 'resolved'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      void twaHapticLight();
                      setStatusTab(s);
                    }}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                      statusTab === s
                        ? 'bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]'
                        : 'text-[var(--tg-theme-hint-color)]'
                    )}
                  >
                    {s === 'pending' ? 'В работе' : 'Архив'}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => void refreshAll()}
                className="p-2.5 rounded-xl bg-[var(--tg-theme-secondary-bg-color)] active:scale-95 transition-transform"
                aria-label="Обновить"
              >
                <RefreshCw className={cn('w-5 h-5', loading && 'animate-spin')} />
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => {
                    void twaHapticLight();
                    setSelectedFilter(f.key);
                  }}
                  className={cn(
                    'px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-all border',
                    selectedFilter === f.key
                      ? 'border-[var(--tg-theme-button-color)] bg-[var(--tg-theme-button-color)]/10 text-[var(--tg-theme-text-color)]'
                      : 'border-transparent bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-hint-color)]'
                  )}
                >
                  {f.label}{' '}
                  <span className="opacity-60">({categoryCounters[f.key] ?? 0})</span>
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--tg-theme-hint-color)]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--tg-theme-button-color)]" />
                <span className="text-sm">Загружаем заявки…</span>
              </div>
            ) : visibleItems.length === 0 ? (
              <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-[var(--tg-theme-hint-color)]/30">
                <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm text-[var(--tg-theme-hint-color)]">В этой вкладке пока пусто.</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {visibleItems.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-[1.35rem] overflow-hidden border border-black/[0.06] dark:border-white/[0.08] bg-[var(--tg-theme-secondary-bg-color)]/90 shadow-sm"
                  >
                    <div className={cn('h-1 w-full bg-gradient-to-r', accentBar(item.request_type))} />
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--tg-theme-hint-color)]">
                            {requestTypeLabelRu(item.request_type)}
                          </span>
                          <div className="font-bold text-lg mt-0.5">№{item.id}</div>
                        </div>
                        <span
                          className={cn(
                            'text-[10px] font-bold uppercase px-2 py-1 rounded-lg',
                            item.status === 'resolved'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                              : 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                          )}
                        >
                          {item.status === 'resolved' ? 'Закрыта' : 'Открыта'}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--tg-theme-hint-color)] mb-2">
                        {item.user_full_name}
                        {item.user_username ? (
                          <span className="text-[var(--tg-theme-text-color)]"> @{item.user_username}</span>
                        ) : null}
                      </p>
                      <p className="text-xs text-[var(--tg-theme-hint-color)] mb-3">
                        {new Date(item.created_at).toLocaleString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap break-words rounded-xl bg-[var(--tg-theme-bg-color)]/60 p-3 mb-4 border border-black/[0.04]">
                        {item.content}
                      </div>
                      {item.status !== 'resolved' && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => void markResolved(item.id)}
                            disabled={resolvingId === item.id}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50 active:scale-[0.98]"
                          >
                            {resolvingId === item.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                            Закрыть заявку
                          </button>
                          <button
                            type="button"
                            onClick={() => openReply(item)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] text-sm font-semibold active:scale-[0.98]"
                          >
                            <MessageCircle className="w-4 h-4" />
                            Ответить
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {tab === 'meetings' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-bold text-lg">Календарь броней</h2>
              <button
                type="button"
                onClick={() => tgUserId && void loadMeetingsAndSchedule(tgUserId)}
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
              <p className="text-sm text-[var(--tg-theme-hint-color)] text-center py-8">
                Пока нет записей на слоты.
              </p>
            ) : (
              <ul className="space-y-3">
                {meetings.map((m) => {
                  const st =
                    m.status === 'confirmed'
                      ? 'Подтверждена'
                      : m.status === 'completed'
                        ? 'Завершена'
                        : 'Ждёт подтверждения';
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
                              <span className="text-[var(--tg-theme-text-color)]">
                                {' '}
                                @{m.student_username}
                              </span>
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
                      {m.topic ? (
                        <p className="text-xs text-[var(--tg-theme-hint-color)]">Тема: {m.topic}</p>
                      ) : null}
                      {m.status === 'pending_confirm' && (
                        <button
                          type="button"
                          disabled={meetingActionId === m.id}
                          onClick={() => void confirmMeeting(m.id)}
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
                          onClick={() => void completeMeeting(m.id)}
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
                Студенты видят только слоты внутри этих окон. Часовой пояс — как в календаре ментора.
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
                                setWeeklyHours((prev) => ({
                                  ...prev,
                                  [k]: { ...row, enabled: e.target.checked },
                                }))
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
                              setWeeklyHours((prev) => ({
                                ...prev,
                                [k]: { ...row, start: e.target.value },
                              }))
                            }
                            className="rounded-xl px-2 py-2 bg-[var(--tg-theme-bg-color)] border border-black/[0.08] text-sm disabled:opacity-40"
                          />
                          <span className="text-[var(--tg-theme-hint-color)]">—</span>
                          <input
                            type="time"
                            value={row.end}
                            disabled={!row.enabled}
                            onChange={(e) =>
                              setWeeklyHours((prev) => ({
                                ...prev,
                                [k]: { ...row, end: e.target.value },
                              }))
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
                      onChange={(e) => setSlotMinutes(Number(e.target.value))}
                      className="w-full rounded-2xl px-4 py-3 bg-[var(--tg-theme-secondary-bg-color)] border border-black/[0.06] text-sm"
                    >
                      {SLOT_OPTIONS.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-semibold text-[var(--tg-theme-hint-color)] uppercase">
                      Часовой пояс (IANA)
                    </span>
                    <input
                      value={scheduleTimezone}
                      onChange={(e) => setScheduleTimezone(e.target.value)}
                      placeholder="Asia/Almaty"
                      className="w-full rounded-2xl px-4 py-3 bg-[var(--tg-theme-secondary-bg-color)] border border-black/[0.06] text-sm"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={scheduleSaving}
                    onClick={() => void saveSchedule()}
                    className="w-full py-3.5 rounded-2xl font-bold text-[var(--tg-theme-button-text-color)] bg-[var(--tg-theme-button-color)] disabled:opacity-50"
                  >
                    {scheduleSaving ? <Loader2 className="w-5 h-5 animate-spin inline" /> : 'Сохранить расписание'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {tab === 'event' && (
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
              <span className="text-xs font-semibold text-[var(--tg-theme-hint-color)] uppercase tracking-wide">
                Название
              </span>
              <input
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Например: Круглый стол про выгорание"
                className="w-full rounded-2xl px-4 py-3.5 bg-[var(--tg-theme-secondary-bg-color)] border border-black/[0.06] text-[var(--tg-theme-text-color)] placeholder:text-[var(--tg-theme-hint-color)]/60 outline-none focus:ring-2 focus:ring-[var(--tg-theme-button-color)]/40"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-[var(--tg-theme-hint-color)] uppercase tracking-wide">
                Место
              </span>
              <input
                value={eventPlace}
                onChange={(e) => setEventPlace(e.target.value)}
                placeholder="Аудитория, кампус или ссылка Zoom"
                className="w-full rounded-2xl px-4 py-3.5 bg-[var(--tg-theme-secondary-bg-color)] border border-black/[0.06] outline-none focus:ring-2 focus:ring-[var(--tg-theme-button-color)]/40"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-[var(--tg-theme-hint-color)] uppercase tracking-wide">
                Описание
              </span>
              <textarea
                value={eventDesc}
                onChange={(e) => setEventDesc(e.target.value)}
                rows={5}
                placeholder="Что будет на событии, для кого, во сколько начало…"
                className="w-full rounded-2xl px-4 py-3.5 bg-[var(--tg-theme-secondary-bg-color)] border border-black/[0.06] outline-none focus:ring-2 focus:ring-[var(--tg-theme-button-color)]/40 resize-none"
              />
            </label>
            <button
              type="button"
              onClick={() => void submitEvent()}
              disabled={eventSubmitting}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-[var(--tg-theme-button-text-color)] bg-[var(--tg-theme-button-color)] disabled:opacity-50 active:scale-[0.99]"
            >
              {eventSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Опубликовать всем студентам
            </button>
          </div>
        )}

        {tab === 'users' && (
          <div className="space-y-3">
            <p className="text-sm text-[var(--tg-theme-hint-color)]">
              Заблокированный студент не сможет пользоваться ботом и Mini App.
            </p>
            {usersLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--tg-theme-button-color)]" />
              </div>
            ) : users.length === 0 ? (
              <p className="text-sm text-center text-[var(--tg-theme-hint-color)] py-8">Пока никто не заходил.</p>
            ) : (
              <ul className="space-y-2">
                {users.map((user) => (
                  <li
                    key={user.telegram_id}
                    className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--tg-theme-secondary-bg-color)] border border-black/[0.04]"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{user.full_name}</div>
                      <div className="text-xs text-[var(--tg-theme-hint-color)] truncate">
                        ID {user.telegram_id}
                        {user.username ? ` · @${user.username}` : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void toggleBlock(user.telegram_id, user.is_blocked)}
                      disabled={blockingUserId === user.telegram_id || user.telegram_id === adminId}
                      className={cn(
                        'shrink-0 px-3 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-40',
                        user.is_blocked ? 'bg-emerald-600' : 'bg-rose-600'
                      )}
                    >
                      {blockingUserId === user.telegram_id
                        ? '…'
                        : user.is_blocked
                          ? 'Разблок.'
                          : 'Блок'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === 'broadcast' && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--tg-theme-hint-color)]">
              Свободный текст всем студентам. Для структурированного анонса используй вкладку «Событие».
            </p>
            <textarea
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              rows={8}
              placeholder="Текст объявления…"
              className="w-full rounded-2xl px-4 py-3.5 bg-[var(--tg-theme-secondary-bg-color)] border border-black/[0.06] outline-none focus:ring-2 focus:ring-[var(--tg-theme-button-color)]/40 resize-none text-sm leading-relaxed"
            />
            <div className="text-xs text-[var(--tg-theme-hint-color)] text-right">{broadcastText.length} / 3900</div>
            <button
              type="button"
              onClick={() => void submitBroadcast()}
              disabled={broadcastSubmitting}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-[var(--tg-theme-button-text-color)] bg-[var(--tg-theme-button-color)] disabled:opacity-50"
            >
              {broadcastSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Radio className="w-5 h-5" />}
              Отправить рассылку
            </button>
          </div>
        )}
      </div>

      {/* Reply modal */}
      {replyOpen && replyTarget && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-sm">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Закрыть"
            onClick={() => {
              if (!replySending) {
                setReplyOpen(false);
                setReplyTarget(null);
              }
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
              onChange={(e) => setReplyText(e.target.value)}
              rows={6}
              placeholder="Твой ответ…"
              className="w-full rounded-2xl px-3 py-3 bg-[var(--tg-theme-secondary-bg-color)] border border-black/[0.06] outline-none focus:ring-2 focus:ring-[var(--tg-theme-button-color)]/40 resize-none text-sm mb-4"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={replySending}
                onClick={() => {
                  setReplyOpen(false);
                  setReplyTarget(null);
                }}
                className="flex-1 py-3 rounded-xl font-semibold bg-[var(--tg-theme-secondary-bg-color)]"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={replySending || !replyText.trim()}
                onClick={() => void sendReply()}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-[var(--tg-theme-button-text-color)] bg-[var(--tg-theme-button-color)] disabled:opacity-40"
              >
                {replySending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
