'use client';

import { cn } from '@/lib/cn';
import type { TabId } from './types';
import { TABS } from './constants';

type Props = {
  tab: TabId;
  onTabChange: (tab: TabId) => void;
};

export function DashboardTabs({ tab, onTabChange }: Props) {
  return (
    <div className="px-4 -mt-2 mb-4">
      <div className="flex gap-1 p-1 rounded-2xl bg-[var(--tg-theme-secondary-bg-color)] border border-black/[0.04] dark:border-white/[0.06]">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
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
  );
}
