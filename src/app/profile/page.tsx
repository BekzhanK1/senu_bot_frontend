'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { getCurrentTgUser, loadWebApp, showTwaError } from '@/lib/twa';
import { useTwaBackButton } from '@/lib/useTwaBackButton';

type UserRequestItem = {
  id: number;
  request_type: string;
  content: string;
  status: 'pending' | 'resolved' | string;
  created_at: string;
};

type UserProfile = {
  tg_user_id: number;
  username?: string | null;
  full_name: string;
  is_blocked: boolean;
  requests: UserRequestItem[];
};

const STATUS_FILTERS: Array<{ key: 'all' | 'pending' | 'resolved'; label: string }> = [
  { key: 'all', label: 'Все' },
  { key: 'pending', label: 'Pending' },
  { key: 'resolved', label: 'Resolved' },
];

const TYPE_FILTERS: Array<{ key: string; label: string }> = [
  { key: 'all', label: 'Все типы' },
  { key: 'meeting', label: 'Встречи' },
  { key: 'game_108', label: 'Игра 108' },
  { key: 'question', label: 'Вопросы' },
  { key: 'anonymous_question', label: 'Анонимные' },
];

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tgInitData, setTgInitData] = useState<string>('');
  const [tgInitDataUnsafe, setTgInitDataUnsafe] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});

  useTwaBackButton(router);

  const counters = useMemo(() => {
    const requests = profile?.requests ?? [];
    const pending = requests.filter((r) => r.status === 'pending').length;
    const resolved = requests.filter((r) => r.status === 'resolved').length;
    return { pending, resolved };
  }, [profile?.requests]);

  const visibleRequests = useMemo(() => {
    const requests = profile?.requests ?? [];
    return requests.filter((req) => {
      const statusOk = statusFilter === 'all' ? true : req.status === statusFilter;
      const typeOk = typeFilter === 'all' ? true : req.request_type === typeFilter;
      return statusOk && typeOk;
    });
  }, [profile?.requests, statusFilter, typeFilter]);

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    void loadWebApp()
      .then((w) => {
        setTgInitData(w.initData || '(empty)');
        setTgInitDataUnsafe(JSON.stringify(w.initDataUnsafe ?? {}, null, 2));
      })
      .catch(() => {
        setTgInitData('(not available outside Telegram)');
        setTgInitDataUnsafe('(not available outside Telegram)');
      });
  }, []);

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      try {
        const tgUser = await getCurrentTgUser();
        const response = await fetch('/api/profile/me', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            tg_user_id: tgUser.id,
            username: tgUser.username,
            full_name: tgUser.full_name,
          }),
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || 'Не удалось загрузить профиль.');
        }
        const data = (await response.json()) as UserProfile;
        setProfile(data);
      } catch (e) {
        await showTwaError(e instanceof Error ? e : new Error('Ошибка загрузки профиля.'));
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <main className="p-4 min-h-screen">
      <div className="flex items-center gap-2 mb-6 text-[var(--tg-theme-button-color)]" onClick={() => router.back()}>
        <ChevronLeft className="w-5 h-5" />
        <span className="font-medium">Назад</span>
      </div>

      <h1 className="text-2xl font-bold mb-2">Мой профиль</h1>
      <p className="text-sm text-[var(--tg-theme-hint-color)] mb-4">Твои данные и история заявок.</p>
      <div className="p-4 rounded-2xl bg-[var(--tg-theme-secondary-bg-color)] mb-4">
        <div className="font-semibold mb-2">Telegram initData (dev)</div>
        <pre className="text-xs whitespace-pre-wrap break-all opacity-80">{tgInitData || 'Загрузка...'}</pre>
        <div className="font-semibold mt-3 mb-2">Telegram initDataUnsafe (dev)</div>
        <pre className="text-xs whitespace-pre-wrap break-words opacity-80">{tgInitDataUnsafe || 'Загрузка...'}</pre>
      </div>

      {isLoading ? (
        <div className="text-sm text-[var(--tg-theme-hint-color)]">Загрузка...</div>
      ) : !profile ? (
        <div className="text-sm text-[var(--tg-theme-hint-color)]">Профиль не найден. Нажми /start в боте.</div>
      ) : (
        <>
          <div className="p-4 rounded-2xl bg-[var(--tg-theme-secondary-bg-color)] mb-4">
            <div className="font-semibold">{profile.full_name}</div>
            <div className="text-sm opacity-80">ID: {profile.tg_user_id}</div>
            <div className="text-sm opacity-80">{profile.username ? `@${profile.username}` : 'Без username'}</div>
            <div className={`mt-2 inline-flex px-2 py-1 text-xs rounded-lg ${profile.is_blocked ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>
              {profile.is_blocked ? 'Доступ ограничен' : 'Аккаунт активен'}
            </div>
          </div>

          <h2 className="text-lg font-bold mb-2">Мои заявки</h2>
          <div className="flex gap-2 mb-3">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setStatusFilter(filter.key)}
                className={`px-3 py-2 rounded-xl text-xs transition-all ${
                  statusFilter === filter.key
                    ? 'bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]'
                    : 'bg-[var(--tg-theme-secondary-bg-color)]'
                }`}
              >
                {filter.label}
                {filter.key === 'pending' ? ` (${counters.pending})` : ''}
                {filter.key === 'resolved' ? ` (${counters.resolved})` : ''}
              </button>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
            {TYPE_FILTERS.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setTypeFilter(filter.key)}
                className={`px-3 py-2 rounded-xl text-xs whitespace-nowrap transition-all ${
                  typeFilter === filter.key
                    ? 'bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]'
                    : 'bg-[var(--tg-theme-secondary-bg-color)]'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {profile.requests.length === 0 ? (
            <div className="text-sm text-[var(--tg-theme-hint-color)]">У тебя пока нет заявок.</div>
          ) : visibleRequests.length === 0 ? (
            <div className="text-sm text-[var(--tg-theme-hint-color)]">Нет заявок под выбранные фильтры.</div>
          ) : (
            <div className="space-y-3 pb-8">
              {visibleRequests.map((req) => {
                const isExpanded = !!expandedIds[req.id];
                const isLong = req.content.length > 180;
                const contentToShow = isExpanded || !isLong ? req.content : `${req.content.slice(0, 180)}...`;
                return (
                <div key={req.id} className="p-4 rounded-2xl bg-[var(--tg-theme-secondary-bg-color)]">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="font-semibold">#{req.id} • {req.request_type}</div>
                    <div className={`text-xs px-2 py-1 rounded-lg ${req.status === 'resolved' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>
                      {req.status}
                    </div>
                  </div>
                  <div className="text-xs opacity-70 mb-2">{new Date(req.created_at).toLocaleString('ru-RU')}</div>
                  <pre className="text-xs whitespace-pre-wrap break-words">{contentToShow}</pre>
                  {isLong && (
                    <button
                      onClick={() => toggleExpanded(req.id)}
                      className="mt-2 text-xs text-[var(--tg-theme-button-color)]"
                    >
                      {isExpanded ? 'Свернуть' : 'Показать полностью'}
                    </button>
                  )}
                </div>
              )})}
            </div>
          )}
        </>
      )}
    </main>
  );
}
