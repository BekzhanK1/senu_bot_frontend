'use client';

import { Bell, CheckCircle2, Loader2, MessageCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { requestTypeLabelRu } from '@/lib/requestLabels';
import { FILTERS } from './constants';
import type { AdminRequestItem } from './types';

type Props = {
  loading: boolean;
  statusTab: 'pending' | 'resolved';
  selectedFilter: string;
  categoryCounters: Record<string, number>;
  visibleItems: AdminRequestItem[];
  resolvingId: number | null;
  onStatusChange: (status: 'pending' | 'resolved') => void;
  onRefresh: () => void;
  onFilterChange: (filter: string) => void;
  onResolve: (id: number) => void;
  onReply: (item: AdminRequestItem) => void;
  accentBar: (requestType: string) => string;
};

export function RequestsTab({
  loading,
  statusTab,
  selectedFilter,
  categoryCounters,
  visibleItems,
  resolvingId,
  onStatusChange,
  onRefresh,
  onFilterChange,
  onResolve,
  onReply,
  accentBar,
}: Props) {
  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2 p-1 rounded-xl bg-[var(--tg-theme-secondary-bg-color)]">
          {(['pending', 'resolved'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onStatusChange(s)}
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
          onClick={onRefresh}
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
            onClick={() => onFilterChange(f.key)}
            className={cn(
              'px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-all border',
              selectedFilter === f.key
                ? 'border-[var(--tg-theme-button-color)] bg-[var(--tg-theme-button-color)]/10 text-[var(--tg-theme-text-color)]'
                : 'border-transparent bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-hint-color)]'
            )}
          >
            {f.label} <span className="opacity-60">({categoryCounters[f.key] ?? 0})</span>
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
                      onClick={() => onReply(item)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] text-sm font-semibold active:scale-[0.98] transition-transform"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Ответить
                    </button>
                    <button
                      type="button"
                      onClick={() => onResolve(item.id)}
                      disabled={resolvingId === item.id}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform"
                    >
                      {resolvingId === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
