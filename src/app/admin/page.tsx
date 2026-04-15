'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { getCurrentTgUser, showTwaError } from '@/lib/twa';
import { useTwaBackButton } from '@/lib/useTwaBackButton';

type AdminRequestItem = {
  id: number;
  user_id: number;
  user_full_name: string;
  user_username?: string | null;
  request_type: string;
  content: string;
  status: 'pending' | 'resolved' | string;
  created_at: string;
};

type AdminUserItem = {
  telegram_id: number;
  username?: string | null;
  full_name: string;
  joined_at: string;
  is_blocked: boolean;
};

const FILTERS: Array<{ key: string; label: string }> = [
  { key: 'all', label: 'Все' },
  { key: 'meeting', label: 'Встречи' },
  { key: 'game_108', label: 'Игра 108' },
  { key: 'question', label: 'Вопросы' },
  { key: 'anonymous_question', label: 'Анонимные' },
];

export default function AdminPage() {
  const router = useRouter();
  const [items, setItems] = useState<AdminRequestItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedStatusTab, setSelectedStatusTab] = useState<'pending' | 'resolved'>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [tgUserId, setTgUserId] = useState<number | null>(null);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [blockingUserId, setBlockingUserId] = useState<number | null>(null);
  const adminId = Number(process.env.NEXT_PUBLIC_ADMIN_ID || 0);

  useTwaBackButton(router);

  const categoryCounters = useMemo(() => {
    const base = { all: items.length, meeting: 0, game_108: 0, question: 0, anonymous_question: 0 };
    for (const item of items) {
      if (item.request_type in base) {
        base[item.request_type as keyof typeof base] += 1;
      }
    }
    return base;
  }, [items]);

  const visibleItems = useMemo(() => {
    if (selectedFilter === 'all') return items;
    return items.filter((item) => item.request_type === selectedFilter);
  }, [items, selectedFilter]);

  const loadRequests = useCallback(async (userId: number, filter: string, status: 'pending' | 'resolved') => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ tg_user_id: String(userId) });
      if (filter !== 'all') params.set('request_type', filter);
      params.set('status', status);
      const response = await fetch(`/api/admin/requests?${params.toString()}`, { cache: 'no-store' });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Не удалось загрузить заявки.');
      }
      const data = (await response.json()) as { items: AdminRequestItem[] };
      setItems(data.items ?? []);
    } catch (e) {
      await showTwaError(e instanceof Error ? e : new Error('Ошибка загрузки админ-данных.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async (userId: number) => {
    setIsUsersLoading(true);
    try {
      const params = new URLSearchParams({ tg_user_id: String(userId) });
      const response = await fetch(`/api/admin/users?${params.toString()}`, { cache: 'no-store' });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Не удалось загрузить пользователей.');
      }
      const data = (await response.json()) as { items: AdminUserItem[] };
      setUsers(data.items ?? []);
    } catch (e) {
      await showTwaError(e instanceof Error ? e : new Error('Ошибка загрузки пользователей.'));
    } finally {
      setIsUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const tgUser = await getCurrentTgUser();
        setTgUserId(tgUser.id);
        if (!adminId || tgUser.id !== adminId) {
          await showTwaError('Доступ только для администратора.');
          router.replace('/');
          return;
        }
        await Promise.all([loadRequests(tgUser.id, 'all', 'pending'), loadUsers(tgUser.id)]);
      } catch (e) {
        await showTwaError(e instanceof Error ? e : new Error('Не удалось определить пользователя.'));
        router.replace('/');
      }
    })();
  }, [adminId, loadRequests, loadUsers, router]);

  useEffect(() => {
    if (!tgUserId) return;
    void loadRequests(tgUserId, selectedFilter, selectedStatusTab);
  }, [loadRequests, selectedFilter, selectedStatusTab, tgUserId]);

  const toggleBlockUser = async (targetUserId: number, isBlocked: boolean) => {
    if (!tgUserId || blockingUserId) return;
    setBlockingUserId(targetUserId);
    try {
      const action = isBlocked ? 'unblock' : 'block';
      const response = await fetch(`/api/admin/users/${targetUserId}/${action}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tg_user_id: tgUserId }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Не удалось изменить блокировку.');
      }
      setUsers((prev) =>
        prev.map((user) => (user.telegram_id === targetUserId ? { ...user, is_blocked: !isBlocked } : user))
      );
    } catch (e) {
      await showTwaError(e instanceof Error ? e : new Error('Ошибка блокировки пользователя.'));
    } finally {
      setBlockingUserId(null);
    }
  };

  const markResolved = async (id: number) => {
    if (!tgUserId || resolvingId) return;
    setResolvingId(id);
    try {
      const response = await fetch(`/api/admin/requests/${id}/resolve`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tg_user_id: tgUserId }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Не удалось обновить статус.');
      }
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: 'resolved' } : item)));
    } catch (e) {
      await showTwaError(e instanceof Error ? e : new Error('Ошибка обновления статуса.'));
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <main className="p-4 min-h-screen">
      <div className="flex items-center gap-2 mb-6 text-[var(--tg-theme-button-color)]" onClick={() => router.back()}>
        <ChevronLeft className="w-5 h-5" />
        <span className="font-medium">Назад</span>
      </div>

      <h1 className="text-2xl font-bold mb-2">Admin Panel</h1>
      <p className="text-sm text-[var(--tg-theme-hint-color)] mb-4">Все заявки пользователей с фильтрами и сменой статуса.</p>

      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setSelectedStatusTab('pending')}
          className={`px-3 py-2 rounded-xl text-xs transition-all ${
            selectedStatusTab === 'pending'
              ? 'bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]'
              : 'bg-[var(--tg-theme-secondary-bg-color)]'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setSelectedStatusTab('resolved')}
          className={`px-3 py-2 rounded-xl text-xs transition-all ${
            selectedStatusTab === 'resolved'
              ? 'bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]'
              : 'bg-[var(--tg-theme-secondary-bg-color)]'
          }`}
        >
          Resolved
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {FILTERS.map((filter) => (
          <button
            key={filter.key}
            onClick={() => setSelectedFilter(filter.key)}
            className={`px-3 py-2 rounded-xl text-xs whitespace-nowrap transition-all ${
              selectedFilter === filter.key
                ? 'bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]'
                : 'bg-[var(--tg-theme-secondary-bg-color)]'
            }`}
          >
            {filter.label} ({categoryCounters[filter.key as keyof typeof categoryCounters] ?? 0})
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-sm text-[var(--tg-theme-hint-color)]">Загрузка...</div>
      ) : visibleItems.length === 0 ? (
        <div className="text-sm text-[var(--tg-theme-hint-color)]">Заявок нет.</div>
      ) : (
        <div className="space-y-3 pb-10">
          {visibleItems.map((item) => (
            <div key={item.id} className="p-4 rounded-2xl bg-[var(--tg-theme-secondary-bg-color)]">
              <div className="flex justify-between gap-2 mb-2">
                <div className="font-semibold">#{item.id} • {item.request_type}</div>
                <div className={`text-xs px-2 py-1 rounded-lg ${item.status === 'resolved' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>
                  {item.status === 'resolved' ? 'resolved' : 'pending'}
                </div>
              </div>
              <div className="text-sm mb-1">{item.user_full_name} {item.user_username ? `(@${item.user_username})` : ''}</div>
              <div className="text-xs opacity-70 mb-2">{new Date(item.created_at).toLocaleString('ru-RU')}</div>
              <pre className="text-xs whitespace-pre-wrap break-words mb-3">{item.content}</pre>
              {item.status !== 'resolved' && (
                <button
                  onClick={() => markResolved(item.id)}
                  disabled={resolvingId === item.id}
                  className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm disabled:opacity-50"
                >
                  {resolvingId === item.id ? 'Обновление...' : 'Отметить решено'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-xl font-bold mb-2">Пользователи</h2>
        <p className="text-sm text-[var(--tg-theme-hint-color)] mb-3">Заблокированные не смогут писать боту и использовать Mini App.</p>
        {isUsersLoading ? (
          <div className="text-sm text-[var(--tg-theme-hint-color)]">Загрузка пользователей...</div>
        ) : users.length === 0 ? (
          <div className="text-sm text-[var(--tg-theme-hint-color)]">Пользователей пока нет.</div>
        ) : (
          <div className="space-y-2 pb-10">
            {users.map((user) => (
              <div key={user.telegram_id} className="p-3 rounded-2xl bg-[var(--tg-theme-secondary-bg-color)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{user.full_name}</div>
                    <div className="text-xs opacity-70">
                      ID: {user.telegram_id} {user.username ? `• @${user.username}` : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleBlockUser(user.telegram_id, user.is_blocked)}
                    disabled={blockingUserId === user.telegram_id || user.telegram_id === adminId}
                    className={`px-3 py-2 rounded-xl text-xs text-white disabled:opacity-50 ${
                      user.is_blocked ? 'bg-emerald-600' : 'bg-rose-600'
                    }`}
                  >
                    {blockingUserId === user.telegram_id
                      ? 'Обновление...'
                      : user.is_blocked
                        ? 'Разблокировать'
                        : 'Заблокировать'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
