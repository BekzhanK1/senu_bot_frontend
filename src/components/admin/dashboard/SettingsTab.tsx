'use client';

import { Loader2, Save } from 'lucide-react';
import type { AppSettings } from './types';

type Props = {
  settings: AppSettings;
  loading: boolean;
  saving: boolean;
  onChange: (next: AppSettings) => void;
  onRefresh: () => void;
  onSave: () => void;
};

export function SettingsTab({ settings, loading, saving, onChange, onRefresh, onSave }: Props) {
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--tg-theme-button-color)]" />
      </div>
    );
  }

  const setField = (field: keyof AppSettings, value: string) => {
    onChange({ ...settings, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl p-4 border border-black/[0.06]">
        <h2 className="font-bold text-lg">Контент и настройки бота</h2>
        <p className="text-xs text-[var(--tg-theme-hint-color)] mt-1">
          Здесь можно менять тексты и ключевые параметры без правок кода.
        </p>
      </div>

      <label className="block space-y-1">
        <span className="text-xs font-semibold uppercase text-[var(--tg-theme-hint-color)]">Welcome message (HTML)</span>
        <textarea
          rows={8}
          value={settings.welcome_message}
          onChange={(e) => setField('welcome_message', e.target.value)}
          className="w-full rounded-2xl px-4 py-3 bg-[var(--tg-theme-secondary-bg-color)] border border-black/[0.06] text-sm"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-semibold uppercase text-[var(--tg-theme-hint-color)]">Текст «О менторе» (HTML)</span>
        <textarea
          rows={7}
          value={settings.mentor_about_text}
          onChange={(e) => setField('mentor_about_text', e.target.value)}
          className="w-full rounded-2xl px-4 py-3 bg-[var(--tg-theme-secondary-bg-color)] border border-black/[0.06] text-sm"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-semibold uppercase text-[var(--tg-theme-hint-color)]">Фото ментора (URL)</span>
        <input
          value={settings.mentor_photo_url}
          onChange={(e) => setField('mentor_photo_url', e.target.value)}
          className="w-full rounded-2xl px-4 py-3 bg-[var(--tg-theme-secondary-bg-color)] border border-black/[0.06] text-sm"
        />
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block space-y-1">
          <span className="text-xs font-semibold uppercase text-[var(--tg-theme-hint-color)]">PCS bot username</span>
          <input
            value={settings.support_bot_username}
            onChange={(e) => setField('support_bot_username', e.target.value)}
            className="w-full rounded-2xl px-4 py-3 bg-[var(--tg-theme-secondary-bg-color)] border border-black/[0.06] text-sm"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-semibold uppercase text-[var(--tg-theme-hint-color)]">PCS hotline</span>
          <input
            value={settings.support_hotline}
            onChange={(e) => setField('support_hotline', e.target.value)}
            className="w-full rounded-2xl px-4 py-3 bg-[var(--tg-theme-secondary-bg-color)] border border-black/[0.06] text-sm"
          />
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-xs font-semibold uppercase text-[var(--tg-theme-hint-color)]">Mini App subtitle</span>
        <input
          value={settings.miniapp_home_title}
          onChange={(e) => setField('miniapp_home_title', e.target.value)}
          className="w-full rounded-2xl px-4 py-3 bg-[var(--tg-theme-secondary-bg-color)] border border-black/[0.06] text-sm"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-semibold uppercase text-[var(--tg-theme-hint-color)]">Mini App footer</span>
        <input
          value={settings.miniapp_home_footer}
          onChange={(e) => setField('miniapp_home_footer', e.target.value)}
          className="w-full rounded-2xl px-4 py-3 bg-[var(--tg-theme-secondary-bg-color)] border border-black/[0.06] text-sm"
        />
      </label>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onRefresh}
          className="flex-1 py-3 rounded-2xl font-semibold bg-[var(--tg-theme-secondary-bg-color)]"
        >
          Обновить
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={onSave}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-[var(--tg-theme-button-text-color)] bg-[var(--tg-theme-button-color)] disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Сохранить
        </button>
      </div>
    </div>
  );
}
