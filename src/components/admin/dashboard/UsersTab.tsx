'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { AdminUserItem } from './types';

type Props = {
  usersLoading: boolean;
  users: AdminUserItem[];
  blockingUserId: number | null;
  adminId: number;
  onToggleBlock: (targetUserId: number, isBlocked: boolean) => void;
};

export function UsersTab({ usersLoading, users, blockingUserId, adminId, onToggleBlock }: Props) {
  return (
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
                onClick={() => onToggleBlock(user.telegram_id, user.is_blocked)}
                disabled={blockingUserId === user.telegram_id || user.telegram_id === adminId}
                className={cn(
                  'shrink-0 px-3 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-40',
                  user.is_blocked ? 'bg-emerald-600' : 'bg-rose-600'
                )}
              >
                {blockingUserId === user.telegram_id ? '…' : user.is_blocked ? 'Разблок.' : 'Блок'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
