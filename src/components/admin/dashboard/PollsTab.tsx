'use client';

import { useState } from 'react';
import { callApi, showTwaAlert, showTwaError } from '@/lib/twa';
import { Loader2, Plus, X } from 'lucide-react';

export default function PollsTab() {
  const [title, setTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setIsCreating(true);
    const ok = await callApi('admin/poll/create', 'POST', { title: title.trim() });
    if (ok) {
      setTitle('');
      await showTwaAlert('Новый опрос успешно запущен! Старые опросы завершены.');
    } else {
      await showTwaError('Ошибка при создании опроса');
    }
    setIsCreating(false);
  };

  const handleClose = async () => {
    setIsClosing(true);
    const ok = await callApi('admin/poll/close', 'POST', {});
    if (ok) {
      await showTwaAlert('Текущий опрос успешно завершен.');
    } else {
      await showTwaError('Ошибка при завершении опроса');
    }
    setIsClosing(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
        <h2 className="text-lg font-bold mb-4">Управление опросами</h2>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-[var(--tg-theme-hint-color)]">
            Создать новый опрос (отменит текущий)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Название опроса..."
              className="flex-1 p-3 rounded-xl bg-[var(--tg-theme-secondary-bg-color)] outline-none text-sm focus:border-[var(--tg-theme-button-color)] border border-transparent transition-colors"
            />
            <button
              onClick={handleCreate}
              disabled={!title.trim() || isCreating}
              className="p-3 bg-blue-500 text-white rounded-xl active:scale-95 transition-all disabled:opacity-50"
            >
              {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <button
            onClick={handleClose}
            disabled={isClosing}
            className="flex items-center gap-2 justify-center w-full p-3 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-xl font-bold active:scale-95 transition-all disabled:opacity-50"
          >
            {isClosing ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
            Завершить текущий опрос
          </button>
        </div>
      </div>
    </div>
  );
}
