'use client';

import { useState } from 'react';
import { MoreHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { TabId } from './types';
import { PRIMARY_TABS, SECONDARY_TABS } from './constants';

type Props = {
  tab: TabId;
  onTabChange: (tab: TabId) => void;
};

export function DashboardTabs({ tab, onTabChange }: Props) {
  const [showMore, setShowMore] = useState(false);
  const isSecondaryTab = SECONDARY_TABS.some(t => t.id === tab);

  return (
    <div className="px-4 -mt-2 mb-4">
      <div className="flex gap-2 p-2 bg-[var(--tg-theme-secondary-bg-color)] rounded-2xl border border-black/[0.04] dark:border-white/[0.06]">
        {/* Primary tabs */}
        {PRIMARY_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-[10px] font-semibold transition-all min-w-0',
              tab === id
                ? 'bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] shadow-md'
                : 'text-[var(--tg-theme-hint-color)]'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" strokeWidth={2.5} />
            <span className="truncate w-full text-center">{label}</span>
          </button>
        ))}

        {/* More button */}
        <button
          type="button"
          onClick={() => setShowMore(!showMore)}
          className={cn(
            'flex flex-col items-center gap-1 py-2 px-3 rounded-xl text-[10px] font-semibold transition-all shrink-0',
            isSecondaryTab || showMore
              ? 'bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] shadow-md'
              : 'text-[var(--tg-theme-hint-color)]'
          )}
        >
          <MoreHorizontal className="w-4 h-4 shrink-0" strokeWidth={2.5} />
          <span className="whitespace-nowrap">Ещё</span>
        </button>
      </div>

      {/* More menu */}
      {showMore && (
        <div className="mt-2 p-2 bg-[var(--tg-theme-secondary-bg-color)] rounded-2xl border border-black/[0.04] dark:border-white/[0.06] space-y-1">
          <div className="flex items-center justify-between px-2 py-1 mb-1">
            <span className="text-xs font-semibold text-[var(--tg-theme-hint-color)]">
              Дополнительно
            </span>
            <button
              onClick={() => setShowMore(false)}
              className="text-[var(--tg-theme-hint-color)]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {SECONDARY_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                onTabChange(id);
                setShowMore(false);
              }}
              className={cn(
                'w-full flex items-center gap-3 py-2.5 px-3 rounded-xl text-sm font-medium transition-all',
                tab === id
                  ? 'bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]'
                  : 'text-[var(--tg-theme-text-color)] hover:bg-[var(--tg-theme-bg-color)]'
              )}
            >
              <Icon className="w-5 h-5 shrink-0" strokeWidth={2} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
