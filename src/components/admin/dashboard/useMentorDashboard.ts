'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentTgUser, showTwaAlert, showTwaError, twaHapticLight, twaHapticSuccess } from '@/lib/twa';
import { useTwaBackButton } from '@/lib/useTwaBackButton';
import { TYPE_ACCENT, emptyWeeklyHours } from './constants';
import { buildQuery, requestJson } from './http';
import type { AdminRequestItem, AdminUserItem, MeetingBookingRow, TabId, WeeklyHoursState } from './types';

type RequestsResponse = { items?: AdminRequestItem[] };
type UsersResponse = { items?: AdminUserItem[] };
type MeetingsResponse = { items?: MeetingBookingRow[] };
type ScheduleResponse = {
  weekly_hours?: WeeklyHoursState;
  slot_minutes?: number;
  timezone?: string;
};

export function useMentorDashboard(adminId: number) {
  const router = useRouter();

  const [tab, setTab] = useState<TabId>('requests');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [statusTab, setStatusTab] = useState<'pending' | 'resolved'>('pending');
  const [tgUserId, setTgUserId] = useState<number | null>(null);

  const [items, setItems] = useState<AdminRequestItem[]>([]);
  const [statsItems, setStatsItems] = useState<AdminRequestItem[]>([]);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [meetings, setMeetings] = useState<MeetingBookingRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);

  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [blockingUserId, setBlockingUserId] = useState<number | null>(null);
  const [meetingActionId, setMeetingActionId] = useState<number | null>(null);

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

  const [weeklyHours, setWeeklyHours] = useState<WeeklyHoursState>(() => emptyWeeklyHours());
  const [slotMinutes, setSlotMinutes] = useState(30);
  const [scheduleTimezone, setScheduleTimezone] = useState('Asia/Almaty');

  useTwaBackButton(router);

  const categoryCounters = useMemo(() => {
    const counters: Record<string, number> = {
      all: 0,
      meeting: 0,
      game_108: 0,
      question: 0,
      anonymous_question: 0,
      crisis_triage: 0,
    };
    for (const requestItem of statsItems) {
      counters.all += 1;
      if (requestItem.request_type in counters) counters[requestItem.request_type] += 1;
    }
    return counters;
  }, [statsItems]);

  const visibleItems = useMemo(() => {
    if (selectedFilter === 'all') return items;
    return items.filter((requestItem) => requestItem.request_type === selectedFilter);
  }, [items, selectedFilter]);

  const requireCurrentUserId = useCallback((): number | null => {
    if (tgUserId) return tgUserId;
    return null;
  }, [tgUserId]);

  const closeReplyModal = useCallback(() => {
    setReplyOpen(false);
    setReplyTarget(null);
  }, []);

  const withErrorAlert = useCallback(async (operation: () => Promise<void>, fallback: string) => {
    try {
      await operation();
    } catch (error) {
      await showTwaError(error instanceof Error ? error : new Error(fallback));
    }
  }, []);

  const hydrateSchedule = useCallback((response: ScheduleResponse) => {
    const normalized = emptyWeeklyHours();
    const rawWeeklyHours = response.weekly_hours ?? {};

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const key = String(dayIndex);
      const dayConfig = rawWeeklyHours[key];
      if (!dayConfig) continue;
      if (typeof dayConfig.start !== 'string' || typeof dayConfig.end !== 'string') continue;
      normalized[key] = {
        enabled: Boolean(dayConfig.enabled),
        start: dayConfig.start,
        end: dayConfig.end,
      };
    }

    setWeeklyHours(normalized);
    if (typeof response.slot_minutes === 'number') setSlotMinutes(response.slot_minutes);
    if (typeof response.timezone === 'string' && response.timezone.trim()) {
      setScheduleTimezone(response.timezone.trim());
    }
  }, []);

  const loadStats = useCallback(async (userId: number, status: 'pending' | 'resolved') => {
    const query = buildQuery({ tg_user_id: userId, status });
    const data = await requestJson<RequestsResponse>(`/api/admin/requests${query}`);
    setStatsItems(data.items ?? []);
  }, []);

  const loadRequests = useCallback(async (userId: number, filter: string, status: 'pending' | 'resolved') => {
    setLoading(true);
    try {
      const query = buildQuery({
        tg_user_id: userId,
        status,
        request_type: filter === 'all' ? undefined : filter,
      });
      const data = await requestJson<RequestsResponse>(`/api/admin/requests${query}`);
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async (userId: number) => {
    setUsersLoading(true);
    try {
      const query = buildQuery({ tg_user_id: userId });
      const data = await requestJson<UsersResponse>(`/api/admin/users${query}`);
      setUsers(data.items ?? []);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const loadMeetingsAndSchedule = useCallback(async (userId: number) => {
    setMeetingsLoading(true);
    setScheduleLoading(true);
    try {
      const query = buildQuery({ tg_user_id: userId });
      const [meetingsResponse, scheduleResponse] = await Promise.all([
        requestJson<MeetingsResponse>(`/api/admin/meetings${query}`),
        requestJson<ScheduleResponse>(`/api/admin/schedule${query}`),
      ]);
      setMeetings(meetingsResponse.items ?? []);
      hydrateSchedule(scheduleResponse);
    } finally {
      setMeetingsLoading(false);
      setScheduleLoading(false);
    }
  }, [hydrateSchedule]);

  const refreshAll = useCallback(async () => {
    const userId = requireCurrentUserId();
    if (!userId) return;
    void twaHapticLight();
    await withErrorAlert(async () => {
      const tasks: Array<Promise<void>> = [
        loadStats(userId, statusTab),
        loadRequests(userId, selectedFilter, statusTab),
        loadUsers(userId),
      ];
      if (tab === 'meetings') tasks.push(loadMeetingsAndSchedule(userId));
      await Promise.all(tasks);
      void twaHapticSuccess();
    }, 'Не удалось обновить данные.');
  }, [
    requireCurrentUserId,
    statusTab,
    selectedFilter,
    tab,
    withErrorAlert,
    loadStats,
    loadRequests,
    loadUsers,
    loadMeetingsAndSchedule,
  ]);

  const handleBack = useCallback(() => {
    void twaHapticLight();
    router.back();
  }, [router]);

  const handleTabChange = useCallback((nextTab: TabId) => {
    void twaHapticLight();
    setTab(nextTab);
  }, []);

  const handleStatusChange = useCallback((nextStatus: 'pending' | 'resolved') => {
    void twaHapticLight();
    setStatusTab(nextStatus);
  }, []);

  const handleFilterChange = useCallback((nextFilter: string) => {
    void twaHapticLight();
    setSelectedFilter(nextFilter);
  }, []);

  const handleSaveSchedule = useCallback(async () => {
    const userId = requireCurrentUserId();
    if (!userId || scheduleSaving) return;

    setScheduleSaving(true);
    void twaHapticLight();

    await withErrorAlert(async () => {
      await requestJson('/api/admin/schedule', {
        method: 'PUT',
        body: {
          tg_user_id: userId,
          weekly_hours: weeklyHours,
          slot_minutes: slotMinutes,
          timezone: scheduleTimezone.trim() || 'Asia/Almaty',
        },
      });
      void twaHapticSuccess();
      await showTwaAlert('Расписание сохранено.');
    }, 'Не удалось сохранить.');

    setScheduleSaving(false);
  }, [requireCurrentUserId, scheduleSaving, withErrorAlert, weeklyHours, slotMinutes, scheduleTimezone]);

  const handleConfirmMeeting = useCallback(async (bookingId: number) => {
    const userId = requireCurrentUserId();
    if (!userId || meetingActionId) return;
    setMeetingActionId(bookingId);
    void twaHapticLight();

    await withErrorAlert(async () => {
      await requestJson(`/api/admin/meetings/${bookingId}/confirm`, {
        method: 'POST',
        body: { tg_user_id: userId },
      });
      void twaHapticSuccess();
      await showTwaAlert('Студент получил подтверждение в Telegram.');
      await loadMeetingsAndSchedule(userId);
    }, 'Не удалось подтвердить.');

    setMeetingActionId(null);
  }, [requireCurrentUserId, meetingActionId, withErrorAlert, loadMeetingsAndSchedule]);

  const handleCompleteMeeting = useCallback(async (bookingId: number) => {
    const userId = requireCurrentUserId();
    if (!userId || meetingActionId) return;
    setMeetingActionId(bookingId);
    void twaHapticLight();

    await withErrorAlert(async () => {
      await requestJson(`/api/admin/meetings/${bookingId}/complete`, {
        method: 'POST',
        body: { tg_user_id: userId },
      });
      void twaHapticSuccess();
      await showTwaAlert('Встреча завершена, студент уведомлён.');
      await Promise.all([
        loadMeetingsAndSchedule(userId),
        loadStats(userId, statusTab),
        loadRequests(userId, selectedFilter, statusTab),
      ]);
    }, 'Не удалось завершить.');

    setMeetingActionId(null);
  }, [
    requireCurrentUserId,
    meetingActionId,
    withErrorAlert,
    loadMeetingsAndSchedule,
    loadStats,
    statusTab,
    loadRequests,
    selectedFilter,
  ]);

  const handleResolveRequest = useCallback(async (requestId: number) => {
    const userId = requireCurrentUserId();
    if (!userId || resolvingId) return;
    setResolvingId(requestId);
    void twaHapticLight();

    await withErrorAlert(async () => {
      await requestJson(`/api/admin/requests/${requestId}/resolve`, {
        method: 'POST',
        body: { tg_user_id: userId },
      });
      setItems((prev) => prev.map((item) => (item.id === requestId ? { ...item, status: 'resolved' } : item)));
      setStatsItems((prev) => prev.map((item) => (item.id === requestId ? { ...item, status: 'resolved' } : item)));
      void twaHapticSuccess();
      await showTwaAlert('Студент получил уведомление о закрытии заявки.');
    }, 'Ошибка при закрытии заявки.');

    setResolvingId(null);
  }, [requireCurrentUserId, resolvingId, withErrorAlert]);

  const handleOpenReply = useCallback((item: AdminRequestItem) => {
    void twaHapticLight();
    setReplyTarget(item);
    setReplyText('');
    setReplyOpen(true);
  }, []);

  const handleSendReply = useCallback(async () => {
    const userId = requireCurrentUserId();
    if (!userId || !replyTarget || !replyText.trim() || replySending) return;

    setReplySending(true);
    await withErrorAlert(async () => {
      await requestJson(`/api/admin/requests/${replyTarget.id}/reply`, {
        method: 'POST',
        body: {
          tg_user_id: userId,
          text: replyText.trim(),
        },
      });
      void twaHapticSuccess();
      closeReplyModal();
      setReplyText('');
      await showTwaAlert('Сообщение отправлено студенту в Telegram.');
    }, 'Не удалось отправить сообщение.');
    setReplySending(false);
  }, [requireCurrentUserId, replyTarget, replyText, replySending, withErrorAlert, closeReplyModal]);

  const handleSubmitEvent = useCallback(async () => {
    const userId = requireCurrentUserId();
    if (!userId || eventSubmitting) return;

    const normalizedTitle = eventTitle.trim();
    const normalizedPlace = eventPlace.trim();
    const normalizedDescription = eventDesc.trim();

    if (normalizedTitle.length < 2 || normalizedPlace.length < 2 || normalizedDescription.length < 5) {
      await showTwaError('Заполни все поля: название и место — от 2 символов, описание — от 5.');
      return;
    }

    setEventSubmitting(true);
    void twaHapticLight();

    await withErrorAlert(async () => {
      const result = await requestJson<{ delivered: number; total: number; event_id: number }>('/api/admin/events', {
        method: 'POST',
        body: {
          tg_user_id: userId,
          title: normalizedTitle,
          place: normalizedPlace,
          description: normalizedDescription,
        },
      });
      void twaHapticSuccess();
      setEventTitle('');
      setEventPlace('');
      setEventDesc('');
      await showTwaAlert(`Событие №${result.event_id} отправлено: ${result.delivered} из ${result.total} студентов.`);
    }, 'Ошибка публикации.');

    setEventSubmitting(false);
  }, [requireCurrentUserId, eventSubmitting, eventTitle, eventPlace, eventDesc, withErrorAlert]);

  const handleSubmitBroadcast = useCallback(async () => {
    const userId = requireCurrentUserId();
    if (!userId || broadcastSubmitting) return;

    const normalizedText = broadcastText.trim();
    if (!normalizedText) {
      await showTwaError('Введи текст рассылки.');
      return;
    }

    setBroadcastSubmitting(true);
    void twaHapticLight();

    await withErrorAlert(async () => {
      const result = await requestJson<{ delivered: number; total: number }>('/api/admin/broadcast', {
        method: 'POST',
        body: { tg_user_id: userId, text: normalizedText },
      });
      void twaHapticSuccess();
      setBroadcastText('');
      await showTwaAlert(`Доставлено: ${result.delivered} из ${result.total}.`);
    }, 'Ошибка рассылки.');

    setBroadcastSubmitting(false);
  }, [requireCurrentUserId, broadcastSubmitting, broadcastText, withErrorAlert]);

  const handleToggleBlock = useCallback(async (targetUserId: number, isBlocked: boolean) => {
    const userId = requireCurrentUserId();
    if (!userId || blockingUserId) return;
    setBlockingUserId(targetUserId);
    void twaHapticLight();

    await withErrorAlert(async () => {
      const action = isBlocked ? 'unblock' : 'block';
      await requestJson(`/api/admin/users/${targetUserId}/${action}`, {
        method: 'POST',
        body: { tg_user_id: userId },
      });
      setUsers((prev) =>
        prev.map((user) => (user.telegram_id === targetUserId ? { ...user, is_blocked: !isBlocked } : user))
      );
      void twaHapticSuccess();
    }, 'Не удалось изменить статус.');

    setBlockingUserId(null);
  }, [requireCurrentUserId, blockingUserId, withErrorAlert]);

  const accentBar = useCallback(
    (requestType: string) => TYPE_ACCENT[requestType] ?? 'from-[var(--tg-theme-button-color)] to-indigo-600',
    []
  );

  useEffect(() => {
    void withErrorAlert(async () => {
      const telegramUser = await getCurrentTgUser();
      setTgUserId(telegramUser.id);

      if (!adminId || telegramUser.id !== adminId) {
        await showTwaError('Эта панель только для ментора.');
        router.replace('/');
        return;
      }

      await Promise.all([
        loadStats(telegramUser.id, 'pending'),
        loadRequests(telegramUser.id, 'all', 'pending'),
        loadUsers(telegramUser.id),
      ]);
    }, 'Не удалось войти.');
  }, [adminId, router, loadStats, loadRequests, loadUsers, withErrorAlert]);

  useEffect(() => {
    if (!tgUserId) return;
    void withErrorAlert(() => loadStats(tgUserId, statusTab), 'Не удалось загрузить сводку заявок.');
  }, [tgUserId, statusTab, loadStats, withErrorAlert]);

  useEffect(() => {
    if (!tgUserId) return;
    void withErrorAlert(() => loadRequests(tgUserId, selectedFilter, statusTab), 'Не удалось загрузить заявки.');
  }, [tgUserId, selectedFilter, statusTab, loadRequests, withErrorAlert]);

  useEffect(() => {
    if (!tgUserId || tab !== 'meetings') return;
    void withErrorAlert(() => loadMeetingsAndSchedule(tgUserId), 'Не удалось загрузить слоты и расписание.');
  }, [tgUserId, tab, loadMeetingsAndSchedule, withErrorAlert]);

  return {
    adminId,
    tab,
    setTab: handleTabChange,
    selectedFilter,
    setSelectedFilter: handleFilterChange,
    statusTab,
    setStatusTab: handleStatusChange,
    loading,
    tgUserId,
    resolvingId,
    users,
    usersLoading,
    blockingUserId,
    replyOpen,
    replyTarget,
    replyText,
    setReplyText,
    replySending,
    eventTitle,
    setEventTitle,
    eventPlace,
    setEventPlace,
    eventDesc,
    setEventDesc,
    eventSubmitting,
    broadcastText,
    setBroadcastText,
    broadcastSubmitting,
    meetings,
    meetingsLoading,
    meetingActionId,
    weeklyHours,
    setWeeklyHours,
    slotMinutes,
    setSlotMinutes,
    scheduleTimezone,
    setScheduleTimezone,
    scheduleLoading,
    scheduleSaving,
    categoryCounters,
    visibleItems,
    accentBar,
    refreshAll,
    handleBack,
    handleSaveSchedule,
    handleConfirmMeeting,
    handleCompleteMeeting,
    handleResolveRequest,
    handleOpenReply,
    handleCloseReply: closeReplyModal,
    handleSendReply,
    handleSubmitEvent,
    handleSubmitBroadcast,
    handleToggleBlock,
    loadMeetingsAndSchedule,
  };
}
